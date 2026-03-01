import { z } from 'zod';
import { r as requireRole } from '../../../../chunks/auth_DISlxqQV.mjs';
import { d as db } from '../../../../chunks/db_DpmQIvvC.mjs';
export { renderers } from '../../../../renderers.mjs';

const schema = z.object({
  fromPath: z.string().min(1).optional(),
  toPath: z.string().min(1).optional(),
  statusCode: z.number().int().min(301).max(308).optional(),
  isActive: z.boolean().optional()
});
const PUT = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const redirect = await db.redirectRule.update({ where: { id }, data: parsed.data });
  return new Response(JSON.stringify({ ok: true, redirect }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const DELETE = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  await db.redirectRule.delete({ where: { id } });
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
