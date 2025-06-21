import tseslint from 'typescript-eslint';

export default tseslint.config({
  root: true,
  parserOptions: { project: ['./tsconfig.json'] },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
  ignorePatterns: ['**/dist/**', '**/node_modules/**', 'apps/functions/**'],
  overrides: [
    {
      files: ['apps/**', 'packages/**'],
      parserOptions: { project: ['./tsconfig.json'] },
    },
    {
      files: ['apps/functions/**'],
      languageOptions: { parserOptions: { project: null } },
    },
  ],
}); 