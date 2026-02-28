import type { APIRoute } from 'astro';
import { parse } from 'cookie';
import { z } from 'zod';

const COOKIE_NAME = 'br_consent';

const consentSchema = z.object({
  necessary: z.boolean().default(true),
  analytics: z.boolean().default(false),
  marketing: z.boolean().default(false)
});

export const GET: APIRoute = async ({ request }) => {
  const cookies = parse(request.headers.get('cookie') || '');
  const raw = cookies[COOKIE_NAME];
  if (!raw) {
    return new Response(JSON.stringify({ ok: true, consent: null }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const parsed = consentSchema.parse(JSON.parse(raw));
    return new Response(JSON.stringify({ ok: true, consent: parsed }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ ok: true, consent: null }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const parsed = consentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid consent payload' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: true, consent: parsed.data }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'set-cookie': `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(parsed.data))}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`
    }
  });
};
