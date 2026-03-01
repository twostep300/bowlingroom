import { i as isValidPageKey, r as readContentFromStorage, l as listHistoryFromStorage } from '../../../chunks/cms-storage_7ZxVS-RI.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ params }) => {
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
  return new Response(JSON.stringify({ page: pageKey, versions: await listHistoryFromStorage(pageKey) }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
