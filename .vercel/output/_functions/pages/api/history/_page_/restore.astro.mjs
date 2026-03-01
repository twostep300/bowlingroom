import { z } from 'zod';
import { i as isValidPageKey, v as validateSnapshotId, a as restoreSnapshotFromStorage } from '../../../../chunks/cms-storage_7ZxVS-RI.mjs';
export { renderers } from '../../../../renderers.mjs';

const schema = z.object({ id: z.string().min(1) });
const POST = async ({ params, request }) => {
  const pageKey = (params.page || "").toLowerCase();
  if (!isValidPageKey(pageKey)) {
    return new Response(JSON.stringify({ error: "Invalid page key" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Missing snapshot id" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  if (!validateSnapshotId(parsed.data.id)) {
    return new Response(JSON.stringify({ error: "Invalid snapshot id" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  try {
    const data = await restoreSnapshotFromStorage(pageKey, parsed.data.id);
    return new Response(JSON.stringify({ ok: true, restoredId: parsed.data.id, data }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
