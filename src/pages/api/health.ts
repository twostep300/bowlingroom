import type { APIRoute } from 'astro';
import { getCmsRuntimeConfig } from '@/lib/cms-platform';

export const GET: APIRoute = async () => {
  const runtime = await getCmsRuntimeConfig();
  return new Response(JSON.stringify({
    ok: true,
    service: 'bowlingroom-cms',
    cmsPlatform: runtime.cmsPlatform,
    cmsPayloadReadMode: runtime.payloadReadMode,
    cmsConfigSource: runtime.source
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
