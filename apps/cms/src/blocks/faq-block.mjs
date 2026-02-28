export const FAQBlock = {
  slug: 'faq',
  labels: { singular: 'FAQ', plural: 'FAQ Sections' },
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true }
      ]
    }
  ]
};
