import type { APIRoute } from 'astro';
import { isValidPageKey, listHistoryFromStorage, readContentFromStorage } from '@/lib/cms-storage';

export const GET: APIRoute = async ({ params }) => {
  const pageKey = (params.page || '').toLowerCase();
  if (!isValidPageKey(pageKey)) {
    return new Response(JSON.stringify({ error: 'Invalid page key' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  const page = await readContentFromStorage(pageKey);
  if (!page) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  return new Response(JSON.stringify({ page: pageKey, versions: await listHistoryFromStorage(pageKey) }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
};
