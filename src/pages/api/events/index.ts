import type { APIRoute } from 'astro';
import { db } from '@/lib/db';

export const GET: APIRoute = async ({ url }) => {
  const locationSlug = url.searchParams.get('location');
  const now = new Date();

  const whereLocation = locationSlug
    ? {
        locations: {
          some: {
            location: {
              slug: locationSlug
            }
          }
        }
      }
    : {};

  const weekly = await db.weeklyEvent.findMany({
    where: { status: 'PUBLISHED', ...whereLocation },
    orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }]
  });

  const special = await db.specialEvent.findMany({
    where: {
      status: 'PUBLISHED',
      startDateTime: { gte: now },
      ...whereLocation
    },
    orderBy: [{ priority: 'desc' }, { startDateTime: 'asc' }]
  });

  const highlights = special.filter((event) => event.highlight);

  return new Response(JSON.stringify({ ok: true, weekly, special, highlights }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
