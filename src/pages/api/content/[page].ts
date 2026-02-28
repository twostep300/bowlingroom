import type { APIRoute } from 'astro';
import { z } from 'zod';
import { parse } from 'cookie';
import { isValidPageKey, readContentFromStorage, saveContentToStorage } from '@/lib/cms-storage';
import { getCmsRuntimeConfig } from '@/lib/cms-platform';
import { readPageContentFromPayload, verifyPreviewToken } from '@/lib/payload-cms';

const objectSchema = z.record(z.any());

export const GET: APIRoute = async ({ params, request }) => {
  const pageKey = (params.page || '').toLowerCase();
  if (!isValidPageKey(pageKey)) {
    return new Response(JSON.stringify({ error: 'Invalid page key' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  const runtime = await getCmsRuntimeConfig();
  if (runtime.cmsPlatform === 'payload') {
    const cookies = parse(request.headers.get('cookie') || '');
    const previewToken = cookies.br_preview_token;
    const previewPage = cookies.br_preview_page;
    const draftAllowed = Boolean(
      previewToken &&
      previewPage === pageKey &&
      verifyPreviewToken(pageKey, previewToken)
    );
    const readMode = runtime.payloadReadMode;
    const shouldReadPayload = draftAllowed || readMode === 'all';
    const fromPayload = shouldReadPayload
      ? await readPageContentFromPayload(pageKey, { draft: draftAllowed }).catch(() => null)
      : null;
    if (fromPayload && shouldReadPayload) {
      return new Response(JSON.stringify(fromPayload), {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      });
    }
  }

  const payload = await readContentFromStorage(pageKey);
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

export const PUT: APIRoute = async ({ params, request }) => {
  const pageKey = (params.page || '').toLowerCase();
  if (!isValidPageKey(pageKey)) {
    return new Response(JSON.stringify({ error: 'Invalid page key' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  const parsed = objectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Top-level JSON must be an object' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  await saveContentToStorage(pageKey, parsed.data);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
};
