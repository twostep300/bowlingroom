export const Leads = {
  slug: 'leads',
  admin: {
    group: 'Formulare',
    useAsTitle: 'email',
    defaultColumns: ['createdAt', 'status', 'formSlug', 'email']
  },
  access: {
    create: () => true
  },
  fields: [
    { name: 'formSlug', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'name', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'payload', type: 'json' },
    { name: 'utm', type: 'json' },
    { name: 'consent', type: 'json' },
    { name: 'status', type: 'select', options: ['new', 'open', 'done'], defaultValue: 'new' },
    { name: 'integrationLog', type: 'json' }
  ]
};
