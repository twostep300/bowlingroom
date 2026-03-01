import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getCmsRuntimeConfig } from '@/lib/cms-platform';
import { listPagesFromPayload, readPageContentFromPayload } from '@/lib/payload-cms';
import {
  createHistorySnapshot as createFileSnapshot,
  getDiff,
  isValidPageKey,
  isValidSnapshotId,
  listHistory as listFileHistory,
  listPages as listFilePages,
  pageExists as filePageExists,
  readHistorySnapshot as readFileSnapshot,
  readPageContent as readFileContent,
  writeLegacyContent,
  writePageContent as writeFileContent
} from '@/lib/legacy-cms';

export type CmsObject = Record<string, unknown>;

type StorageMode = 'db' | 'file' | 'hybrid';

function mode(): StorageMode {
  const value = (process.env.CMS_STORAGE_MODE || 'hybrid').toLowerCase();
  if (value === 'db' || value === 'file' || value === 'hybrid') return value;
  return 'hybrid';
}

async function findPage(slug: string) {
  return db.contentPage.findUnique({ where: { slug } });
}

async function ensurePageFromFile(slug: string) {
  const existing = await findPage(slug);
  if (existing) return existing;
  if (!filePageExists(slug)) return null;

  const content = readFileContent(slug);
  const title = String((content.site as CmsObject | undefined)?.title || (content.title as string) || slug);

  return db.contentPage.create({
    data: {
      slug,
      title,
      seoTitle: title,
      content: content as Prisma.InputJsonValue,
      status: 'PUBLISHED',
      publishedAt: new Date()
    }
  });
}

export async function listPagesFromStorage() {
  const runtime = await getCmsRuntimeConfig();
  if (runtime.cmsPlatform === 'payload' && runtime.payloadReadMode === 'all') {
    const payloadPages = await listPagesFromPayload().catch(() => []);
    if (payloadPages.length > 0) return payloadPages;
  }

  const storage = mode();
  if (storage === 'file') return listFilePages();
  if (storage === 'hybrid') {
    const filePages = listFilePages();
    if (filePages.length > 0) return filePages;
  }

  try {
    const pages = await db.contentPage.findMany({ select: { slug: true }, orderBy: { slug: 'asc' } });
    if (pages.length > 0) return pages.map((p) => p.slug);
    if (storage === 'db') return [];
  } catch {
    if (storage === 'db') throw new Error('DB unavailable while listing pages');
  }
  return listFilePages();
}

export async function readContentFromStorage(slug: string): Promise<CmsObject | null> {
  if (!isValidPageKey(slug)) return null;

  const runtime = await getCmsRuntimeConfig();
  if (runtime.cmsPlatform === 'payload' && runtime.payloadReadMode === 'all') {
    const fromPayload = await readPageContentFromPayload(slug, { draft: false }).catch(() => null);
    if (fromPayload) return fromPayload;
  }

  const storage = mode();
  if (storage === 'hybrid' && filePageExists(slug)) {
    return readFileContent(slug);
  }

  if (storage !== 'file') {
    try {
      const page = await ensurePageFromFile(slug);
      if (page?.content && typeof page.content === 'object' && !Array.isArray(page.content)) {
        return page.content as CmsObject;
      }
      if (storage === 'db') return null;
    } catch {
      if (storage === 'db') throw new Error('DB unavailable while reading content');
    }
  }

  if (!filePageExists(slug)) return null;
  return readFileContent(slug);
}

export async function saveContentToStorage(slug: string, content: CmsObject) {
  if (!isValidPageKey(slug)) throw new Error('Invalid page key');

  const storage = mode();
  if (storage !== 'file') {
    try {
      const page = await ensurePageFromFile(slug);
      const existing = page ||
        (await db.contentPage.create({
          data: {
            slug,
            title: String((content.site as CmsObject | undefined)?.title || (content.title as string) || slug),
            content: content as Prisma.InputJsonValue,
            status: 'PUBLISHED',
            publishedAt: new Date()
          }
        }));

      const before = (existing.content && typeof existing.content === 'object' && !Array.isArray(existing.content)
        ? (existing.content as CmsObject)
        : null);

      if (before) {
        await db.contentRevision.create({
          data: {
            pageId: existing.id,
            reason: 'auto-before-save',
            content: before as Prisma.InputJsonValue
          }
        });
      }

      await db.contentPage.update({
        where: { id: existing.id },
        data: {
          title: String((content.site as CmsObject | undefined)?.title || (content.title as string) || existing.title),
          content: content as Prisma.InputJsonValue
        }
      });

      if (storage === 'db') return;
    } catch {
      if (storage === 'db') throw new Error('DB unavailable while saving content');
    }
  }

  if (filePageExists(slug)) {
    createFileSnapshot(slug, readFileContent(slug), 'auto-before-save');
  }
  writeFileContent(slug, content);
  if (slug === 'koblenz') writeLegacyContent(content);
}

