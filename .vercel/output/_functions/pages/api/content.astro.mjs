import { z } from 'zod';
import { r as readContentFromStorage, s as saveContentToStorage } from '../../chunks/cms-storage_CYJW-R64.mjs';
export { renderers } from '../../renderers.mjs';

const objectSchema = z.record(z.any());
const GET = async () => {
  const payload = await readContentFromStorage("koblenz");
  if (!payload) {
    return new Response(JSON.stringify({ error: "Page not found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
};
const PUT = async ({ request }) => {
  const parsed = objectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Top-level JSON must be an object" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  await saveContentToStorage("koblenz", parsed.data);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
