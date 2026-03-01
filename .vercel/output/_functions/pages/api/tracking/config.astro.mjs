import { d as db } from '../../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async () => {
  const settings = await db.siteSetting.findMany({
    where: { key: { in: ["tracking.ga4MeasurementId", "tracking.metaPixelId"] } }
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const ga4 = map["tracking.ga4MeasurementId"] || process.env.GA4_MEASUREMENT_ID || null;
  const meta = map["tracking.metaPixelId"] || process.env.META_PIXEL_ID || null;
  return new Response(
    JSON.stringify({
      ok: true,
      ga4MeasurementId: ga4,
      metaPixelId: meta
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" }
    }
  );
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
