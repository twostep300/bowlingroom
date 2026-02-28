export const GlobalSEO = {
  slug: 'settings-seo',
  label: 'SEO Basics',
  admin: {
    group: 'Einstellungen'
  },
  fields: [
    { name: 'defaultMetaTitle', type: 'text' },
    { name: 'defaultMetaDescription', type: 'textarea' },
    { name: 'robots', type: 'textarea' },
    { name: 'sitemapEnabled', type: 'checkbox', defaultValue: true }
  ]
};
