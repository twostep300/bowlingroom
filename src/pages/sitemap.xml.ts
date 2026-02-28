import type { APIRoute } from 'astro';
import { db } from '@/lib/db';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function absolute(baseUrl: string, path: string) {
  return new URL(path, baseUrl).toString();
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site || new URL(process.env.PUBLIC_SITE_URL || 'http://localhost:4321')).toString();

  const [pages, locations, specialEvents] = await Promise.all([
    db.contentPage.findMany({
      where: { status: 'PUBLISHED', indexable: true },
      select: { slug: true, updatedAt: true }
    }),
    db.location.findMany({
      where: { status: 'PUBLISHED', indexable: true },
      select: { slug: true, updatedAt: true }
    }),
    db.specialEvent.findMany({
      where: { status: 'PUBLISHED', indexable: true },
      select: { slug: true, updatedAt: true }
    })
  ]);

  const urls: Array<{ loc: string; lastmod?: string }> = [
    { loc: absolute(baseUrl, '/') },
    ...pages.map((p) => ({ loc: absolute(baseUrl, `/${p.slug}`), lastmod: p.updatedAt.toISOString() })),
    ...locations.map((l) => ({ loc: absolute(baseUrl, `/locations/${l.slug}`), lastmod: l.updatedAt.toISOString() })),
    ...specialEvents.map((e) => ({ loc: absolute(baseUrl, `/events/${e.slug}`), lastmod: e.updatedAt.toISOString() }))
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((entry) => {
      const lastmodNode = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmodNode}\n  </url>`;
    })
    .join('\n')}\n</urlset>\n`;

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
};
