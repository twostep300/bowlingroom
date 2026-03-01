import { z } from 'zod';
import { r as requireRole } from '../../../chunks/auth_Cf9RIyTi.mjs';
import { d as db } from '../../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../../renderers.mjs';

const querySchema = z.object({
  formSlug: z.string().optional(),
  status: z.string().optional(),
  format: z.enum(["json", "csv"]).optional()
});
function toCsv(rows) {
  if (!rows.length) return "id,formSlug,status,createdAt\n";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
  }
  return `${lines.join("\n")}
`;
}
const GET = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(context.url.searchParams.entries()));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid query" }), { status: 400 });
  const leads = await db.formSubmission.findMany({
    where: {
      ...parsed.data.status ? { status: parsed.data.status } : {},
      ...parsed.data.formSlug ? { form: { slug: parsed.data.formSlug } } : {}
    },
    include: { form: true },
    orderBy: { createdAt: "desc" },
    take: 500
  });
  const rows = leads.map((lead) => ({
    id: lead.id,
    formSlug: lead.form.slug,
    status: lead.status,
    createdAt: lead.createdAt.toISOString(),
    utm: JSON.stringify(lead.utmData ?? {}),
    payload: JSON.stringify(lead.payload ?? {})
  }));
  if (parsed.data.format === "csv") {
    return new Response(toCsv(rows), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="leads.csv"'
      }
    });
  }
  return new Response(JSON.stringify({ ok: true, leads: rows }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
