export const Users = {
  slug: 'users',
  auth: true,
  admin: {
    group: 'System',
    useAsTitle: 'email'
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' }
      ],
      required: true
    }
  ]
};
