import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  title: z.string().min(1).optional(),
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

export const PUT: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'Missing id' }), { status: 400 });

  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });

  const { startAt, endAt, ...rest } = parsed.data;
  const deal = await db.deal.update({
    where: { id },
    data: {
      ...rest,
      ...(startAt !== undefined ? { startAt: startAt ? new Date(startAt) : null } : {}),
      ...(endAt !== undefined ? { endAt: endAt ? new Date(endAt) : null } : {})
    }
  });

  return new Response(JSON.stringify({ ok: true, deal }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

export const DELETE: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'Missing id' }), { status: 400 });

  await db.deal.delete({ where: { id } });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
