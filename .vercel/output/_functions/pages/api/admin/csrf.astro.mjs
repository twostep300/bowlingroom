import { parse } from 'cookie';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ request }) => {
  const cookieName = process.env.ADMIN_CSRF_COOKIE || "br_admin_csrf";
  const cookies = parse(request.headers.get("cookie") || "");
  const token = cookies[cookieName] || null;
  return new Response(JSON.stringify({ ok: true, csrfToken: token }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
