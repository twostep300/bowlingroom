import { parse } from 'cookie';
import { d as db } from './db_DpmQIvvC.mjs';

function sessionCookieName() {
  return process.env.ADMIN_SESSION_COOKIE || "br_admin_session";
}
function isLocalBypassAllowed(context) {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.ADMIN_LOCAL_BYPASS === "false") return false;
  const host = context.url.hostname;
  return host === "localhost" || host === "127.0.0.1";
}
async function getAuthUser(context) {
  async function localFallbackUser() {
    if (!isLocalBypassAllowed(context)) return null;
    const fallback = await db.user.findFirst({
      where: { isActive: true, role: { in: ["ADMIN", "EDITOR"] } },
      orderBy: { createdAt: "asc" }
    });
    if (!fallback) return null;
    return { id: fallback.id, email: fallback.email, role: fallback.role };
  }
  const authHeader = context.request.headers.get("authorization") || "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const bearerToken = bearerMatch?.[1]?.trim();
  const cookieHeader = context.request.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = bearerToken || cookies[sessionCookieName()];
  if (!token) {
    return localFallbackUser();
  }
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true }
  });
  if (!session) return localFallbackUser();
  if (session.expiresAt.getTime() < Date.now()) return localFallbackUser();
  if (!session.user.isActive) return localFallbackUser();
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role
  };
}
async function requireRole(context, roles = ["ADMIN", "EDITOR"]) {
  const user = await getAuthUser(context);
  if (!user || !roles.includes(user.role)) return null;
  return user;
}

export { getAuthUser as g, requireRole as r };
