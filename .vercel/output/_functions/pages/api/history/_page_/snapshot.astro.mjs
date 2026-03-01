import { z } from 'zod';
import { i as isValidPageKey, r as readContentFromStorage, c as createSnapshotInStorage } from '../../../../chunks/cms-storage_CYJW-R64.mjs';
export { renderers } from '../../../../renderers.mjs';

const schema = z.object({ label: z.string().optional() });
const POST = async ({ params, request }) => {
  const pageKey = (params.page || "").toLowerCase();
  if (!isValidPageKey(pageKey)) {
    return new Response(JSON.stringify({ error: "Invalid page key" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  const page = await readContentFromStorage(pageKey);
  if (!page) {
    return new Response(JSON.stringify({ error: "Page not found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  const label = parsed.success ? (parsed.data.label || "").trim() : "";
  const reason = label ? `manual:${label.slice(0, 80)}` : "manual-snapshot";
  const snapshot = await createSnapshotInStorage(pageKey, reason);
  return new Response(JSON.stringify({ ok: true, snapshot }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
