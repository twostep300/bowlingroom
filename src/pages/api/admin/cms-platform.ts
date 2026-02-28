import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { clearCmsRuntimeCache, getCmsRuntimeConfig } from '@/lib/cms-platform';
import { listPagesFromPayload } from '@/lib/payload-cms';

const updateSchema = z.object({
  cmsPlatform: z.enum(['custom', 'payload']),
  payloadReadMode: z.enum(['preview-only', 'all'])
});

export const GET: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const runtime = await getCmsRuntimeConfig({ forceRefresh: true });
  const payloadPages = runtime.cmsPlatform === 'payload'
    ? await listPagesFromPayload().catch(() => [])
    : [];
  const payloadBaseUrl = (process.env.PAYLOAD_CMS_URL || 'http://127.0.0.1:4000').replace(/\/+$/, '');
  const payloadAdminUrl = `${payloadBaseUrl}/admin`;
  const payloadApiUrl = `${payloadBaseUrl}/api/pages?limit=1`;

  let apiReachable = false;
  try {
    const res = await fetch(payloadApiUrl, { method: 'GET', cache: 'no-store' });
    apiReachable = res.ok;
  } catch {
    apiReachable = false;
  }

  return new Response(JSON.stringify({
    ok: true,
    runtime,
    payload: {
      baseUrl: payloadBaseUrl,
      adminUrl: payloadAdminUrl,
      apiUrl: payloadApiUrl,
      apiReachable
    },
    payloadProbe: {
      reachable: payloadPages.length > 0,
      pageCount: payloadPages.length
    }
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

export const PUT: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const parsed = updateSchema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });

  await db.siteSetting.upsert({
    where: { key: 'cms.platform' },
    update: { value: parsed.data.cmsPlatform },
    create: { key: 'cms.platform', value: parsed.data.cmsPlatform }
  });
  await db.siteSetting.upsert({
    where: { key: 'cms.payloadReadMode' },
    update: { value: parsed.data.payloadReadMode },
    create: { key: 'cms.payloadReadMode', value: parsed.data.payloadReadMode }
  });

  clearCmsRuntimeCache();
  const runtime = await getCmsRuntimeConfig({ forceRefresh: true });

  return new Response(JSON.stringify({ ok: true, runtime }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
