import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const pagesDir = path.resolve(projectRoot, 'content', 'pages');

function inferPageType(slug) {
  if (slug === 'brand') return 'brand';
  if (['koblenz', 'trier', 'hagen', 'oberrad', 'overath'].includes(slug)) return 'location';
  return 'default';
}

function toLegacySectionBlocks(content) {
  const sections = Array.isArray(content?.layout?.sections) ? content.layout.sections : [];
  if (sections.length === 0) return [];
  return sections
    .filter((s) => s && typeof s === 'object')
    .map((section, index) => ({
      blockType: 'legacySection',
      source: String(section.source || section.id || 'about'),
      sectionId: String(section.id || section.source || `section-${index + 1}`),
      visible: !(section.visible === false || section.visible === 'false' || section.visible === 0 || section.visible === '0'),
      titleOverride: '',
      textOverride: '',
      imageOverride: '',
      ctaLabelOverride: '',
      ctaHrefOverride: ''
    }));
}

async function main() {
  const configModule = await import('../payload.config.js');
  const payload = await getPayload({ config: configModule.default });
  const files = fs.readdirSync(pagesDir).filter((name) => name.endsWith('.json'));

  for (const file of files) {
    const slug = file.replace(/\.json$/, '');
    const raw = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
    const content = JSON.parse(raw);
    const title = String(content?.site?.title || content?.title || slug);
    const layoutBlocks = toLegacySectionBlocks(content);

    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0
    });

    const data = {
      title,
      slug,
      pageType: inferPageType(slug),
      legacyContent: content,
      layout: layoutBlocks
    };

    if (existing?.docs?.[0]?.id) {
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data,
        draft: true
      });
      console.log(`[pages] updated ${slug}`);
    } else {
      await payload.create({
        collection: 'pages',
        data,
        draft: true
      });
      console.log(`[pages] created ${slug}`);
    }
  }

  console.log('Legacy page import finished.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

