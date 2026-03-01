import { z } from 'zod';
import { r as requireRole } from '../../../../../chunks/auth_Cf9RIyTi.mjs';
import { d as db } from '../../../../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../../../../renderers.mjs';

const schema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional().nullable(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  highlight: z.boolean().optional(),
  priority: z.number().int().optional(),
  seoTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  indexable: z.boolean().optional(),
  jsonLd: z.any().optional().nullable(),
  locationIds: z.array(z.string()).optional()
});
const PUT = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const { locationIds, startDateTime, endDateTime, ...rest } = parsed.data;
  const specialEvent = await db.specialEvent.update({
    where: { id },
    data: {
      ...rest,
      ...startDateTime ? { startDateTime: new Date(startDateTime) } : {},
      ...endDateTime !== void 0 ? { endDateTime: endDateTime ? new Date(endDateTime) : null } : {},
      ...locationIds ? {
        locations: {
          deleteMany: {},
          create: locationIds.map((locationId) => ({ locationId }))
        }
      } : {}
    },
    include: { locations: true }
  });
  return new Response(JSON.stringify({ ok: true, specialEvent }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const DELETE = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  await db.specialEvent.delete({ where: { id } });
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
