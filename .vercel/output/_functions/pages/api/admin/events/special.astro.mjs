import { z } from 'zod';
import { r as requireRole } from '../../../../chunks/auth_Cf9RIyTi.mjs';
import { d as db } from '../../../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../../../renderers.mjs';

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  startDateTime: z.string().datetime(),
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
const GET = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const specialEvents = await db.specialEvent.findMany({
    include: { locations: true },
    orderBy: [{ priority: "desc" }, { startDateTime: "asc" }]
  });
  return new Response(JSON.stringify({ ok: true, specialEvents }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const POST = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const specialEvent = await db.specialEvent.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      startDateTime: new Date(parsed.data.startDateTime),
      endDateTime: parsed.data.endDateTime ? new Date(parsed.data.endDateTime) : null,
      description: parsed.data.description,
      image: parsed.data.image,
      ctaLabel: parsed.data.ctaLabel,
      ctaUrl: parsed.data.ctaUrl,
      status: parsed.data.status ?? "DRAFT",
      highlight: parsed.data.highlight ?? false,
      priority: parsed.data.priority ?? 0,
      seoTitle: parsed.data.seoTitle,
      metaDescription: parsed.data.metaDescription,
      ogImage: parsed.data.ogImage,
      canonicalUrl: parsed.data.canonicalUrl,
      indexable: parsed.data.indexable ?? true,
      jsonLd: parsed.data.jsonLd,
      locations: {
        create: (parsed.data.locationIds || []).map((locationId) => ({ locationId }))
      }
    },
    include: { locations: true }
  });
  return new Response(JSON.stringify({ ok: true, specialEvent }), {
    status: 201,
    headers: { "content-type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
