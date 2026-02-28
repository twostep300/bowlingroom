const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3100);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const PAGES_DIR = path.join(ROOT, 'content', 'pages');
const HISTORY_DIR = path.join(ROOT, 'content', 'history');
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

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function pageContentFile(pageKey) {
  return path.join(PAGES_DIR, `${pageKey}.json`);
}

function readPageContent(pageKey) {
  const raw = fs.readFileSync(pageContentFile(pageKey), 'utf8');
  return JSON.parse(raw);
}

function writePageContent(pageKey, data) {
  fs.writeFileSync(pageContentFile(pageKey), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function pageHistoryDir(pageKey) {
  return path.join(HISTORY_DIR, pageKey);
}

function historySnapshotFile(pageKey, id) {
  return path.join(pageHistoryDir(pageKey), `${id}.json`);
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
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (parsed?.createdAt) createdAt = parsed.createdAt;
        if (parsed?.reason) reason = parsed.reason;
      } catch (e) {
        // ignore broken metadata
      }

      return { id, createdAt, reason, size: stat.size };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function cleanupOldHistory(pageKey) {
  const items = listHistory(pageKey);
  if (items.length <= MAX_HISTORY_FILES_PER_PAGE) return;
  items.slice(MAX_HISTORY_FILES_PER_PAGE).forEach((item) => {
    const file = historySnapshotFile(pageKey, item.id);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
}

function createHistorySnapshot(pageKey, data, reason = 'manual-save') {
  ensureDir(pageHistoryDir(pageKey));
  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, '-')}_${Math.random().toString(36).slice(2, 7)}`;
  const payload = { id, page: pageKey, reason, createdAt: now.toISOString(), data };
  fs.writeFileSync(historySnapshotFile(pageKey, id), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  cleanupOldHistory(pageKey);
  return payload;
}

function isValidSnapshotId(id) {
  return /^[a-z0-9_-]+$/i.test(id);
}

function readHistorySnapshot(pageKey, id) {
  const parsed = JSON.parse(fs.readFileSync(historySnapshotFile(pageKey, id), 'utf8'));
  return parsed?.data;
}

function resolveStaticFile(reqPath) {
  let safePath = decodeURIComponent(reqPath);
  if (safePath === '/') safePath = '/heyreply/index.html';
  if (safePath === '/admin') safePath = '/admin/index.html';

  const normalized = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!normalized.startsWith(PUBLIC_DIR)) return null;

  if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) return normalized;

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
      if (body.length > 4_000_000) {
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
      } catch {
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

    const historyMatch = url.pathname.match(/^\/api\/history\/([a-z0-9-]+)$/i);
    if (historyMatch && req.method === 'GET') {
      const pageKey = historyMatch[1].toLowerCase();
      if (!isValidPageKey(pageKey)) return sendJson(res, 400, { error: 'Invalid page key' });
      if (!fs.existsSync(pageContentFile(pageKey))) return sendJson(res, 404, { error: 'Page not found' });
      return sendJson(res, 200, { page: pageKey, versions: listHistory(pageKey) });
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
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
      }
      const snapshotId = payload?.id;
      if (!snapshotId || typeof snapshotId !== 'string') return sendJson(res, 400, { error: 'Missing snapshot id' });
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

    if (req.method === 'GET') return serveStatic(url.pathname, res);

    res.writeHead(405);
    res.end('Method Not Allowed');
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`HeyReply server running on http://localhost:${PORT}`);
});
