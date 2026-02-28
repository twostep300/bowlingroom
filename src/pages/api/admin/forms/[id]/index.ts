import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  targetPageSlugs: z.any().optional().nullable(),
  trackingEventName: z.string().optional().nullable(),
  redirectUrl: z.string().optional().nullable(),
  recipientEmail: z.string().optional().nullable(),
  webhookUrl: z.string().optional().nullable(),
  zendeskMode: z.string().optional().nullable(),
  prevoEnabled: z.boolean().optional(),
  prevoListTag: z.string().optional().nullable(),
  useMultiStep: z.boolean().optional(),
  locationId: z.string().optional().nullable()
});

export const PUT: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'Missing id' }), { status: 400 });

  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });

  const form = await db.form.update({ where: { id }, data: parsed.data });
  return new Response(JSON.stringify({ ok: true, form }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

export const DELETE: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'Missing id' }), { status: 400 });

  await db.form.delete({ where: { id } });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
