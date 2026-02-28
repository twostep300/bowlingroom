import type { APIRoute } from 'astro';
import { getAuthUser } from '@/lib/auth';

export const GET: APIRoute = async (context) => {
  const user = await getAuthUser(context);
  if (!user) return new Response(JSON.stringify({ ok: false }), { status: 401 });
  return new Response(JSON.stringify({ ok: true, user }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
