import { d as db } from '../../chunks/db_DpmQIvvC.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const now = /* @__PURE__ */ new Date();
  const locationSlug = url.searchParams.get("location");
  const pagePath = url.searchParams.get("path");
  const device = url.searchParams.get("device");
  const deals = await db.deal.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      ...locationSlug ? { location: { slug: locationSlug } } : {}
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }]
  });
  const filtered = deals.filter((deal) => {
    const showOn = deal.showOn ?? {};
    if (pagePath && showOn.global !== true && Array.isArray(showOn.pages) && showOn.pages.length > 0) {
      if (!showOn.pages.includes(pagePath)) return false;
    }
    const targeting = deal.deviceTargeting ?? {};
    if (device && Array.isArray(targeting.devices) && targeting.devices.length > 0) {
      if (!targeting.devices.includes(device)) return false;
    }
    return true;
  });
  return new Response(JSON.stringify({ ok: true, deals: filtered }), {
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
