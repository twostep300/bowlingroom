import type { APIRoute } from 'astro';
import { parse } from 'cookie';

export const GET: APIRoute = async ({ request }) => {
  const cookieName = process.env.ADMIN_CSRF_COOKIE || 'br_admin_csrf';
  const cookies = parse(request.headers.get('cookie') || '');
  const token = cookies[cookieName] || null;
  return new Response(JSON.stringify({ ok: true, csrfToken: token }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
