import type { APIRoute } from 'astro';
import { db } from '@/lib/db';

export const GET: APIRoute = async () => {
  const settings = await db.siteSetting.findMany({
    where: { key: { in: ['tracking.ga4MeasurementId', 'tracking.metaPixelId'] } }
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const ga4 = (map['tracking.ga4MeasurementId'] as string | undefined) || process.env.GA4_MEASUREMENT_ID || null;
  const meta = (map['tracking.metaPixelId'] as string | undefined) || process.env.META_PIXEL_ID || null;

  return new Response(
    JSON.stringify({
      ok: true,
      ga4MeasurementId: ga4,
      metaPixelId: meta
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }
  );
};
