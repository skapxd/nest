// @ts-check
import { configs as skapxdConfigs } from '@skapxd/eslint-opinionated';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'test-reports/**',
      'coverage/**',
      'eslint.config.mjs',
      'tsup.config.ts',
      'vitest.unit.config.ts',
      '**/*.spec.ts',
    ],
  },
  skapxdConfigs.package,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
