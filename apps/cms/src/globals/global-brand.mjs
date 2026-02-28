export const GlobalBrand = {
  slug: 'settings-brand',
  label: 'Global Header/Footer/Brand',
  admin: {
    group: 'Einstellungen'
  },
  fields: [
    {
      name: 'header',
      type: 'group',
      fields: [
        { name: 'menuItems', type: 'json' },
        { name: 'ctaLabel', type: 'text' },
        { name: 'ctaUrl', type: 'text' }
      ]
    },
    {
      name: 'footer',
      type: 'group',
      fields: [
        { name: 'logoText', type: 'text' },
        { name: 'text', type: 'textarea' },
        { name: 'links', type: 'json' }
      ]
    },
    {
      name: 'brand',
      type: 'group',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'locations', type: 'json' }
      ]
    }
  ]
};
