import type { APIRoute } from 'astro';
import { db } from '@/lib/db';

export const GET: APIRoute = async ({ url }) => {
  const now = new Date();
  const locationSlug = url.searchParams.get('location');
  const pagePath = url.searchParams.get('path');
  const device = url.searchParams.get('device');

  const deals = await db.deal.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      ...(locationSlug ? { location: { slug: locationSlug } } : {})
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
  });

  const filtered = deals.filter((deal) => {
    const showOn = (deal.showOn ?? {}) as { global?: boolean; pages?: string[] };
    if (pagePath && showOn.global !== true && Array.isArray(showOn.pages) && showOn.pages.length > 0) {
      if (!showOn.pages.includes(pagePath)) return false;
    }

    const targeting = (deal.deviceTargeting ?? {}) as { devices?: string[] };
    if (device && Array.isArray(targeting.devices) && targeting.devices.length > 0) {
      if (!targeting.devices.includes(device)) return false;
    }
    return true;
  });

  return new Response(JSON.stringify({ ok: true, deals: filtered }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
