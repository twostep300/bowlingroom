import { d as db } from '../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const locationSlug = url.searchParams.get("location");
  const now = /* @__PURE__ */ new Date();
  const whereLocation = locationSlug ? {
    locations: {
      some: {
        location: {
          slug: locationSlug
        }
      }
    }
  } : {};
  const weekly = await db.weeklyEvent.findMany({
    where: { status: "PUBLISHED", ...whereLocation },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }]
  });
  const special = await db.specialEvent.findMany({
    where: {
      status: "PUBLISHED",
      startDateTime: { gte: now },
      ...whereLocation
    },
    orderBy: [{ priority: "desc" }, { startDateTime: "asc" }]
  });
  const highlights = special.filter((event) => event.highlight);
  return new Response(JSON.stringify({ ok: true, weekly, special, highlights }), {
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
