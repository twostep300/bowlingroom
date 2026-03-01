import { z } from 'zod';
import { r as requireRole } from '../../../chunks/auth_Cf9RIyTi.mjs';
import { d as db } from '../../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../../renderers.mjs';

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.any()
});
const GET = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const settings = await db.siteSetting.findMany({ orderBy: { key: "asc" } });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return new Response(JSON.stringify({ ok: true, settings: map }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const PUT = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const parsed = updateSchema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  const setting = await db.siteSetting.upsert({
    where: { key: parsed.data.key },
    update: { value: parsed.data.value },
    create: { key: parsed.data.key, value: parsed.data.value }
  });
  return new Response(JSON.stringify({ ok: true, setting }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
