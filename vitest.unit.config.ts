import path from 'path';
import { defineConfig } from 'vitest/config';

const reportsDir = path.resolve(__dirname, 'test-reports');

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    reporters: ['default', 'html'],
    outputFile: path.resolve(reportsDir, 'unit/index.html'),
    alias: {
      '@skapxd/nest': path.resolve(__dirname, './src/index.ts'),
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: path.resolve(reportsDir, 'coverage'),
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/index.ts', 'dist/**/*'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
