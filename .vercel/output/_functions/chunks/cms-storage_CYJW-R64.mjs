import { d as db } from './db_DSJcG3jK.mjs';
import { g as getCmsRuntimeConfig } from './cms-platform_HsZsHVYA.mjs';
import { r as readPageContentFromPayload, l as listPagesFromPayload } from './payload-cms_DGSW8rk7.mjs';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const HISTORY_DIR = path.join(ROOT, "content", "history");
const LEGACY_CONTENT_FILE = path.join(ROOT, "content", "content.json");
const MAX_HISTORY_FILES_PER_PAGE = 80;
function isValidPageKey(pageKey) {
  return /^[a-z0-9-]+$/i.test(pageKey);
}
function pageContentFile(pageKey) {
  return path.join(PAGES_DIR, `${pageKey}.json`);
}
function pageExists(pageKey) {
  return fs.existsSync(pageContentFile(pageKey));
}
function readPageContent(pageKey) {
  const file = pageContentFile(pageKey);
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw);
}
function writePageContent(pageKey, data) {
  const file = pageContentFile(pageKey);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}
`, "utf-8");
}
function pageHistoryDir(pageKey) {
  return path.join(HISTORY_DIR, pageKey);
}
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
function historySnapshotFile(pageKey, id) {
  return path.join(pageHistoryDir(pageKey), `${id}.json`);
}
function isValidSnapshotId(id) {
  return /^[a-z0-9_-]+$/i.test(id);
}
function createHistorySnapshot(pageKey, data, reason = "manual-save") {
  ensureDir(pageHistoryDir(pageKey));
  const now = /* @__PURE__ */ new Date();
  const iso = now.toISOString().replace(/[:.]/g, "-");
  const rand = Math.random().toString(36).slice(2, 7);
  const id = `${iso}_${rand}`;
  const payload = {
    id,
    page: pageKey,
    reason,
    createdAt: now.toISOString(),
    data
  };
  fs.writeFileSync(historySnapshotFile(pageKey, id), `${JSON.stringify(payload, null, 2)}
`, "utf-8");
  cleanupOldHistory(pageKey);
  return payload;
}
function listPages() {
  return fs.readdirSync(PAGES_DIR).filter((name) => name.endsWith(".json")).map((name) => name.replace(/\.json$/, "")).sort();
}
function listHistory(pageKey) {
  const dir = pageHistoryDir(pageKey);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith(".json")).map((name) => {
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    const id = name.replace(/\.json$/, "");
    let createdAt = new Date(stat.mtimeMs).toISOString();
    let reason = "snapshot";
    try {
      const raw = fs.readFileSync(file, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.createdAt) createdAt = parsed.createdAt;
      if (parsed.reason) reason = parsed.reason;
    } catch {
    }
    return { id, createdAt, reason, size: stat.size };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function readHistoryPayload(pageKey, id) {
  const file = historySnapshotFile(pageKey, id);
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw);
}
function readHistorySnapshot(pageKey, id) {
  const payload = readHistoryPayload(pageKey, id);
  return payload.data;
}
function diffValues(basePath, left, right, out) {
  const leftIsObj = left !== null && typeof left === "object";
  const rightIsObj = right !== null && typeof right === "object";
  if (!leftIsObj || !rightIsObj) {
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      out.push({ path: basePath || "(root)", type: left === void 0 ? "added" : right === void 0 ? "removed" : "changed" });
    }
    return;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      out.push({ path: basePath || "(root)", type: "changed" });
    }
    return;
  }
  const leftObj = left;
  const rightObj = right;
  const keys = /* @__PURE__ */ new Set([...Object.keys(leftObj), ...Object.keys(rightObj)]);
  for (const key of keys) {
    const nextPath = basePath ? `${basePath}.${key}` : key;
    if (!(key in leftObj)) {
      out.push({ path: nextPath, type: "added" });
      continue;
    }
    if (!(key in rightObj)) {
      out.push({ path: nextPath, type: "removed" });
      continue;
    }
    diffValues(nextPath, leftObj[key], rightObj[key], out);
  }
}
function getDiff(left, right) {
  const changes = [];
  diffValues("", left, right, changes);
  return {
    summary: {
      total: changes.length,
      added: changes.filter((item) => item.type === "added").length,
      removed: changes.filter((item) => item.type === "removed").length,
      changed: changes.filter((item) => item.type === "changed").length
    },
    changes: changes.slice(0, 300)
  };
}
function cleanupOldHistory(pageKey) {
  const items = listHistory(pageKey);
  if (items.length <= MAX_HISTORY_FILES_PER_PAGE) return;
  const stale = items.slice(MAX_HISTORY_FILES_PER_PAGE);
  for (const item of stale) {
    const file = historySnapshotFile(pageKey, item.id);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}
function writeLegacyContent(data) {
  fs.writeFileSync(LEGACY_CONTENT_FILE, `${JSON.stringify(data, null, 2)}
