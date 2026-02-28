import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  openingHours: z.any().optional().nullable(),
  images: z.any().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  indexable: z.boolean().optional(),
  jsonLd: z.any().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  pageId: z.string().optional().nullable()
});

export const PUT: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'Missing id' }), { status: 400 });

  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });

  const location = await db.location.update({ where: { id }, data: parsed.data });
  return new Response(JSON.stringify({ ok: true, location }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

export const DELETE: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'Missing id' }), { status: 400 });

  await db.location.delete({ where: { id } });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
