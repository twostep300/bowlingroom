import fs from 'node:fs';
import path from 'node:path';
import { db } from '../src/lib/db';

type JsonObject = Record<string, unknown>;

const payloadBase = (process.env.PAYLOAD_CMS_URL || 'http://127.0.0.1:4000').replace(/\/+$/, '');
const payloadToken = process.env.PAYLOAD_API_TOKEN || '';

if (!payloadToken) {
  console.error('Missing PAYLOAD_API_TOKEN');
  process.exit(1);
}

function headers(): HeadersInit {
  return {
    authorization: `Bearer ${payloadToken}`,
    'content-type': 'application/json'
  };
}

async function payloadGet(pathname: string) {
  const res = await fetch(`${payloadBase}${pathname}`, { headers: { authorization: `Bearer ${payloadToken}` } });
  if (!res.ok) throw new Error(`GET ${pathname} failed: ${res.status}`);
  return res.json();
}

async function payloadPost(pathname: string, body: unknown) {
  const res = await fetch(`${payloadBase}${pathname}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${pathname} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function payloadPatch(pathname: string, body: unknown) {
  const res = await fetch(`${payloadBase}${pathname}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${pathname} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function upsertBySlug(collection: string, slug: string, doc: JsonObject) {
  const q = `/api/${collection}?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`;
  const existing = await payloadGet(q).catch(() => ({ docs: [] }));
  const docs = Array.isArray(existing?.docs) ? existing.docs : [];
  if (docs.length > 0 && docs[0]?.id) {
    return payloadPatch(`/api/${collection}/${docs[0].id}`, doc);
  }
  return payloadPost(`/api/${collection}`, doc);
}

async function upsertGlobal(slug: string, doc: JsonObject) {
  return payloadPost(`/api/globals/${slug}`, doc).catch(async () => {
    return payloadPatch(`/api/globals/${slug}`, doc);
  });
}

function inferPageType(slug: string): string {
  if (slug === 'brand') return 'brand';
  if (['koblenz', 'trier', 'hagen', 'oberrad'].includes(slug)) return 'location';
  return 'default';
}

async function importPages() {
  const pagesDir = path.resolve(process.cwd(), 'content/pages');
  const files = fs.readdirSync(pagesDir).filter((n) => n.endsWith('.json'));
  for (const file of files) {
    const slug = file.replace(/\.json$/, '');
    const raw = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
    const json = JSON.parse(raw) as JsonObject;
    const title = String((json.site as JsonObject | undefined)?.title || (json.title as string) || slug);
    await upsertBySlug('pages', slug, {
      title,
      slug,
      pageType: inferPageType(slug),
      legacyContent: json
    });
    console.log(`[pages] upserted ${slug}`);
  }
}

async function importLocations() {
  const rows = await db.location.findMany();
  for (const row of rows) {
    await upsertBySlug('locations', row.slug, {
      name: row.name,
      slug: row.slug,
      address: [row.addressLine1, row.addressLine2].filter(Boolean).join('\n'),
      city: row.city || '',
      phone: row.phone || '',
      email: row.email || '',
      geo: {
        latitude: row.latitude,
        longitude: row.longitude
      },
      openingHours: row.openingHours || null,
      description: row.description || '',
      seo: {
        seoTitle: row.seoTitle,
        metaDescription: row.metaDescription,
        canonicalUrl: row.canonicalUrl
      }
    });
    console.log(`[locations] upserted ${row.slug}`);
  }
}

async function importWeeklyEvents() {
  const rows = await db.weeklyEvent.findMany({ include: { locations: { include: { location: true } } } });
  for (const row of rows) {
    await upsertBySlug('events-weekly', row.slug, {
      title: row.title,
      slug: row.slug,
      descriptionShort: row.descriptionShort || '',
      descriptionLong: row.descriptionLong || '',
      weekdays: row.weekdays as unknown[],
      startTime: row.startTime || '',
      endTime: row.endTime || '',
      ctaLabel: row.ctaLabel || '',
      ctaLink: row.ctaUrl || '',
      sortOrder: row.sortOrder,
      locations: row.locations.map((x) => x.location.slug),
      status: String(row.status || 'DRAFT').toLowerCase()
    });
    console.log(`[events-weekly] upserted ${row.slug}`);
  }
}

async function importSpecialEvents() {
  const rows = await db.specialEvent.findMany({ include: { locations: { include: { location: true } } } });
  for (const row of rows) {
    await upsertBySlug('events-upcoming', row.slug, {
      title: row.title,
      slug: row.slug,
      startDateTime: row.startDateTime.toISOString(),
      endDateTime: row.endDateTime ? row.endDateTime.toISOString() : null,
      description: row.description || '',
      ctaLabel: row.ctaLabel || '',
      ctaLink: row.ctaUrl || '',
      highlight: row.highlight,
      priority: row.priority,
      locations: row.locations.map((x) => x.location.slug),
      status: String(row.status || 'DRAFT').toLowerCase(),
      seo: row.jsonLd || null
    });
    console.log(`[events-upcoming] upserted ${row.slug}`);
  }
}

async function importDeals() {
  const rows = await db.deal.findMany();
  for (const row of rows) {
    const slug = `${row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${row.id.slice(0, 6)}`;
    await upsertBySlug('deals', slug, {
      title: row.title,
      label: row.label || '',
      shortText: row.shortText || '',
      ctaLabel: row.ctaLabel || '',
      ctaUrl: row.ctaUrl || '',
      startAt: row.startAt ? row.startAt.toISOString() : null,
      endAt: row.endAt ? row.endAt.toISOString() : null,
      priority: row.priority,
      placement: row.showOn || {},
      deviceTargeting: row.deviceTargeting || {},
      status: String(row.status || 'DRAFT').toLowerCase()
    });
    console.log(`[deals] upserted ${slug}`);
  }
}

async function importCampaigns() {
  const rows = await db.campaign.findMany();
  for (const row of rows) {
    const slug = `${row.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${row.id.slice(0, 6)}`;
    await upsertBySlug('campaigns', slug, {
      headline: row.headline,
      title: row.headline,
      slug,
      type: String(row.type || 'POPUP').toLowerCase(),
      text: row.text || '',
      ctaLabel: row.ctaLabel || '',
      ctaUrl: row.ctaUrl || '',
      targeting: {
        includePages: row.pageTargeting || [],
        device: row.deviceTargeting || {}
      },
      timing: {
        trigger: String(row.trigger || 'DELAY').toLowerCase(),
        triggerValue: row.triggerValue || 5,
        frequency: row.frequencyJson || {}
      },
      status: String(row.status || 'DRAFT').toLowerCase()
    });
    console.log(`[campaigns] upserted ${slug}`);
  }
}

async function importForms() {
  const rows = await db.form.findMany({ include: { fields: { orderBy: { sortOrder: 'asc' } } } });
  for (const row of rows) {
    await upsertBySlug('forms', row.slug, {
      name: row.name,
      slug: row.slug,
      status: String(row.status || 'DRAFT').toLowerCase(),
      fields: row.fields.map((f) => ({
        name: f.name,
        label: f.label,
        type: String(f.type).toLowerCase(),
        required: f.required,
        options: f.options || null,
        validation: {
          regexPattern: f.regexPattern,
          minValue: f.minValue,
          maxValue: f.maxValue,
          conditional: f.conditionalJson || null
        }
      })),
      targetPages: row.targetPageSlugs || null,
      recipientEmail: row.recipientEmail || '',
      webhookUrl: row.webhookUrl || '',
      zendeskMode: row.zendeskMode || 'none',
      prevoEnabled: row.prevoEnabled,
      prevoTag: row.prevoListTag || ''
    });
    console.log(`[forms] upserted ${row.slug}`);
  }
}

async function importGlobals() {
  const brandRaw = fs.readFileSync(path.resolve(process.cwd(), 'content/pages/brand.json'), 'utf-8');
  const brand = JSON.parse(brandRaw) as JsonObject;

  const settings = await db.siteSetting.findMany();
  const map = new Map(settings.map((s) => [s.key, s.value]));

  await upsertGlobal('settings-brand', {
    header: {
      menuItems: (brand.links as unknown[]) || [],
      ctaLabel: '',
      ctaUrl: ''
    },
    footer: {
      logoText: '',
      text: '',
      links: {}
    },
    brand: {
      name: brand.logoText || 'Bowlingroom',
      locations: brand.links || []
    }
  });

  await upsertGlobal('settings-tracking', {
    ga4MeasurementId: map.get('tracking.ga4MeasurementId') || '',
    metaPixelId: map.get('tracking.metaPixelId') || '',
    otherScripts: {}
  });

  await upsertGlobal('settings-seo', {
    defaultMetaTitle: '',
    defaultMetaDescription: '',
    robots: '',
    sitemapEnabled: true
  });

  await upsertGlobal('settings-integrations', {
    zendesk: {
      inboundEmail: process.env.ZENDESK_INBOUND_EMAIL || '',
      webhookUrl: process.env.ZENDESK_WEBHOOK_URL || ''
    },
    prevo: {
      apiUrl: process.env.PREVO_API_URL || '',
      apiKey: process.env.PREVO_API_KEY || ''
    }
  });

  console.log('[globals] upserted');
}

async function main() {
  console.log('Starting custom -> payload import...');
  await importPages();
  await importLocations();
  await importWeeklyEvents();
  await importSpecialEvents();
  await importDeals();
  await importCampaigns();
  await importForms();
  await importGlobals();
  console.log('Import complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
