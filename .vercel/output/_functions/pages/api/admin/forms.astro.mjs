import { z } from 'zod';
import { r as requireRole } from '../../../chunks/auth_Cf9RIyTi.mjs';
import { d as db } from '../../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../../renderers.mjs';

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
});
const GET = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const forms = await db.form.findMany({
    include: { fields: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" }
  });
  return new Response(JSON.stringify({ ok: true, forms }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const POST = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const parsed = createSchema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const form = await db.form.create({ data: parsed.data });
  return new Response(JSON.stringify({ ok: true, form }), {
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
