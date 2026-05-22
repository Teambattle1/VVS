import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: [
      'dist',
      'node_modules',
      '.netlify',
      '.playwright-mcp',
      'files',
      'playwright-report',
      'test-results',
      'coverage',
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: '18.3' },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-empty': ['warn', { allowEmptyCatch: true }],

      // react-hooks v7 har skærpede regler — sat til warn så de er informative
      // uden at blokere CI/build. Skærp til 'error' når kodebasen er ryddet op.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',

      // ESLint 9-regel om Error.cause — informativ men ikke kritisk
      'preserve-caught-error': 'off',

      // Fast-refresh-hint, ikke korrekthedsfejl
      'react-refresh/only-export-components': 'off',

      // Optimeret til projekter med blandet brug af eslint-disable comments
      'no-unused-disable-directives': 'off',
    },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
  {
    files: ['tests/**/*.{js,jsx,ts}', '**/*.config.{js,ts}', 'playwright.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]
