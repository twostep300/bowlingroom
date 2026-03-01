import { z } from 'zod';
import { r as requireRole } from '../../../../chunks/auth_DISlxqQV.mjs';
import { d as db } from '../../../../chunks/db_DpmQIvvC.mjs';
export { renderers } from '../../../../renderers.mjs';

const schema = z.object({
  type: z.enum(["POPUP", "FLOATING_BAR"]).optional(),
  headline: z.string().min(1).optional(),
  text: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  pageTargeting: z.any().optional().nullable(),
  deviceTargeting: z.any().optional().nullable(),
  scheduleJson: z.any().optional().nullable(),
  frequencyJson: z.any().optional().nullable(),
  trigger: z.enum(["DELAY", "SCROLL", "EXIT_INTENT"]).optional(),
  triggerValue: z.number().int().optional().nullable(),
  trackingEvents: z.any().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  locationId: z.string().optional().nullable()
});
const PUT = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const campaign = await db.campaign.update({ where: { id }, data: parsed.data });
  return new Response(JSON.stringify({ ok: true, campaign }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const DELETE = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  await db.campaign.delete({ where: { id } });
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
