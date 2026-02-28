export const Deals = {
  slug: 'deals',
  admin: {
    group: 'Marketing',
    useAsTitle: 'title'
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'label', type: 'text' },
    { name: 'shortText', type: 'textarea' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaUrl', type: 'text' },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    { name: 'startAt', type: 'date' },
    { name: 'endAt', type: 'date' },
    { name: 'priority', type: 'number', defaultValue: 0 },
    {
      name: 'placement',
      type: 'group',
      fields: [
        { name: 'globalHeader', type: 'checkbox', defaultValue: false },
        { name: 'globalBurger', type: 'checkbox', defaultValue: false },
        { name: 'pages', type: 'relationship', relationTo: 'pages', hasMany: true },
        { name: 'locations', type: 'relationship', relationTo: 'locations', hasMany: true }
      ]
    },
    { name: 'deviceTargeting', type: 'json' },
    { name: 'status', type: 'select', options: ['draft', 'published', 'archived'], defaultValue: 'draft' }
  ]
};
