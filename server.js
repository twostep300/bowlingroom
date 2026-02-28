const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const PAGES_DIR = path.join(ROOT, 'content', 'pages');
const HISTORY_DIR = path.join(ROOT, 'content', 'history');
const LEGACY_CONTENT_FILE = path.join(ROOT, 'content', 'content.json');
const MAX_HISTORY_FILES_PER_PAGE = 80;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  res.end(JSON.stringify(payload, null, 2));
}

function isValidPageKey(pageKey) {
  return /^[a-z0-9-]+$/i.test(pageKey);
}

function pageContentFile(pageKey) {
  return path.join(PAGES_DIR, `${pageKey}.json`);
}

function readPageContent(pageKey) {
  const file = pageContentFile(pageKey);
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw);
}

function writePageContent(pageKey, data) {
  const file = pageContentFile(pageKey);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
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

function createHistorySnapshot(pageKey, data, reason = 'manual-save') {
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
    data,
  };
  fs.writeFileSync(historySnapshotFile(pageKey, id), JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  cleanupOldHistory(pageKey);
  return payload;
}

function listHistory(pageKey) {
  const dir = pageHistoryDir(pageKey);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const file = path.join(dir, name);
      const stat = fs.statSync(file);
      const id = name.replace(/\.json$/, '');
      let createdAt = new Date(stat.mtimeMs).toISOString();
      let reason = 'snapshot';
      try {
        const raw = fs.readFileSync(file, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed?.createdAt) createdAt = parsed.createdAt;
        if (parsed?.reason) reason = parsed.reason;
      } catch (e) {
        // ignore broken snapshot metadata
      }
      return { id, createdAt, reason, size: stat.size };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function readHistorySnapshot(pageKey, id) {
  const file = historySnapshotFile(pageKey, id);
  const raw = fs.readFileSync(file, 'utf-8');
  const parsed = JSON.parse(raw);
  return parsed?.data;
}

function readHistoryPayload(pageKey, id) {
  const file = historySnapshotFile(pageKey, id);
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw);
}

function diffValues(basePath, left, right, out) {
  const leftIsObj = left && typeof left === 'object';
  const rightIsObj = right && typeof right === 'object';

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

  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  keys.forEach((key) => {
    const nextPath = basePath ? `${basePath}.${key}` : key;
    if (!(key in left)) {
      out.push({ path: nextPath, type: 'added' });
      return;
    }
    if (!(key in right)) {
      out.push({ path: nextPath, type: 'removed' });
      return;
    }
    diffValues(nextPath, left[key], right[key], out);
  });
}

function getDiff(left, right) {
  const changes = [];
  diffValues('', left, right, changes);
  const summary = {
    total: changes.length,
    added: changes.filter((c) => c.type === 'added').length,
    removed: changes.filter((c) => c.type === 'removed').length,
    changed: changes.filter((c) => c.type === 'changed').length,
  };
  return { summary, changes: changes.slice(0, 300) };
}

function cleanupOldHistory(pageKey) {
  const items = listHistory(pageKey);
  if (items.length <= MAX_HISTORY_FILES_PER_PAGE) return;
  const toDelete = items.slice(MAX_HISTORY_FILES_PER_PAGE);
  toDelete.forEach((item) => {
    const file = historySnapshotFile(pageKey, item.id);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
}

function resolveStaticFile(reqPath) {
  let safePath = decodeURIComponent(reqPath);
  if (safePath === '/') safePath = '/index.html';
  if (safePath === '/admin') safePath = '/admin/index.html';

  const normalized = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!normalized.startsWith(PUBLIC_DIR)) return null;

  if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
    return normalized;
  }

  const nestedIndex = path.join(normalized, 'index.html');
  if (nestedIndex.startsWith(PUBLIC_DIR) && fs.existsSync(nestedIndex) && fs.statSync(nestedIndex).isFile()) {
    return nestedIndex;
  }

  return null;
}

function serveStatic(reqPath, res) {
  const filePath = resolveStaticFile(reqPath);
  if (!filePath) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  fs.createReadStream(filePath).pipe(res);
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/api/pages' && req.method === 'GET') {
      const files = fs.readdirSync(PAGES_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''))
        .sort();
      return sendJson(res, 200, { pages: files });
    }

    const historyMatch = url.pathname.match(/^\/api\/history\/([a-z0-9-]+)$/i);
    if (historyMatch && req.method === 'GET') {
      const pageKey = historyMatch[1].toLowerCase();
      if (!isValidPageKey(pageKey)) return sendJson(res, 400, { error: 'Invalid page key' });
      if (!fs.existsSync(pageContentFile(pageKey))) return sendJson(res, 404, { error: 'Page not found' });
      return sendJson(res, 200, { page: pageKey, versions: listHistory(pageKey) });
    }

    const historySnapshotMatch = url.pathname.match(/^\/api\/history\/([a-z0-9-]+)\/snapshot$/i);
    if (historySnapshotMatch && req.method === 'POST') {
      const pageKey = historySnapshotMatch[1].toLowerCase();
      if (!isValidPageKey(pageKey)) return sendJson(res, 400, { error: 'Invalid page key' });
      if (!fs.existsSync(pageContentFile(pageKey))) return sendJson(res, 404, { error: 'Page not found' });

      const body = await parseRequestBody(req);
      let payload = {};
      if (body) {
        try {
          payload = JSON.parse(body);
        } catch (error) {
          return sendJson(res, 400, { error: 'Invalid JSON body' });
        }
      }
      const label = typeof payload?.label === 'string' ? payload.label.trim() : '';
      const reason = label ? `manual:${label.slice(0, 80)}` : 'manual-snapshot';
      const current = readPageContent(pageKey);
      const snapshot = createHistorySnapshot(pageKey, current, reason);
      return sendJson(res, 200, { ok: true, snapshot: { id: snapshot.id, createdAt: snapshot.createdAt, reason: snapshot.reason } });
    }

    const historyDiffMatch = url.pathname.match(/^\/api\/history\/([a-z0-9-]+)\/diff$/i);
    if (historyDiffMatch && req.method === 'GET') {
      const pageKey = historyDiffMatch[1].toLowerCase();
      if (!isValidPageKey(pageKey)) return sendJson(res, 400, { error: 'Invalid page key' });
      if (!fs.existsSync(pageContentFile(pageKey))) return sendJson(res, 404, { error: 'Page not found' });

      const fromId = url.searchParams.get('from');
      const toId = url.searchParams.get('to');
      if (!fromId) return sendJson(res, 400, { error: 'Missing from id' });
      if (!isValidSnapshotId(fromId)) return sendJson(res, 400, { error: 'Invalid from id' });
      if (toId && !isValidSnapshotId(toId) && toId !== 'live') return sendJson(res, 400, { error: 'Invalid to id' });

      const fromPath = historySnapshotFile(pageKey, fromId);
      if (!fs.existsSync(fromPath)) return sendJson(res, 404, { error: 'From snapshot not found' });
      const fromPayload = readHistoryPayload(pageKey, fromId);
      const fromData = fromPayload?.data;

      let toData;
      if (!toId || toId === 'live') {
        toData = readPageContent(pageKey);
      } else {
        const toPath = historySnapshotFile(pageKey, toId);
        if (!fs.existsSync(toPath)) return sendJson(res, 404, { error: 'To snapshot not found' });
        const toPayload = readHistoryPayload(pageKey, toId);
        toData = toPayload?.data;
      }

      if (!fromData || typeof fromData !== 'object' || Array.isArray(fromData)) {
        return sendJson(res, 400, { error: 'From snapshot data is invalid' });
      }
      if (!toData || typeof toData !== 'object' || Array.isArray(toData)) {
        return sendJson(res, 400, { error: 'To snapshot data is invalid' });
      }

      const diff = getDiff(fromData, toData);
      return sendJson(res, 200, { page: pageKey, from: fromId, to: toId || 'live', ...diff });
    }

    const historyRestoreMatch = url.pathname.match(/^\/api\/history\/([a-z0-9-]+)\/restore$/i);
    if (historyRestoreMatch && req.method === 'POST') {
      const pageKey = historyRestoreMatch[1].toLowerCase();
      if (!isValidPageKey(pageKey)) return sendJson(res, 400, { error: 'Invalid page key' });
      if (!fs.existsSync(pageContentFile(pageKey))) return sendJson(res, 404, { error: 'Page not found' });

      const body = await parseRequestBody(req);
      let payload;
      try {
        payload = JSON.parse(body);
      } catch (error) {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
      }
      const snapshotId = payload?.id;
      if (!snapshotId || typeof snapshotId !== 'string') {
        return sendJson(res, 400, { error: 'Missing snapshot id' });
      }
      if (!isValidSnapshotId(snapshotId)) return sendJson(res, 400, { error: 'Invalid snapshot id' });

      const snapshotPath = historySnapshotFile(pageKey, snapshotId);
      if (!fs.existsSync(snapshotPath)) return sendJson(res, 404, { error: 'Snapshot not found' });

      const current = readPageContent(pageKey);
      createHistorySnapshot(pageKey, current, 'auto-before-restore');
      const snapshotData = readHistorySnapshot(pageKey, snapshotId);
      if (!snapshotData || typeof snapshotData !== 'object' || Array.isArray(snapshotData)) {
        return sendJson(res, 400, { error: 'Snapshot data is invalid' });
      }
      writePageContent(pageKey, snapshotData);
      return sendJson(res, 200, { ok: true, restoredId: snapshotId, data: snapshotData });
    }

    const pageApiMatch = url.pathname.match(/^\/api\/content\/([a-z0-9-]+)$/i);
    if (pageApiMatch && req.method === 'GET') {
      const pageKey = pageApiMatch[1].toLowerCase();
      if (!isValidPageKey(pageKey)) return sendJson(res, 400, { error: 'Invalid page key' });
      if (!fs.existsSync(pageContentFile(pageKey))) return sendJson(res, 404, { error: 'Page not found' });
      return sendJson(res, 200, readPageContent(pageKey));
    }

    if (pageApiMatch && req.method === 'PUT') {
      const pageKey = pageApiMatch[1].toLowerCase();
      if (!isValidPageKey(pageKey)) return sendJson(res, 400, { error: 'Invalid page key' });
      if (!fs.existsSync(pageContentFile(pageKey))) return sendJson(res, 404, { error: 'Page not found' });

      const body = await parseRequestBody(req);
      let payload;
      try {
        payload = JSON.parse(body);
      } catch (error) {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
      }

      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return sendJson(res, 400, { error: 'Top-level JSON must be an object' });
      }

      const current = readPageContent(pageKey);
      createHistorySnapshot(pageKey, current, 'auto-before-save');
      writePageContent(pageKey, payload);
      return sendJson(res, 200, { ok: true });
    }

    // Backward compatibility
    if (url.pathname === '/api/content' && req.method === 'GET') {
      return sendJson(res, 200, readPageContent('koblenz'));
    }

    if (url.pathname === '/api/content' && req.method === 'PUT') {
      const body = await parseRequestBody(req);
      let payload;
      try {
        payload = JSON.parse(body);
      } catch (error) {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
      }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return sendJson(res, 400, { error: 'Top-level JSON must be an object' });
      }
      const current = readPageContent('koblenz');
      createHistorySnapshot('koblenz', current, 'auto-before-save');
      writePageContent('koblenz', payload);
      fs.writeFileSync(LEGACY_CONTENT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET') {
      return serveStatic(url.pathname, res);
    }

    res.writeHead(405);
    res.end('Method Not Allowed');
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
