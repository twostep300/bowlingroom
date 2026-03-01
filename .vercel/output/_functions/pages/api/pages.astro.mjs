import { b as listPagesFromStorage } from '../../chunks/cms-storage_CYJW-R64.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async () => {
  const pages = await listPagesFromStorage();
  return new Response(JSON.stringify({ pages }), {
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
