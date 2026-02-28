import type { APIRoute } from 'astro';
import { db } from '@/lib/db';

export const GET: APIRoute = async () => {
  const settings = await db.siteSetting.findMany({
    where: { key: { in: ['marketing.defaults', 'tracking.ga4MeasurementId', 'tracking.metaPixelId'] } }
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return new Response(JSON.stringify({ ok: true, settings: map }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
