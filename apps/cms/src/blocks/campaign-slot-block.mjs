export const CampaignSlotBlock = {
  slug: 'campaignSlot',
  labels: { singular: 'Campaign Slot', plural: 'Campaign Slots' },
  fields: [
    {
      name: 'campaign',
      type: 'relationship',
      relationTo: 'campaigns'
    },
    {
      name: 'renderMode',
      type: 'select',
      options: [
        { label: 'Popup', value: 'popup' },
        { label: 'Floating Bar', value: 'floating_bar' }
      ],
      defaultValue: 'popup'
    }
  ]
};
