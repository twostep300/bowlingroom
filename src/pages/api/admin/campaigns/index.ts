import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  type: z.enum(['POPUP', 'FLOATING_BAR']),
  headline: z.string().min(1),
  text: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  pageTargeting: z.any().optional().nullable(),
  deviceTargeting: z.any().optional().nullable(),
  scheduleJson: z.any().optional().nullable(),
  frequencyJson: z.any().optional().nullable(),
  trigger: z.enum(['DELAY', 'SCROLL', 'EXIT_INTENT']).optional(),
  triggerValue: z.number().int().optional().nullable(),
  trackingEvents: z.any().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  locationId: z.string().optional().nullable()
});

export const GET: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const campaigns = await db.campaign.findMany({ orderBy: { updatedAt: 'desc' } });
  return new Response(JSON.stringify({ ok: true, campaigns }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

export const POST: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });

  const campaign = await db.campaign.create({
    data: {
      ...parsed.data,
      trigger: parsed.data.trigger ?? 'DELAY',
      status: parsed.data.status ?? 'DRAFT'
    }
  });

  return new Response(JSON.stringify({ ok: true, campaign }), {
    status: 201,
    headers: { 'content-type': 'application/json' }
  });
};
