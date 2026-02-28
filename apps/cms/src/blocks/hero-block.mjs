export const HeroBlock = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Hero Sections' },
  fields: [
    { name: 'headline', type: 'text', required: true },
    { name: 'subline', type: 'textarea' },
    { name: 'backgroundImage', type: 'relationship', relationTo: 'media' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaUrl', type: 'text' }
  ]
};
