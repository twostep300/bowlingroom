export const GalleryBlock = {
  slug: 'gallery',
  labels: { singular: 'Gallery', plural: 'Gallery Sections' },
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true
    }
  ]
};
