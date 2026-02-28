import js from '@eslint/js';
import astro from 'eslint-plugin-astro';

export default [
  js.configs.recommended,
  ...astro.configs['flat/recommended'],
  {
    ignores: ['dist/**', 'node_modules/**', '.astro/**']
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly'
      }
    }
  },
  {
    rules: {
      'no-console': 'off'
    }
  }
];
