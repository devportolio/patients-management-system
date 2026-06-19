import base from './base.mjs';
import globals from 'globals';

/**
 * ESLint flat config for the NestJS API.
 */
export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'module',
    },
    rules: {
      // Decorator-heavy Nest code legitimately uses interface-style empty methods.
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
    },
  },
];
