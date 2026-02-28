export const Locations = {
  slug: 'locations',
  admin: {
    group: 'Seiten',
    useAsTitle: 'name'
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'address', type: 'textarea' },
    { name: 'city', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'geo', type: 'json' },
    { name: 'openingHours', type: 'json' },
    { name: 'description', type: 'textarea' },
    { name: 'images', type: 'relationship', relationTo: 'media', hasMany: true },
    { name: 'seo', type: 'json' }
  ]
};
