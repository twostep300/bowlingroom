import { d as db } from '../chunks/db_DpmQIvvC.mjs';
export { renderers } from '../renderers.mjs';

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
function absolute(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}
const GET = async ({ site }) => {
  const baseUrl = (site || new URL(process.env.PUBLIC_SITE_URL || "http://localhost:4321")).toString();
  const [pages, locations, specialEvents] = await Promise.all([
    db.contentPage.findMany({
      where: { status: "PUBLISHED", indexable: true },
      select: { slug: true, updatedAt: true }
    }),
    db.location.findMany({
      where: { status: "PUBLISHED", indexable: true },
      select: { slug: true, updatedAt: true }
    }),
    db.specialEvent.findMany({
      where: { status: "PUBLISHED", indexable: true },
      select: { slug: true, updatedAt: true }
    })
  ]);
  const urls = [
    { loc: absolute(baseUrl, "/") },
    ...pages.map((p) => ({ loc: absolute(baseUrl, `/${p.slug}`), lastmod: p.updatedAt.toISOString() })),
    ...locations.map((l) => ({ loc: absolute(baseUrl, `/locations/${l.slug}`), lastmod: l.updatedAt.toISOString() })),
    ...specialEvents.map((e) => ({ loc: absolute(baseUrl, `/events/${e.slug}`), lastmod: e.updatedAt.toISOString() }))
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((entry) => {
    const lastmodNode = entry.lastmod ? `
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : "";
    return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${lastmodNode}
  </url>`;
  }).join("\n")}
</urlset>
`;
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
