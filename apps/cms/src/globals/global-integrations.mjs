export const GlobalIntegrations = {
  slug: 'settings-integrations',
  label: 'Integrationen',
  admin: {
    group: 'Einstellungen'
  },
  fields: [
    {
      name: 'zendesk',
      type: 'group',
      fields: [
        { name: 'inboundEmail', type: 'email' },
        { name: 'webhookUrl', type: 'text' }
      ]
    },
    {
      name: 'prevo',
      type: 'group',
      fields: [
        { name: 'apiUrl', type: 'text' },
        { name: 'apiKey', type: 'text' }
      ]
    }
  ]
};
