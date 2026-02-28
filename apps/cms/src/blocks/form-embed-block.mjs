export const FormEmbedBlock = {
  slug: 'formEmbed',
  labels: { singular: 'Form Embed', plural: 'Form Embeds' },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true
    },
    { name: 'titleOverride', type: 'text' },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Compact', value: 'compact' },
        { label: 'Wide', value: 'wide' }
      ]
    }
  ]
};
