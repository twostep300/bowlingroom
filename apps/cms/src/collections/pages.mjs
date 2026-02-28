import { HeroBlock } from '../blocks/hero-block.mjs';
import { TextBlock } from '../blocks/text-block.mjs';
import { DealSlotBlock } from '../blocks/deal-slot-block.mjs';
import { CampaignSlotBlock } from '../blocks/campaign-slot-block.mjs';
import { WeeklyEventsBlock } from '../blocks/weekly-events-block.mjs';
import { UpcomingEventsBlock } from '../blocks/upcoming-events-block.mjs';
import { FormEmbedBlock } from '../blocks/form-embed-block.mjs';
import { FAQBlock } from '../blocks/faq-block.mjs';
import { GalleryBlock } from '../blocks/gallery-block.mjs';
import { LegacySectionBlock } from '../blocks/legacy-section-block.mjs';

export const Pages = {
  slug: 'pages',
  admin: {
    group: 'Seiten',
    useAsTitle: 'title',
    livePreview: {
      url: ({ data }) => {
        const slug = data?.slug;
        if (!slug || typeof slug !== 'string') return null;
        const base = process.env.FRONTEND_URL || 'http://127.0.0.1:3000';
        return `${base.replace(/\/+$/, '')}/preview?page=${encodeURIComponent(slug)}`;
      }
    },
    preview: (doc) => {
      const slug = doc?.slug;
      if (!slug || typeof slug !== 'string') return null;
      const base = process.env.FRONTEND_URL || 'http://127.0.0.1:3000';
      return `${base.replace(/\/+$/, '')}/preview?page=${encodeURIComponent(slug)}`;
    }
  },
  versions: {
    drafts: true
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'pageType', type: 'select', options: ['brand', 'location', 'landing', 'default'], defaultValue: 'default' },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        LegacySectionBlock,
        HeroBlock,
        TextBlock,
        DealSlotBlock,
        CampaignSlotBlock,
        WeeklyEventsBlock,
        UpcomingEventsBlock,
        FormEmbedBlock,
        FAQBlock,
        GalleryBlock
      ]
    },
    {
      name: 'legacyContent',
      type: 'json',
      admin: {
        description: 'Transition field: stores current custom content JSON for CI-safe migration.'
      }
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'canonical', type: 'text' },
        { name: 'ogImage', type: 'relationship', relationTo: 'media' },
        { name: 'noindex', type: 'checkbox', defaultValue: false },
        { name: 'jsonLd', type: 'json' }
      ]
    }
  ]
};
