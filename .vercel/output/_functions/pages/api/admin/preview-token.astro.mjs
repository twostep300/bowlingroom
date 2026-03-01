import { z } from 'zod';
import { r as requireRole } from '../../../chunks/auth_DISlxqQV.mjs';
import { c as createPreviewToken } from '../../../chunks/payload-cms_DGSW8rk7.mjs';
export { renderers } from '../../../renderers.mjs';

const schema = z.object({
  page: z.string().min(1)
});
const POST = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
  const page = parsed.data.page.toLowerCase();
  const token = createPreviewToken(page, 900);
  const url = `/preview?page=${encodeURIComponent(page)}&token=${encodeURIComponent(token)}`;
  return new Response(JSON.stringify({ ok: true, token, url }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
