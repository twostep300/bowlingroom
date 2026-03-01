import { parse } from 'cookie';
import { d as db } from '../../../chunks/db_DpmQIvvC.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request }) => {
  const cookieName = process.env.ADMIN_SESSION_COOKIE || "br_admin_session";
  const csrfCookieName = process.env.ADMIN_CSRF_COOKIE || "br_admin_csrf";
  const cookies = parse(request.headers.get("cookie") || "");
  const authHeader = request.headers.get("authorization") || "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const bearerToken = bearerMatch?.[1]?.trim();
  const token = bearerToken || cookies[cookieName];
  if (token) {
    await db.session.deleteMany({ where: { token } });
  }
  const headers = new Headers({ "content-type": "application/json" });
  headers.append("set-cookie", `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  headers.append("set-cookie", `${csrfCookieName}=; Path=/; SameSite=Lax; Max-Age=0`);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
