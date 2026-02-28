export const DealSlotBlock = {
  slug: 'dealSlot',
  labels: { singular: 'Deal Slot', plural: 'Deal Slots' },
  fields: [
    {
      name: 'mode',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Auto pick best active deal', value: 'auto' },
        { label: 'Manual Deal', value: 'manual' }
      ],
      required: true
    },
    {
      name: 'deal',
      type: 'relationship',
      relationTo: 'deals',
      admin: {
        condition: (_, siblingData) => siblingData?.mode === 'manual'
      }
    },
    {
      name: 'showOn',
      type: 'select',
      options: [
        { label: 'Header', value: 'header' },
        { label: 'Burger Menu', value: 'burger' },
        { label: 'Section', value: 'section' }
      ],
      defaultValue: 'section'
    }
  ]
};
