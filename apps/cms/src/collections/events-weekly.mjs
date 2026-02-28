export const EventsWeekly = {
  slug: 'events-weekly',
  admin: {
    group: 'Events',
    useAsTitle: 'title'
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'descriptionShort', type: 'textarea' },
    { name: 'descriptionLong', type: 'textarea' },
    {
      name: 'weekdays',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Mittwoch', value: 'wed' },
        { label: 'Donnerstag', value: 'thu' },
        { label: 'Freitag', value: 'fri' },
        { label: 'Samstag', value: 'sat' },
        { label: 'Sonntag', value: 'sun' }
      ]
    },
    { name: 'startTime', type: 'text' },
    { name: 'endTime', type: 'text' },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaLink', type: 'text' },
    { name: 'sortOrder', type: 'number', defaultValue: 100 },
    { name: 'locations', type: 'relationship', relationTo: 'locations', hasMany: true },
    { name: 'status', type: 'select', options: ['draft', 'published', 'archived'], defaultValue: 'draft' }
  ]
};
