import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { createPreviewToken } from '@/lib/payload-cms';

const schema = z.object({
  page: z.string().min(1)
});

export const POST: APIRoute = async (context) => {
  const user = await requireRole(context, ['ADMIN', 'EDITOR']);
  if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  const page = parsed.data.page.toLowerCase();
  const token = createPreviewToken(page, 900);
  const url = `/preview?page=${encodeURIComponent(page)}&token=${encodeURIComponent(token)}`;
  return new Response(JSON.stringify({ ok: true, token, url }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
