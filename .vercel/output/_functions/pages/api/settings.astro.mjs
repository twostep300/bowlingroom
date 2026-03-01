import { d as db } from '../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async () => {
  const settings = await db.siteSetting.findMany({
    where: { key: { in: ["marketing.defaults", "tracking.ga4MeasurementId", "tracking.metaPixelId"] } }
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return new Response(JSON.stringify({ ok: true, settings: map }), {
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
