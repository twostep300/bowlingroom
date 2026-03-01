import type { MiddlewareHandler } from 'astro';
import { parse } from 'cookie';

let redirectCache: Array<{ fromPath: string; toPath: string; statusCode: number }> = [];
let redirectCacheExpiresAt = 0;

async function getActiveRedirects() {
  if (process.env.VERCEL || process.env.DISABLE_DB_REDIRECTS === 'true') return [];

  const now = Date.now();
  if (now < redirectCacheExpiresAt) return redirectCache;

  try {
    const { db } = await import('@/lib/db');
    const rows = await db.redirectRule.findMany({
      where: { isActive: true },
      select: { fromPath: true, toPath: true, statusCode: true }
    });
    redirectCache = rows;
    redirectCacheExpiresAt = now + 60_000;
    return rows;
  } catch {
    redirectCache = [];
    redirectCacheExpiresAt = now + 10_000;
    return [];
  }
}

function isSameOriginOrLoopback(originValue: string, expectedValue: string): boolean {
  try {
    const origin = new URL(originValue);
    const expected = new URL(expectedValue);
    if (origin.protocol === expected.protocol && origin.host === expected.host) return true;

    const isLoopback = (host: string) => host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
    return origin.protocol === expected.protocol && origin.port === expected.port && isLoopback(origin.hostname) && isLoopback(expected.hostname);
  } catch {
    return false;
  }
}

function isLocalDevRequest(url: URL): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const method = context.request.method.toUpperCase();
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const pathname = context.url.pathname;
  const isAdminAuthPath =
    pathname === '/api/admin/login' ||
    pathname === '/api/admin/login/' ||
    pathname === '/api/admin/me' ||
    pathname === '/api/admin/me/' ||
    pathname === '/api/admin/session' ||
    pathname === '/api/admin/session/';

  if (method === 'GET' && !pathname.startsWith('/api/')) {
    const redirects = await getActiveRedirects();
    const currentPath = pathname;
    const match = redirects.find((item) => item.fromPath === currentPath);
    if (match) {
      return context.redirect(match.toPath, match.statusCode as 301 | 302 | 307 | 308);
    }
  }

  if (isWrite && pathname.startsWith('/api/') && !isAdminAuthPath) {
    if (!isLocalDevRequest(context.url)) {
    const origin = context.request.headers.get('origin');
    if (origin) {
      const expected = context.url.origin;
      if (!isSameOriginOrLoopback(origin, expected)) {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid origin' }), {
          status: 403,
          headers: { 'content-type': 'application/json' }
        });
      }
    }
    }
  }

  if (isWrite && pathname.startsWith('/api/admin/') && !isAdminAuthPath) {
    if (isLocalDevRequest(context.url) && process.env.ADMIN_LOCAL_BYPASS !== 'false') {
      const response = await next();
      response.headers.set('X-Frame-Options', 'SAMEORIGIN');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
      response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://code.iconify.design; style-src 'self' 'unsafe-inline' https://api.fontshare.com; font-src 'self' https://api.fontshare.com https://fonts.gstatic.com data:; connect-src 'self' https:; frame-ancestors 'self';"
      );
      return response;
    }
    const authHeader = context.request.headers.get('authorization') || '';
    if (/^Bearer\\s+/i.test(authHeader)) {
      const response = await next();
      response.headers.set('X-Frame-Options', 'SAMEORIGIN');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
      response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://code.iconify.design; style-src 'self' 'unsafe-inline' https://api.fontshare.com; font-src 'self' https://api.fontshare.com https://fonts.gstatic.com data:; connect-src 'self' https:; frame-ancestors 'self';"
      );
      return response;
    }
    const csrfCookieName = process.env.ADMIN_CSRF_COOKIE || 'br_admin_csrf';
    const cookies = parse(context.request.headers.get('cookie') || '');
    const cookieToken = cookies[csrfCookieName];
    const headerToken = context.request.headers.get('x-csrf-token');
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid CSRF token' }), {
        status: 403,
        headers: { 'content-type': 'application/json' }
      });
    }
  }

  const response = await next();

  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://code.iconify.design; style-src 'self' 'unsafe-inline' https://api.fontshare.com; font-src 'self' https://api.fontshare.com https://fonts.gstatic.com data:; connect-src 'self' https:; frame-ancestors 'self';"
  );

  return response;
};
