const SECTION_OPTIONS = [
  { label: 'Top Deals Slider', value: 'slider' },
  { label: 'Das volle Programm', value: 'about' },
  { label: 'Preise & Zeiten', value: 'pricing' },
  { label: 'Gruppen & Events', value: 'groups' },
  { label: 'Standort & Kontakt', value: 'location' },
  { label: 'Events', value: 'events' },
  { label: 'Instagram', value: 'instagram' }
];

export const LegacySectionBlock = {
  slug: 'legacySection',
  labels: { singular: 'Legacy Section', plural: 'Legacy Sections' },
  fields: [
    {
      name: 'source',
      label: 'Section',
      type: 'select',
      required: true,
      defaultValue: 'about',
      options: SECTION_OPTIONS
    },
    {
      name: 'sectionId',
      label: 'Section ID (optional)',
      type: 'text'
    },
    {
      name: 'visible',
      label: 'Sichtbar',
      type: 'checkbox',
      defaultValue: true
    },
    {
      name: 'titleOverride',
      label: 'Titel Override',
      type: 'text'
    },
    {
      name: 'textOverride',
      label: 'Text Override',
      type: 'textarea'
    },
    {
      name: 'imageOverride',
      label: 'Bild URL Override',
      type: 'text'
    },
    {
      name: 'ctaLabelOverride',
      label: 'CTA Label Override',
      type: 'text'
    },
    {
      name: 'ctaHrefOverride',
      label: 'CTA Link Override',
      type: 'text'
    },
    {
      name: 'jsonPatch',
      label: 'JSON Patch (optional)',
      type: 'json',
      admin: {
        description: 'Optionales Deep-Merge Patch auf den kompletten Seiteninhalt.'
      }
    }
  ]
};

