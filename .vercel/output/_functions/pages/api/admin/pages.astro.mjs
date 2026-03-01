import { z } from 'zod';
import { r as requireRole } from '../../../chunks/auth_Cf9RIyTi.mjs';
import { d as db } from '../../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../../renderers.mjs';

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
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
const GET = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const pages = await db.contentPage.findMany({ orderBy: { updatedAt: "desc" } });
  return new Response(JSON.stringify({ ok: true, pages }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const POST = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const page = await db.contentPage.create({
    data: {
      ...parsed.data,
      publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : null,
      indexable: parsed.data.indexable ?? true,
      status: parsed.data.status ?? "DRAFT"
    }
  });
  return new Response(JSON.stringify({ ok: true, page }), {
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
