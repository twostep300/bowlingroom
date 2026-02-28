module.exports = {
  root: true,
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  extends: ['eslint:recommended', 'plugin:astro/recommended'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['eslint:recommended']
    }
  ]
};