export async function listHistoryFromStorage(slug: string) {
  if (!isValidPageKey(slug)) return [];

  const storage = mode();
  if (storage !== 'file') {
    try {
      const page = await ensurePageFromFile(slug);
      if (page) {
        const revisions = await db.contentRevision.findMany({
          where: { pageId: page.id },
          orderBy: { createdAt: 'desc' },
          take: 80
        });
        return revisions.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString(), reason: r.reason, size: 0 }));
      }
      if (storage === 'db') return [];
    } catch {
      if (storage === 'db') throw new Error('DB unavailable while listing history');
    }
  }

  return listFileHistory(slug);
}

export async function createSnapshotInStorage(slug: string, reason: string) {
  const storage = mode();
  const content = await readContentFromStorage(slug);
  if (!content) throw new Error('Page not found');

  if (storage !== 'file') {
    try {
      const page = await ensurePageFromFile(slug);
      if (page) {
        const revision = await db.contentRevision.create({
          data: {
            pageId: page.id,
            reason,
            content: content as Prisma.InputJsonValue
          }
        });
        if (storage === 'db') return { id: revision.id, createdAt: revision.createdAt.toISOString(), reason };
      }
    } catch {
      if (storage === 'db') throw new Error('DB unavailable while creating snapshot');
    }
  }

  const fileShot = createFileSnapshot(slug, content, reason);
  return { id: fileShot.id, createdAt: fileShot.createdAt, reason };
}

async function readSnapshotContent(slug: string, snapshotId: string): Promise<CmsObject | null> {
  if (!isValidSnapshotId(snapshotId)) return null;

  const storage = mode();
  if (storage !== 'file') {
    try {
      const page = await ensurePageFromFile(slug);
      if (page) {
        const revision = await db.contentRevision.findFirst({
          where: { id: snapshotId, pageId: page.id }
        });
        if (revision?.content && typeof revision.content === 'object' && !Array.isArray(revision.content)) {
          return revision.content as CmsObject;
        }
      }
      if (storage === 'db') return null;
    } catch {
      if (storage === 'db') throw new Error('DB unavailable while reading snapshot');
    }
  }

  const fileData = readFileSnapshot(slug, snapshotId);
  if (!fileData || typeof fileData !== 'object' || Array.isArray(fileData)) return null;
  return fileData as CmsObject;
}

export async function diffSnapshotsFromStorage(slug: string, fromId: string, toId: string) {
  const fromData = await readSnapshotContent(slug, fromId);
  if (!fromData) throw new Error('From snapshot not found');

  const toData = toId === 'live' ? await readContentFromStorage(slug) : await readSnapshotContent(slug, toId);
  if (!toData) throw new Error(toId === 'live' ? 'Live content not found' : 'To snapshot not found');

  return getDiff(fromData, toData);
}

export async function restoreSnapshotFromStorage(slug: string, snapshotId: string) {
  const snapshotData = await readSnapshotContent(slug, snapshotId);
  if (!snapshotData) throw new Error('Snapshot not found');

  const current = await readContentFromStorage(slug);
  if (!current) throw new Error('Page not found');

  const storage = mode();
  if (storage !== 'file') {
    try {
      const page = await ensurePageFromFile(slug);
      if (page) {
        await db.contentRevision.create({
          data: {
            pageId: page.id,
            reason: 'auto-before-restore',
            content: current as Prisma.InputJsonValue
          }
        });
        await db.contentPage.update({
          where: { id: page.id },
          data: { content: snapshotData as Prisma.InputJsonValue }
        });
        if (storage === 'db') return snapshotData;
      }
    } catch {
      if (storage === 'db') throw new Error('DB unavailable while restoring snapshot');
    }
  }

  createFileSnapshot(slug, current, 'auto-before-restore');
  writeFileContent(slug, snapshotData);
  if (slug === 'koblenz') writeLegacyContent(snapshotData);
  return snapshotData;
}

export function validateSnapshotId(value: string) {
  return isValidSnapshotId(value);
}

export { isValidPageKey };
