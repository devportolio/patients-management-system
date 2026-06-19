import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import base from './base.mjs';

/**
 * ESLint flat config for the Next.js web app.
 *
 * Intentionally built on the shared `typescript-eslint` base + react-hooks
 * rather than `eslint-config-next`: the latter bundles its own (skewed)
 * @typescript-eslint plugin version which conflicts with the workspace parser.
 * Next.js's own `next build` already enforces its framework rules and types.
 */
export default [
  ...base,
  {
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    // The .next build output should never be linted.
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];
