import type { APIRoute } from 'astro';
import { listPagesFromStorage } from '@/lib/cms-storage';

export const GET: APIRoute = async () => {
  const pages = await listPagesFromStorage();
  return new Response(JSON.stringify({ pages }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
};
