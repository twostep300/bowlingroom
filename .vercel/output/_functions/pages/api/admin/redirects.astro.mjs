import { z } from 'zod';
import { r as requireRole } from '../../../chunks/auth_DISlxqQV.mjs';
import { d as db } from '../../../chunks/db_DpmQIvvC.mjs';
export { renderers } from '../../../renderers.mjs';

const schema = z.object({
  fromPath: z.string().min(1),
  toPath: z.string().min(1),
  statusCode: z.number().int().min(301).max(308).optional(),
  isActive: z.boolean().optional()
});
const GET = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const redirects = await db.redirectRule.findMany({ orderBy: { updatedAt: "desc" } });
  return new Response(JSON.stringify({ ok: true, redirects }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const POST = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const redirect = await db.redirectRule.create({
    data: {
      fromPath: parsed.data.fromPath,
      toPath: parsed.data.toPath,
      statusCode: parsed.data.statusCode ?? 301,
      isActive: parsed.data.isActive ?? true
    }
  });
  return new Response(JSON.stringify({ ok: true, redirect }), {
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
