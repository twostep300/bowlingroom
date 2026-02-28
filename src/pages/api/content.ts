import type { APIRoute } from 'astro';
import { z } from 'zod';
import { readContentFromStorage, saveContentToStorage } from '@/lib/cms-storage';

const objectSchema = z.record(z.any());

export const GET: APIRoute = async () => {
  const payload = await readContentFromStorage('koblenz');
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const parsed = objectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Top-level JSON must be an object' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  await saveContentToStorage('koblenz', parsed.data);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
};
