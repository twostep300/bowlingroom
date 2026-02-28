import type { APIRoute } from 'astro';
import { db } from '@/lib/db';

export const GET: APIRoute = async ({ url }) => {
  const locationSlug = url.searchParams.get('location');
  const pagePath = url.searchParams.get('path');
  const device = url.searchParams.get('device');
  const now = new Date();
  const campaigns = await db.campaign.findMany({
    where: {
      status: 'PUBLISHED',
      ...(locationSlug ? { location: { slug: locationSlug } } : {})
    },
    orderBy: { updatedAt: 'desc' }
  });

  const filtered = campaigns.filter((campaign) => {
    const schedule = (campaign.scheduleJson ?? {}) as { startAt?: string; endAt?: string };
    if (schedule.startAt && new Date(schedule.startAt) > now) return false;
    if (schedule.endAt && new Date(schedule.endAt) < now) return false;

    const pages = Array.isArray((campaign.pageTargeting as Record<string, unknown> | null)?.paths)
      ? ((campaign.pageTargeting as Record<string, unknown>).paths as string[])
      : [];
    if (pagePath && pages.length > 0 && !pages.includes(pagePath)) return false;

    const devices = Array.isArray((campaign.deviceTargeting as Record<string, unknown> | null)?.devices)
      ? ((campaign.deviceTargeting as Record<string, unknown>).devices as string[])
      : [];
    if (device && devices.length > 0 && !devices.includes(device)) return false;
    return true;
  });

  return new Response(JSON.stringify({ ok: true, campaigns: filtered }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
