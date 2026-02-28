import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  fromPath: z.string().min(1),
  toPath: z.string().min(1),
  statusCode: z.number().int().min(301).max(308).optional(),
  isActive: z.boolean().optional()
});

export const GET: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const redirects = await db.redirectRule.findMany({ orderBy: { updatedAt: 'desc' } });
  return new Response(JSON.stringify({ ok: true, redirects }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

export const POST: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });

  const redirect = await db.redirectRule.create({
    data: {
      fromPath: parsed.data.fromPath,
      toPath: parsed.data.toPath,
      statusCode: parsed.data.statusCode ?? 301,
      isActive: parsed.data.isActive ?? true
    }
  });

  return new Response(JSON.stringify({ ok: true, redirect }), {
    status: 201,
    headers: { 'content-type': 'application/json' }
  });
};
