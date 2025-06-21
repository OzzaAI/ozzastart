module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "next/core-web-vitals",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["dist", ".eslintrc.js"],
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parserOptions: {
        project: ["./tsconfig.json", "./apps/cli/tsconfig.json", "./apps/web/tsconfig.json", "./apps/functions/tsconfig.json"],
      },
    },
  ],
  rules: {
    // We will add custom rules here later
    "@next/next/no-html-link-for-pages": "off"
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
}; 