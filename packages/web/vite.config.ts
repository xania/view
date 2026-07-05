import { defineConfig } from 'vitest/config';

import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    testTimeout: 3000 * 1000,
  },
  build: {
    reportCompressedSize: true,
    lib: {
      entry: path.resolve(dirname, 'lib/index.ts'),
      fileName: 'main',
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
  },
  resolve: {
    alias: [
      {
        find: '@xania/reactivity/program',
        replacement: path.resolve(dirname, '../reactivity/lib/program.ts'),
      },
      {
        find: '@xania/reactivity',
        replacement: path.resolve(dirname, '../reactivity/lib/index.ts'),
      },
    ],
  },
});
