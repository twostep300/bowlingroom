import { z } from 'zod';
import { r as requireRole } from '../../../../../chunks/auth_Cf9RIyTi.mjs';
import { d as db } from '../../../../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../../../../renderers.mjs';

const fieldSchema = z.object({
  type: z.enum(["TEXT", "TEXTAREA", "EMAIL", "PHONE", "NUMBER", "DROPDOWN", "CHECKBOX", "RADIO", "DATE", "TIME", "HIDDEN", "CONSENT"]),
  name: z.string().min(1),
  label: z.string().min(1),
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
const GET = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing form id" }), { status: 400 });
  const fields = await db.formField.findMany({ where: { formId: id }, orderBy: { sortOrder: "asc" } });
  return new Response(JSON.stringify({ ok: true, fields }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const POST = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const id = context.params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing form id" }), { status: 400 });
  const parsed = fieldSchema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const field = await db.formField.create({
    data: {
      formId: id,
      ...parsed.data,
      required: parsed.data.required ?? false,
      sortOrder: parsed.data.sortOrder ?? 100
    }
  });
  return new Response(JSON.stringify({ ok: true, field }), {
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
