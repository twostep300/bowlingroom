export const UpcomingEventsBlock = {
  slug: 'upcomingEvents',
  labels: { singular: 'Upcoming Events', plural: 'Upcoming Events Sections' },
  fields: [
    { name: 'titleOverride', type: 'text' },
    { name: 'locationSlug', type: 'text' },
    { name: 'highlightOnly', type: 'checkbox', defaultValue: false },
    { name: 'maxItems', type: 'number', defaultValue: 6 }
  ]
};
