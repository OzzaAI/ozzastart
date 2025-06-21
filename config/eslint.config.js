import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config({
  files: ['**/*.{js,mjs,cjs,ts,tsx}'],
  extends: [
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
    },
    globals: {
      ...globals.node,
    },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'warn',
  },
  ignores: ['**/dist/**', '**/node_modules/**', '.next/**'],
},
{
    // Disable type-aware linting for Deno functions
    files: ['apps/functions/**/*.ts'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
        globals: {
            ...globals.deno,
        }
    }
}); 