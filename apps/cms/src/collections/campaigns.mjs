export const Campaigns = {
  slug: 'campaigns',
  admin: {
    group: 'Marketing',
    useAsTitle: 'headline'
  },
  versions: { drafts: true },
  fields: [
    { name: 'type', type: 'select', options: ['popup', 'floating_bar'], required: true },
    { name: 'headline', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaUrl', type: 'text' },
    {
      name: 'targeting',
      type: 'group',
      fields: [
        { name: 'includePages', type: 'relationship', relationTo: 'pages', hasMany: true },
        { name: 'excludePages', type: 'relationship', relationTo: 'pages', hasMany: true },
        { name: 'locations', type: 'relationship', relationTo: 'locations', hasMany: true },
        { name: 'device', type: 'select', options: ['all', 'desktop', 'mobile'], defaultValue: 'all' }
      ]
    },
    {
      name: 'timing',
      type: 'group',
      fields: [
        { name: 'startAt', type: 'date' },
        { name: 'endAt', type: 'date' },
        { name: 'trigger', type: 'select', options: ['delay', 'scroll', 'exit_intent'], defaultValue: 'delay' },
        { name: 'triggerValue', type: 'number', defaultValue: 5 },
        { name: 'frequency', type: 'json' }
      ]
    },
    { name: 'status', type: 'select', options: ['draft', 'published', 'archived'], defaultValue: 'draft' }
  ]
};
