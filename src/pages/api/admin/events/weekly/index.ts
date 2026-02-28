import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  descriptionShort: z.string().optional().nullable(),
  descriptionLong: z.string().optional().nullable(),
  weekdays: z.array(z.string()).min(1),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  sortOrder: z.number().int().optional(),
  locationIds: z.array(z.string()).optional()
});

export const GET: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const weeklyEvents = await db.weeklyEvent.findMany({
    include: { locations: true },
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
  });

  return new Response(JSON.stringify({ ok: true, weeklyEvents }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

export const POST: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });

  const weeklyEvent = await db.weeklyEvent.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      descriptionShort: parsed.data.descriptionShort,
      descriptionLong: parsed.data.descriptionLong,
      weekdays: parsed.data.weekdays,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      image: parsed.data.image,
      ctaLabel: parsed.data.ctaLabel,
      ctaUrl: parsed.data.ctaUrl,
      sortOrder: parsed.data.sortOrder ?? 100,
      status: parsed.data.status ?? 'DRAFT',
      locations: {
        create: (parsed.data.locationIds || []).map((locationId) => ({ locationId }))
      }
    },
    include: { locations: true }
  });

  return new Response(JSON.stringify({ ok: true, weeklyEvent }), {
    status: 201,
    headers: { 'content-type': 'application/json' }
  });
};
