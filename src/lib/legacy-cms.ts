import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'content', 'pages');
const HISTORY_DIR = path.join(ROOT, 'content', 'history');
const LEGACY_CONTENT_FILE = path.join(ROOT, 'content', 'content.json');
const MAX_HISTORY_FILES_PER_PAGE = 80;

export type JsonObject = Record<string, unknown>;

export function isValidPageKey(pageKey: string) {
  return /^[a-z0-9-]+$/i.test(pageKey);
}

export function pageContentFile(pageKey: string) {
  return path.join(PAGES_DIR, `${pageKey}.json`);
}

export function pageExists(pageKey: string) {
  return fs.existsSync(pageContentFile(pageKey));
}

export function readPageContent(pageKey: string): JsonObject {
  const file = pageContentFile(pageKey);
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw) as JsonObject;
}

export function writePageContent(pageKey: string, data: JsonObject) {
  const file = pageContentFile(pageKey);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

function pageHistoryDir(pageKey: string) {
  return path.join(HISTORY_DIR, pageKey);
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function historySnapshotFile(pageKey: string, id: string) {
  return path.join(pageHistoryDir(pageKey), `${id}.json`);
}

export function isValidSnapshotId(id: string) {
  return /^[a-z0-9_-]+$/i.test(id);
}

export function createHistorySnapshot(pageKey: string, data: JsonObject, reason = 'manual-save') {
  ensureDir(pageHistoryDir(pageKey));
  const now = new Date();
  const iso = now.toISOString().replace(/[:.]/g, '-');
  const rand = Math.random().toString(36).slice(2, 7);
  const id = `${iso}_${rand}`;
  const payload = {
    id,
    page: pageKey,
    reason,
    createdAt: now.toISOString(),
    data
  };
  fs.writeFileSync(historySnapshotFile(pageKey, id), `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  cleanupOldHistory(pageKey);
  return payload;
}

export function listPages(): string[] {
  return fs
    .readdirSync(PAGES_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''))
    .sort();
}

export function listHistory(pageKey: string) {
  const dir = pageHistoryDir(pageKey);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const file = path.join(dir, name);
      const stat = fs.statSync(file);
      const id = name.replace(/\.json$/, '');
      let createdAt = new Date(stat.mtimeMs).toISOString();
      let reason = 'snapshot';
      try {
        const raw = fs.readFileSync(file, 'utf-8');
        const parsed = JSON.parse(raw) as { createdAt?: string; reason?: string };
        if (parsed.createdAt) createdAt = parsed.createdAt;
        if (parsed.reason) reason = parsed.reason;
      } catch {
        // ignore broken snapshot metadata
      }
      return { id, createdAt, reason, size: stat.size };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function readHistoryPayload(pageKey: string, id: string) {
  const file = historySnapshotFile(pageKey, id);
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw) as { data?: JsonObject };
}

export function readHistorySnapshot(pageKey: string, id: string): JsonObject | undefined {
  const payload = readHistoryPayload(pageKey, id);
  return payload.data;
}

export function historySnapshotExists(pageKey: string, id: string) {
  return fs.existsSync(historySnapshotFile(pageKey, id));
}

function diffValues(basePath: string, left: unknown, right: unknown, out: Array<{ path: string; type: 'added' | 'removed' | 'changed' }>) {
  const leftIsObj = left !== null && typeof left === 'object';
  const rightIsObj = right !== null && typeof right === 'object';

  if (!leftIsObj || !rightIsObj) {
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      out.push({ path: basePath || '(root)', type: left === undefined ? 'added' : right === undefined ? 'removed' : 'changed' });
    }
    return;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      out.push({ path: basePath || '(root)', type: 'changed' });
    }
    return;
  }

  const leftObj = left as Record<string, unknown>;
  const rightObj = right as Record<string, unknown>;
  const keys = new Set([...Object.keys(leftObj), ...Object.keys(rightObj)]);

  for (const key of keys) {
    const nextPath = basePath ? `${basePath}.${key}` : key;
    if (!(key in leftObj)) {
      out.push({ path: nextPath, type: 'added' });
      continue;
    }
    if (!(key in rightObj)) {
      out.push({ path: nextPath, type: 'removed' });
      continue;
    }
    diffValues(nextPath, leftObj[key], rightObj[key], out);
  }
}

export function getDiff(left: JsonObject, right: JsonObject) {
  const changes: Array<{ path: string; type: 'added' | 'removed' | 'changed' }> = [];
  diffValues('', left, right, changes);
  return {
    summary: {
      total: changes.length,
      added: changes.filter((item) => item.type === 'added').length,
      removed: changes.filter((item) => item.type === 'removed').length,
      changed: changes.filter((item) => item.type === 'changed').length
    },
    changes: changes.slice(0, 300)
  };
}

function cleanupOldHistory(pageKey: string) {
  const items = listHistory(pageKey);
  if (items.length <= MAX_HISTORY_FILES_PER_PAGE) return;
  const stale = items.slice(MAX_HISTORY_FILES_PER_PAGE);
  for (const item of stale) {
    const file = historySnapshotFile(pageKey, item.id);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

export function writeLegacyContent(data: JsonObject) {
  fs.writeFileSync(LEGACY_CONTENT_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}
