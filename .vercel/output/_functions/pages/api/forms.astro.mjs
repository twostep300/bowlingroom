import { d as db } from '../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const slug = url.searchParams.get("slug");
  if (slug) {
    const form = await db.form.findUnique({
      where: { slug },
      include: { fields: { orderBy: { sortOrder: "asc" } } }
    });
    if (!form || form.status !== "PUBLISHED") {
      return new Response(JSON.stringify({ ok: false, error: "Form not found" }), {
        status: 404,
        headers: { "content-type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ ok: true, form }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
  const forms = await db.form.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true, name: true, trackingEventName: true, redirectUrl: true }
  });
  return new Response(JSON.stringify({ ok: true, forms }), {
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
