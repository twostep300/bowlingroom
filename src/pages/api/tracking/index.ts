import type { APIRoute } from 'astro';
import { z } from 'zod';
import { parse } from 'cookie';
import { db } from '@/lib/db';

const schema = z.object({
  name: z.string().min(1),
  category: z.enum(['necessary', 'analytics', 'marketing']),
  payload: z.record(z.any()).optional(),
  consent: z.string().optional(),
  sessionId: z.string().optional()
});

export const POST: APIRoute = async ({ request }) => {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid event payload' }), { status: 400 });
  }

  const cookieConsent = (() => {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = parse(cookieHeader);
    const raw = cookies.br_consent;
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw)) as { analytics?: boolean; marketing?: boolean };
    } catch {
      return null;
    }
  })();
  if (parsed.data.category === 'analytics' && cookieConsent?.analytics !== true) {
    return new Response(JSON.stringify({ ok: false, error: 'Analytics consent required' }), { status: 202 });
  }
  if (parsed.data.category === 'marketing' && cookieConsent?.marketing !== true) {
    return new Response(JSON.stringify({ ok: false, error: 'Marketing consent required' }), { status: 202 });
  }

  await db.trackingEvent.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      payload: parsed.data.payload ?? {},
      consent: parsed.data.consent,
      sessionId: parsed.data.sessionId
    }
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
