export { renderers } from '../renderers.mjs';

const GET = async ({ site }) => {
  const base = site?.toString().replace(/\/$/, "") || "http://localhost:4321";
  const body = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
