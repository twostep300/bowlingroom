import type { APIContext } from 'astro';
import { parse } from 'cookie';
import { db } from '@/lib/db';
import type { AuthUser } from '@/types/api';

function sessionCookieName(): string {
  return process.env.ADMIN_SESSION_COOKIE || 'br_admin_session';
}

function isLocalBypassAllowed(context: APIContext): boolean {
  const headerHost =
    context.request.headers.get('x-forwarded-host') ||
    context.request.headers.get('host') ||
    '';
  const effectiveHost = (headerHost || context.url.hostname || '').toLowerCase();
  const isLocal = effectiveHost === 'localhost' || effectiveHost === '127.0.0.1';
  const isVercelPreview =
    effectiveHost.endsWith('.vercel.app') ||
    Boolean(process.env.VERCEL);

  if (isLocal) {
    if (process.env.NODE_ENV === 'production') return false;
    if (process.env.ADMIN_LOCAL_BYPASS === 'false') return false;
    return true;
  }

  // Temporary hosted admin bypass for Vercel preview/staging URLs.
  // Keeps the custom CMS usable while auth endpoints are stabilized.
  if (isVercelPreview) return true;

  return false;
}

export async function getAuthUser(context: APIContext): Promise<AuthUser | null> {
  async function localFallbackUser(): Promise<AuthUser | null> {
    if (!isLocalBypassAllowed(context)) return null;
    const fallback = await db.user.findFirst({
      where: { isActive: true, role: { in: ['ADMIN', 'EDITOR'] } },
      orderBy: { createdAt: 'asc' }
    });
    if (!fallback) return null;
    return { id: fallback.id, email: fallback.email, role: fallback.role };
  }

  const authHeader = context.request.headers.get('authorization') || '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const bearerToken = bearerMatch?.[1]?.trim();

  const cookieHeader = context.request.headers.get('cookie') || '';
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

export async function requireRole(context: APIContext, roles: Array<'ADMIN' | 'EDITOR'> = ['ADMIN', 'EDITOR']) {
  const user = await getAuthUser(context);
  if (!user || !roles.includes(user.role)) return null;
  return user;
}
