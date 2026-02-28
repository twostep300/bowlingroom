export const GlobalTracking = {
  slug: 'settings-tracking',
  label: 'Tracking IDs',
  admin: {
    group: 'Einstellungen'
  },
  fields: [
    { name: 'ga4MeasurementId', type: 'text' },
    { name: 'metaPixelId', type: 'text' },
    { name: 'otherScripts', type: 'json' }
  ]
};
