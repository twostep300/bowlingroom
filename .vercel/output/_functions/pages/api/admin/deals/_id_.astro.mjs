import { z } from 'zod';
import { r as requireRole } from '../../../../chunks/auth_Cf9RIyTi.mjs';
import { d as db } from '../../../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../../../renderers.mjs';

const schema = z.object({
  title: z.string().min(1).optional(),
  label: z.string().optional().nullable(),
  shortText: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  showOn: z.any().optional().nullable(),
  deviceTargeting: z.any().optional().nullable(),
  priority: z.number().int().optional(),
  trackingEventNames: z.any().optional().nullable(),
  locationId: z.string().optional().nullable()
});
const PUT = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const { startAt, endAt, ...rest } = parsed.data;
  const deal = await db.deal.update({
    where: { id },
    data: {
      ...rest,
      ...startAt !== void 0 ? { startAt: startAt ? new Date(startAt) : null } : {},
      ...endAt !== void 0 ? { endAt: endAt ? new Date(endAt) : null } : {}
    }
  });
  return new Response(JSON.stringify({ ok: true, deal }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const DELETE = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  await db.deal.delete({ where: { id } });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
