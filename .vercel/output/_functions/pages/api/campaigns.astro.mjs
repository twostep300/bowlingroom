import { d as db } from '../../chunks/db_DpmQIvvC.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const locationSlug = url.searchParams.get("location");
  const pagePath = url.searchParams.get("path");
  const device = url.searchParams.get("device");
  const now = /* @__PURE__ */ new Date();
  const campaigns = await db.campaign.findMany({
    where: {
      status: "PUBLISHED",
      ...locationSlug ? { location: { slug: locationSlug } } : {}
    },
    orderBy: { updatedAt: "desc" }
  });
  const filtered = campaigns.filter((campaign) => {
    const schedule = campaign.scheduleJson ?? {};
    if (schedule.startAt && new Date(schedule.startAt) > now) return false;
    if (schedule.endAt && new Date(schedule.endAt) < now) return false;
    const pages = Array.isArray(campaign.pageTargeting?.paths) ? campaign.pageTargeting.paths : [];
    if (pagePath && pages.length > 0 && !pages.includes(pagePath)) return false;
    const devices = Array.isArray(campaign.deviceTargeting?.devices) ? campaign.deviceTargeting.devices : [];
    if (device && devices.length > 0 && !devices.includes(device)) return false;
    return true;
  });
  return new Response(JSON.stringify({ ok: true, campaigns: filtered }), {
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
