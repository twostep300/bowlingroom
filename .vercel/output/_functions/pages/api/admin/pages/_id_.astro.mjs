import { z } from 'zod';
import { r as requireRole } from '../../../../chunks/auth_Cf9RIyTi.mjs';
import { d as db } from '../../../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../../../renderers.mjs';

const schema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  seoTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  indexable: z.boolean().optional(),
  jsonLd: z.any().optional().nullable(),
  content: z.any().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  publishedAt: z.string().datetime().optional().nullable()
});
const PUT = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const page = await db.contentPage.update({
    where: { id },
    data: {
      ...parsed.data,
      publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : parsed.data.publishedAt
    }
  });
  return new Response(JSON.stringify({ ok: true, page }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const DELETE = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  await db.contentPage.delete({ where: { id } });
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
