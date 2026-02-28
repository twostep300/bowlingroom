export const EventsUpcoming = {
  slug: 'events-upcoming',
  admin: {
    group: 'Events',
    useAsTitle: 'title'
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'startDateTime', type: 'date', required: true },
    { name: 'endDateTime', type: 'date' },
    { name: 'locations', type: 'relationship', relationTo: 'locations', hasMany: true },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaLink', type: 'text' },
    { name: 'highlight', type: 'checkbox', defaultValue: false },
    { name: 'priority', type: 'number', defaultValue: 0 },
    { name: 'status', type: 'select', options: ['draft', 'published', 'archived'], defaultValue: 'draft' },
    { name: 'seo', type: 'json' }
  ]
};
