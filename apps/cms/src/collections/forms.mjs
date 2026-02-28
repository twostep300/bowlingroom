export const Forms = {
  slug: 'forms',
  admin: {
    group: 'Formulare',
    useAsTitle: 'name'
  },
  versions: { drafts: true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'status', type: 'select', options: ['draft', 'published', 'archived'], defaultValue: 'draft' },
    {
      name: 'fields',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: ['text', 'textarea', 'email', 'phone', 'number', 'dropdown', 'checkbox', 'radio', 'date', 'time', 'hidden', 'consent']
        },
        { name: 'required', type: 'checkbox', defaultValue: false },
        { name: 'options', type: 'json' },
        { name: 'validation', type: 'json' }
      ]
    },
    { name: 'targetPages', type: 'relationship', relationTo: 'pages', hasMany: true },
    { name: 'recipientEmail', type: 'email' },
    { name: 'webhookUrl', type: 'text' },
    { name: 'zendeskMode', type: 'select', options: ['none', 'email', 'webhook'], defaultValue: 'none' },
    { name: 'prevoEnabled', type: 'checkbox', defaultValue: false },
    { name: 'prevoTag', type: 'text' }
  ]
};
