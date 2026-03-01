import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.any()
});

export const GET: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  try {
    const settings = await db.siteSetting.findMany({ orderBy: { key: 'asc' } });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return new Response(JSON.stringify({ ok: true, settings: map }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ ok: true, settings: {} }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const parsed = updateSchema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });

  const setting = await db.siteSetting.upsert({
    where: { key: parsed.data.key },
    update: { value: parsed.data.value },
    create: { key: parsed.data.key, value: parsed.data.value }
  });

  return new Response(JSON.stringify({ ok: true, setting }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
