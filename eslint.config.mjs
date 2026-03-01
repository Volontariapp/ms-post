// @ts-check
import baseConfig from '@volontariapp/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.mjs'],
  },
);
