import fs from 'node:fs';
import path from 'node:path';
import { Prisma, PrismaClient, PublishStatus } from '@prisma/client';

const prisma = new PrismaClient();
const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'content', 'pages');

type JsonObject = Record<string, unknown>;

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as JsonObject;
}

function toIso(date: string, time: string): Date | null {
  if (!date) return null;
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? time : '18:00';
  const raw = `${date}T${normalizedTime}:00`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function upsertContentPage(slug: string, data: JsonObject) {
  const title = String((data.site as JsonObject | undefined)?.title || (data.title as string) || slug);
  const seoTitle = title;
  const metaDescription = String((data.hero as JsonObject | undefined)?.subtitle || (data.subtitle as string) || '').slice(0, 300) || null;

  const jsonContent = data as Prisma.InputJsonValue;
  return prisma.contentPage.upsert({
    where: { slug },
    update: {
      title,
      seoTitle,
      metaDescription,
      content: jsonContent,
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date()
    },
    create: {
      title,
      slug,
      seoTitle,
      metaDescription,
      content: jsonContent,
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date()
    }
  });
}

async function upsertLocation(slug: string, pageId: string, data: JsonObject) {
  const title = String((data.site as JsonObject | undefined)?.title || slug);
  const city = slug === 'koblenz' ? 'Koblenz' : slug.charAt(0).toUpperCase() + slug.slice(1);
  const description = String((data.hero as JsonObject | undefined)?.subtitle || '');
  const openingHoursRaw = (data.pricing as JsonObject | undefined)?.weekSchedule;
  const openingHours = openingHoursRaw ? (openingHoursRaw as Prisma.InputJsonValue) : undefined;

  return prisma.location.upsert({
    where: { slug },
    update: {
      name: title,
      city,
      country: 'DE',
      description,
      openingHours,
      status: PublishStatus.PUBLISHED,
      pageId
    },
    create: {
      slug,
      name: title,
      city,
      country: 'DE',
      description,
      openingHours,
      status: PublishStatus.PUBLISHED,
      pageId
    }
  });
}

async function importEventsForLocation(locationId: string, data: JsonObject) {
  const eventCenter = (data.eventCenter as JsonObject | undefined) ?? {};
  const weekly = Array.isArray(eventCenter.weeklyEvents) ? (eventCenter.weeklyEvents as JsonObject[]) : [];
  const special = Array.isArray(eventCenter.specialEvents) ? (eventCenter.specialEvents as JsonObject[]) : [];

  for (let i = 0; i < weekly.length; i += 1) {
    const item = weekly[i];
    const title = String(item.title || `Wochenevent ${i + 1}`);
    const day = String(item.day || 'fri');
    const slug = `weekly-${day}-${slugify(title)}`;

    const weeklyEvent = await prisma.weeklyEvent.upsert({
      where: { slug },
      update: {
        title,
        descriptionShort: String(item.subtitle || ''),
        weekdays: [day],
        startTime: String(item.startTime || '18:00'),
        endTime: String(item.endTime || '22:00'),
        image: String(item.image || ''),
        ctaLabel: String(item.ctaLabel || 'Jetzt reservieren'),
        ctaUrl: String(item.ctaHref || '/locations/koblenz/reservieren'),
        sortOrder: i + 1,
        status: PublishStatus.PUBLISHED
      },
      create: {
        title,
        slug,
        descriptionShort: String(item.subtitle || ''),
        weekdays: [day],
        startTime: String(item.startTime || '18:00'),
        endTime: String(item.endTime || '22:00'),
        image: String(item.image || ''),
        ctaLabel: String(item.ctaLabel || 'Jetzt reservieren'),
        ctaUrl: String(item.ctaHref || '/locations/koblenz/reservieren'),
        sortOrder: i + 1,
        status: PublishStatus.PUBLISHED
      }
    });

    await prisma.weeklyEventLocation.upsert({
      where: { weeklyEventId_locationId: { weeklyEventId: weeklyEvent.id, locationId } },
      update: {},
      create: { weeklyEventId: weeklyEvent.id, locationId }
    });
  }

  for (let i = 0; i < special.length; i += 1) {
    const item = special[i];
    const title = String(item.title || `Sonderevent ${i + 1}`);
    const date = String(item.date || '');
    const startTime = String(item.startTime || '18:00');
    const endTime = String(item.endTime || '22:00');
    const startDateTime = toIso(date, startTime);
    const endDateTime = toIso(date, endTime);
    if (!startDateTime) continue;

    const slug = `special-${startDateTime.toISOString().slice(0, 10)}-${slugify(title)}`;
    const specialEvent = await prisma.specialEvent.upsert({
      where: { slug },
      update: {
        title,
        startDateTime,
        endDateTime,
        description: String(item.subtitle || ''),
        image: String(item.image || ''),
        ctaLabel: String(item.ctaLabel || 'Jetzt reservieren'),
        ctaUrl: String(item.ctaHref || '/locations/koblenz/reservieren'),
        status: PublishStatus.PUBLISHED,
        highlight: Boolean(item.highlight),
        priority: Boolean(item.highlight) ? 100 : 0
      },
      create: {
        title,
        slug,
        startDateTime,
        endDateTime,
        description: String(item.subtitle || ''),
        image: String(item.image || ''),
        ctaLabel: String(item.ctaLabel || 'Jetzt reservieren'),
        ctaUrl: String(item.ctaHref || '/locations/koblenz/reservieren'),
        status: PublishStatus.PUBLISHED,
        highlight: Boolean(item.highlight),
        priority: Boolean(item.highlight) ? 100 : 0
      }
    });

    await prisma.specialEventLocation.upsert({
      where: { specialEventId_locationId: { specialEventId: specialEvent.id, locationId } },
      update: {},
      create: { specialEventId: specialEvent.id, locationId }
    });
  }
}

async function main() {
  const files = fs.readdirSync(PAGES_DIR).filter((name) => name.endsWith('.json')).sort();

  for (const file of files) {
    const slug = file.replace(/\.json$/, '');
    const data = readJson(path.join(PAGES_DIR, file));
    const page = await upsertContentPage(slug, data);

    if (slug !== 'brand') {
      const location = await upsertLocation(slug, page.id, data);
      await importEventsForLocation(location.id, data);
    }

    console.log(`Imported ${slug}`);
  }

  console.log('Legacy import complete');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
