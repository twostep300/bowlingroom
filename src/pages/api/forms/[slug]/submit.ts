import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { isRateLimited } from '@/lib/security';
import { pushToPrevo } from '@/lib/integrations/prevo';
import { pushToZendesk } from '@/lib/integrations/zendesk';

const submissionSchema = z.object({
  payload: z.record(z.any()),
  utm: z.record(z.string()).optional(),
  consent: z.record(z.boolean()).optional(),
  honeypot: z.string().optional()
});

export const POST: APIRoute = async ({ params, request, clientAddress }) => {
  const slug = params.slug;
  if (!slug) return new Response(JSON.stringify({ ok: false, error: 'Missing form slug' }), { status: 400 });

  const rateKey = `${clientAddress}:${slug}`;
  if (isRateLimited(rateKey)) {
    return new Response(JSON.stringify({ ok: false, error: 'Too many requests' }), { status: 429 });
  }

  const parsed = submissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid submission payload' }), { status: 400 });
  }

  if (parsed.data.honeypot && parsed.data.honeypot.trim() !== '') {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const form = await db.form.findUnique({
    where: { slug },
    include: { fields: { orderBy: { sortOrder: 'asc' } } }
  });
  if (!form || form.status !== 'PUBLISHED') {
    return new Response(JSON.stringify({ ok: false, error: 'Form not available' }), { status: 404 });
  }

  const validationErrors: Array<{ field: string; message: string }> = [];
  const payloadRecord = parsed.data.payload as Record<string, unknown>;
  for (const field of form.fields) {
    const value = payloadRecord[field.name];
    const hasValue = value !== undefined && value !== null && String(value).trim() !== '';

    if (field.required && !hasValue) {
      validationErrors.push({ field: field.name, message: 'Required field missing' });
      continue;
    }
    if (!hasValue) continue;

    if (field.regexPattern) {
      const regex = new RegExp(field.regexPattern);
      if (!regex.test(String(value))) {
        validationErrors.push({ field: field.name, message: 'Regex validation failed' });
      }
    }
    if (field.minValue !== null || field.maxValue !== null) {
      const n = Number(value);
      if (Number.isNaN(n)) {
        validationErrors.push({ field: field.name, message: 'Expected numeric value' });
      } else {
        if (field.minValue !== null && n < field.minValue) {
          validationErrors.push({ field: field.name, message: `Value below minimum ${field.minValue}` });
        }
        if (field.maxValue !== null && n > field.maxValue) {
          validationErrors.push({ field: field.name, message: `Value above maximum ${field.maxValue}` });
        }
      }
    }
  }
  if (validationErrors.length > 0) {
    return new Response(JSON.stringify({ ok: false, error: 'Validation failed', validationErrors }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  const urlUtm = Object.fromEntries(
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
      .map((key) => [key, new URL(request.url).searchParams.get(key)])
      .filter(([, value]) => Boolean(value))
  );

  const submission = await db.formSubmission.create({
    data: {
      formId: form.id,
      payload: payloadRecord as Prisma.InputJsonValue,
      utmData: { ...urlUtm, ...(parsed.data.utm ?? {}) },
      consentFlags: parsed.data.consent ?? {},
      status: 'new',
      ipAddress: clientAddress,
      userAgent: request.headers.get('user-agent') || null,
      sourceUrl: request.headers.get('origin') || null,
      refererUrl: request.headers.get('referer') || null
    }
  });

  const integrationLog: Record<string, Prisma.InputJsonValue> = {};
  try {
    if (form.webhookUrl || form.recipientEmail || process.env.ZENDESK_WEBHOOK_URL || process.env.ZENDESK_INBOUND_EMAIL) {
      await pushToZendesk({
        subject: `[${form.name}] Neue Anfrage`,
        text: JSON.stringify(parsed.data.payload, null, 2),
        recipientEmail: form.recipientEmail || process.env.ZENDESK_INBOUND_EMAIL,
        webhookUrl: form.webhookUrl || process.env.ZENDESK_WEBHOOK_URL
      });
      integrationLog.zendesk = { ok: true };
    }
  } catch (error) {
    integrationLog.zendesk = { ok: false, error: String(error) };
  }

  try {
    if (form.prevoEnabled && typeof parsed.data.payload.email === 'string') {
      await pushToPrevo({
        email: parsed.data.payload.email,
        name: parsed.data.payload.name,
        phone: parsed.data.payload.phone,
        tags: form.prevoListTag ? [form.prevoListTag] : [],
        utm: parsed.data.utm
      });
      integrationLog.prevo = { ok: true };
    }
  } catch (error) {
    integrationLog.prevo = { ok: false, error: String(error) };
  }

  if (Object.keys(integrationLog).length > 0) {
    await db.formSubmission.update({
      where: { id: submission.id },
      data: { integrationLog: integrationLog as Prisma.InputJsonValue }
    });
  }

  return new Response(JSON.stringify({ ok: true, id: submission.id }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
