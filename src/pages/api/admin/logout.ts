import type { APIRoute } from 'astro';
import { parse } from 'cookie';
import { db } from '@/lib/db';

export const POST: APIRoute = async ({ request }) => {
  const cookieName = process.env.ADMIN_SESSION_COOKIE || 'br_admin_session';
  const csrfCookieName = process.env.ADMIN_CSRF_COOKIE || 'br_admin_csrf';
  const cookies = parse(request.headers.get('cookie') || '');
  const authHeader = request.headers.get('authorization') || '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const bearerToken = bearerMatch?.[1]?.trim();
  const token = bearerToken || cookies[cookieName];
  if (token) {
    await db.session.deleteMany({ where: { token } });
  }

  const headers = new Headers({ 'content-type': 'application/json' });
  headers.append('set-cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  headers.append('set-cookie', `${csrfCookieName}=; Path=/; SameSite=Lax; Max-Age=0`);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers
  });
};
