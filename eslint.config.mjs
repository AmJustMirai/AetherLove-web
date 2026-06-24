import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },

  // Node.js scripts — run in Node, not the browser
  {
    files: ['scripts/**/*.mjs', 'verify/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],

    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      react,
      'react-hooks': reactHooks,
    },

    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
    },

    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  react.configs.flat['jsx-runtime'],
  eslintConfigPrettier,
]);
