import fs from 'node:fs';
import path from 'node:path';
export { renderers } from '../renderers.mjs';

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};
const GET = async ({ params }) => {
  const rawPath = (params.path || "").split("/").filter(Boolean).join("/");
  const candidates = [
    path.join(PUBLIC_DIR, rawPath),
    path.join(PUBLIC_DIR, rawPath, "index.html")
  ];
  for (const filePath of candidates) {
    const normalized = path.normalize(filePath);
    if (!normalized.startsWith(PUBLIC_DIR)) continue;
    if (!fs.existsSync(normalized) || !fs.statSync(normalized).isFile()) continue;
    const ext = path.extname(normalized).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    const body = fs.readFileSync(normalized);
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store, no-cache, must-revalidate"
      }
    });
  }
  return new Response("Not Found", { status: 404 });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