`, "utf-8");
}

function mode() {
  const value = (process.env.CMS_STORAGE_MODE || "hybrid").toLowerCase();
  if (value === "db" || value === "file" || value === "hybrid") return value;
  return "hybrid";
}
async function findPage(slug) {
  return db.contentPage.findUnique({ where: { slug } });
}
async function ensurePageFromFile(slug) {
  const existing = await findPage(slug);
  if (existing) return existing;
  if (!pageExists(slug)) return null;
  const content = readPageContent(slug);
  const title = String(content.site?.title || content.title || slug);
  return db.contentPage.create({
    data: {
      slug,
      title,
      seoTitle: title,
      content,
      status: "PUBLISHED",
      publishedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function listPagesFromStorage() {
  const runtime = await getCmsRuntimeConfig();
  if (runtime.cmsPlatform === "payload" && runtime.payloadReadMode === "all") {
    const payloadPages = await listPagesFromPayload().catch(() => []);
    if (payloadPages.length > 0) return payloadPages;
  }
  const storage = mode();
  if (storage === "file") return listPages();
  try {
    const pages = await db.contentPage.findMany({ select: { slug: true }, orderBy: { slug: "asc" } });
    if (pages.length > 0) return pages.map((p) => p.slug);
    if (storage === "db") return [];
  } catch {
    if (storage === "db") throw new Error("DB unavailable while listing pages");
  }
  return listPages();
}
async function readContentFromStorage(slug) {
  if (!isValidPageKey(slug)) return null;
  const runtime = await getCmsRuntimeConfig();
  if (runtime.cmsPlatform === "payload" && runtime.payloadReadMode === "all") {
    const fromPayload = await readPageContentFromPayload(slug, { draft: false }).catch(() => null);
    if (fromPayload) return fromPayload;
  }
  const storage = mode();
  if (storage !== "file") {
    try {
      const page = await ensurePageFromFile(slug);
      if (page?.content && typeof page.content === "object" && !Array.isArray(page.content)) {
        return page.content;
      }
      if (storage === "db") return null;
    } catch {
      if (storage === "db") throw new Error("DB unavailable while reading content");
    }
  }
  if (!pageExists(slug)) return null;
  return readPageContent(slug);
}
async function saveContentToStorage(slug, content) {
  if (!isValidPageKey(slug)) throw new Error("Invalid page key");
  const storage = mode();
  if (storage !== "file") {
    try {
      const page = await ensurePageFromFile(slug);
      const existing = page || await db.contentPage.create({
        data: {
          slug,
          title: String(content.site?.title || content.title || slug),
          content,
          status: "PUBLISHED",
          publishedAt: /* @__PURE__ */ new Date()
        }
      });
      const before = existing.content && typeof existing.content === "object" && !Array.isArray(existing.content) ? existing.content : null;
      if (before) {
        await db.contentRevision.create({
          data: {
            pageId: existing.id,
            reason: "auto-before-save",
            content: before
          }
        });
      }
      await db.contentPage.update({
        where: { id: existing.id },
        data: {
          title: String(content.site?.title || content.title || existing.title),
          content
        }
      });
      if (storage === "db") return;
    } catch {
      if (storage === "db") throw new Error("DB unavailable while saving content");
    }
  }
  if (pageExists(slug)) {
    createHistorySnapshot(slug, readPageContent(slug), "auto-before-save");
  }
  writePageContent(slug, content);
  if (slug === "koblenz") writeLegacyContent(content);
}
async function listHistoryFromStorage(slug) {
  if (!isValidPageKey(slug)) return [];
  const storage = mode();
  if (storage !== "file") {
    try {
      const page = await ensurePageFromFile(slug);
      if (page) {
        const revisions = await db.contentRevision.findMany({
          where: { pageId: page.id },
          orderBy: { createdAt: "desc" },
          take: 80
        });
        return revisions.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString(), reason: r.reason, size: 0 }));
      }
      if (storage === "db") return [];
    } catch {
      if (storage === "db") throw new Error("DB unavailable while listing history");
    }
  }
  return listHistory(slug);
}
async function createSnapshotInStorage(slug, reason) {
  const storage = mode();
  const content = await readContentFromStorage(slug);
  if (!content) throw new Error("Page not found");
  if (storage !== "file") {
    try {
      const page = await ensurePageFromFile(slug);
      if (page) {
        const revision = await db.contentRevision.create({
          data: {
            pageId: page.id,
            reason,
            content
          }
        });
        if (storage === "db") return { id: revision.id, createdAt: revision.createdAt.toISOString(), reason };
      }
    } catch {
      if (storage === "db") throw new Error("DB unavailable while creating snapshot");
    }
  }
  const fileShot = createHistorySnapshot(slug, content, reason);
  return { id: fileShot.id, createdAt: fileShot.createdAt, reason };
}
async function readSnapshotContent(slug, snapshotId) {
  if (!isValidSnapshotId(snapshotId)) return null;
  const storage = mode();
  if (storage !== "file") {
    try {
      const page = await ensurePageFromFile(slug);
      if (page) {
        const revision = await db.contentRevision.findFirst({
          where: { id: snapshotId, pageId: page.id }
        });
        if (revision?.content && typeof revision.content === "object" && !Array.isArray(revision.content)) {
          return revision.content;
        }
      }
      if (storage === "db") return null;
    } catch {
      if (storage === "db") throw new Error("DB unavailable while reading snapshot");
    }
  }
  const fileData = readHistorySnapshot(slug, snapshotId);
  if (!fileData || typeof fileData !== "object" || Array.isArray(fileData)) return null;
  return fileData;
}
async function diffSnapshotsFromStorage(slug, fromId, toId) {
  const fromData = await readSnapshotContent(slug, fromId);
  if (!fromData) throw new Error("From snapshot not found");
  const toData = toId === "live" ? await readContentFromStorage(slug) : await readSnapshotContent(slug, toId);
  if (!toData) throw new Error(toId === "live" ? "Live content not found" : "To snapshot not found");
  return getDiff(fromData, toData);
}
async function restoreSnapshotFromStorage(slug, snapshotId) {
  const snapshotData = await readSnapshotContent(slug, snapshotId);
  if (!snapshotData) throw new Error("Snapshot not found");
  const current = await readContentFromStorage(slug);
  if (!current) throw new Error("Page not found");
  const storage = mode();
  if (storage !== "file") {
    try {
      const page = await ensurePageFromFile(slug);
      if (page) {
        await db.contentRevision.create({
          data: {
            pageId: page.id,
            reason: "auto-before-restore",
            content: current
          }
        });
        await db.contentPage.update({
          where: { id: page.id },
          data: { content: snapshotData }
        });
        if (storage === "db") return snapshotData;
      }
    } catch {
      if (storage === "db") throw new Error("DB unavailable while restoring snapshot");
    }
  }
  createHistorySnapshot(slug, current, "auto-before-restore");
  writePageContent(slug, snapshotData);
  if (slug === "koblenz") writeLegacyContent(snapshotData);
  return snapshotData;
}
function validateSnapshotId(value) {
  return isValidSnapshotId(value);
}

export { restoreSnapshotFromStorage as a, listPagesFromStorage as b, createSnapshotInStorage as c, diffSnapshotsFromStorage as d, isValidPageKey as i, listHistoryFromStorage as l, readContentFromStorage as r, saveContentToStorage as s, validateSnapshotId as v };
