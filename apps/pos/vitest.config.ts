import angular from '@analogjs/vite-plugin-angular';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const configDir = dirname(fileURLToPath(import.meta.url));
const tsconfigPath = resolve(configDir, 'tsconfig.spec.json');

export default defineConfig({
  plugins: [
    angular({ tsconfig: tsconfigPath }),
    tsconfigPaths({ root: resolve(configDir, '../../') }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
      if (type === 'stderr') return false;
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/*.config.ts', '**/test-setup.ts', '**/main.ts', '**/*.d.ts'],
      all: true,
    },
  },
});
