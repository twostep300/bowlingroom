import { z } from 'zod';
import { d as db } from '../../../chunks/db_DpmQIvvC.mjs';
import { i as isRateLimitedWithConfig, v as verifyPassword, c as createToken, a as createRandomToken } from '../../../chunks/security_BxrtMlOv.mjs';
export { renderers } from '../../../renderers.mjs';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
const POST = async ({ request, clientAddress }) => {
  const host = new URL(request.url).hostname;
  const addr = String(clientAddress || "");
  const isLoopbackAddress = ["127.0.0.1", "::1", "0:0:0:0:0:0:0:1", "localhost"].includes(addr) || addr.startsWith("::ffff:127.0.0.1") || ["localhost", "127.0.0.1", "::1"].includes(host);
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction || !isLoopbackAddress) {
    const loginRateKey = `login:${clientAddress}`;
    const windowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 6e4);
    const max = Number(process.env.LOGIN_RATE_LIMIT_MAX || 10);
    if (isRateLimitedWithConfig(loginRateKey, windowMs, max)) {
      return new Response(JSON.stringify({ ok: false, error: "Too many login attempts" }), { status: 429 });
    }
  }
  const payload = bodySchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  }
  const user = await db.user.findUnique({ where: { email: payload.data.email.toLowerCase() } });
  if (!user || !user.isActive || !verifyPassword(payload.data.password, user.passwordHash)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid credentials" }), { status: 401 });
  }
  const token = createToken();
  const ttlHours = Number(process.env.ADMIN_SESSION_TTL_HOURS || 24);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1e3);
  await db.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
      ipAddress: clientAddress,
      userAgent: request.headers.get("user-agent") || null
    }
  });
  const cookieName = process.env.ADMIN_SESSION_COOKIE || "br_admin_session";
  const csrfCookieName = process.env.ADMIN_CSRF_COOKIE || "br_admin_csrf";
  const csrfToken = createRandomToken(16);
  const headers = new Headers({ "content-type": "application/json" });
  headers.append("set-cookie", `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttlHours * 3600}`);
  headers.append("set-cookie", `${csrfCookieName}=${csrfToken}; Path=/; SameSite=Lax; Max-Age=${ttlHours * 3600}`);
  return new Response(JSON.stringify({ ok: true, token }), {
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
