import { z } from 'zod';
import { r as requireRole } from '../../../../../../chunks/auth_Cf9RIyTi.mjs';
import { d as db } from '../../../../../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../../../../../renderers.mjs';

const schema = z.object({
  type: z.enum(["TEXT", "TEXTAREA", "EMAIL", "PHONE", "NUMBER", "DROPDOWN", "CHECKBOX", "RADIO", "DATE", "TIME", "HIDDEN", "CONSENT"]).optional(),
  name: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  placeholder: z.string().optional().nullable(),
  helpText: z.string().optional().nullable(),
  options: z.any().optional().nullable(),
  required: z.boolean().optional(),
  regexPattern: z.string().optional().nullable(),
  minValue: z.number().optional().nullable(),
  maxValue: z.number().optional().nullable(),
  conditionalJson: z.any().optional().nullable(),
  sortOrder: z.number().int().optional()
});
const PUT = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const fieldId = context.params.fieldId;
  if (!fieldId) return new Response(JSON.stringify({ ok: false, error: "Missing field id" }), { status: 400 });
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const field = await db.formField.update({ where: { id: fieldId }, data: parsed.data });
  return new Response(JSON.stringify({ ok: true, field }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const DELETE = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const fieldId = context.params.fieldId;
  if (!fieldId) return new Response(JSON.stringify({ ok: false, error: "Missing field id" }), { status: 400 });
  await db.formField.delete({ where: { id: fieldId } });
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
