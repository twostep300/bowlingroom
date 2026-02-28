import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  title: z.string().min(1),
  label: z.string().optional().nullable(),
  shortText: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  showOn: z.any().optional().nullable(),
  deviceTargeting: z.any().optional().nullable(),
  priority: z.number().int().optional(),
  trackingEventNames: z.any().optional().nullable(),
  locationId: z.string().optional().nullable()
});

export const GET: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const deals = await db.deal.findMany({ orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }] });
  return new Response(JSON.stringify({ ok: true, deals }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

export const POST: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });

  const deal = await db.deal.create({
    data: {
      ...parsed.data,
      status: parsed.data.status ?? 'DRAFT',
      priority: parsed.data.priority ?? 0,
      startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null
    }
  });

  return new Response(JSON.stringify({ ok: true, deal }), {
    status: 201,
    headers: { 'content-type': 'application/json' }
  });
};
