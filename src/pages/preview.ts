import type { APIRoute } from 'astro';
import { createPreviewToken, verifyPreviewToken } from '@/lib/payload-cms';

function pageToPath(page: string): string {
  return page === 'brand' ? '/' : `/locations/${page}`;
}

export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const page = (url.searchParams.get('page') || '').toLowerCase();
  const token = url.searchParams.get('token') || '';
  if (!page) {
    return new Response('Missing page', { status: 400 });
  }

  const isLocalHost = ['127.0.0.1', 'localhost'].includes(url.hostname);
  const allowUnsignedLocalPreview =
    process.env.NODE_ENV !== 'production' &&
    isLocalHost &&
    process.env.PAYLOAD_ALLOW_UNSIGNED_LOCAL_PREVIEW !== 'false';
  const valid = allowUnsignedLocalPreview && !token ? true : verifyPreviewToken(page, token);
  if (!valid) {
    return new Response('Invalid preview token', { status: 401 });
  }

  const previewToken = createPreviewToken(page, 900);
  const target = `${pageToPath(page)}?cmsPreview=1`;
  const response = redirect(target, 302);
  response.headers.append('set-cookie', `br_preview_token=${previewToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`);
  response.headers.append('set-cookie', `br_preview_page=${page}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`);
  return response;
};
