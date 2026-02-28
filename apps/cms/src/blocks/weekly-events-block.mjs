export const WeeklyEventsBlock = {
  slug: 'weeklyEvents',
  labels: { singular: 'Weekly Events', plural: 'Weekly Events Sections' },
  fields: [
    { name: 'titleOverride', type: 'text' },
    { name: 'locationSlug', type: 'text' },
    {
      name: 'highlightToday',
      type: 'checkbox',
      defaultValue: true
    }
  ]
};
