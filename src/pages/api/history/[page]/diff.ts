import type { APIRoute } from 'astro';
import { diffSnapshotsFromStorage, isValidPageKey, validateSnapshotId } from '@/lib/cms-storage';

export const GET: APIRoute = async ({ params, url }) => {
  const pageKey = (params.page || '').toLowerCase();
  if (!isValidPageKey(pageKey)) {
    return new Response(JSON.stringify({ error: 'Invalid page key' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  const fromId = url.searchParams.get('from');
  const toId = url.searchParams.get('to') || 'live';
  if (!fromId) {
    return new Response(JSON.stringify({ error: 'Missing from id' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
  if (!validateSnapshotId(fromId)) {
    return new Response(JSON.stringify({ error: 'Invalid from id' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
  if (toId !== 'live' && !validateSnapshotId(toId)) {
    return new Response(JSON.stringify({ error: 'Invalid to id' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  try {
    const diff = await diffSnapshotsFromStorage(pageKey, fromId, toId);
    return new Response(JSON.stringify({ page: pageKey, from: fromId, to: toId, ...diff }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
};
