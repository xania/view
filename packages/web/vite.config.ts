import { defineConfig } from 'vitest/config';

import path from 'path';

export default defineConfig({
  test: {
    testTimeout: 3000 * 1000,
  },
  build: {
    reportCompressedSize: true,
    lib: {
      entry: path.resolve(__dirname, 'lib/index.ts'),
      fileName: 'main',
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@xania/reactivity': path.resolve(__dirname, '../reactivity/lib'),
    },
  },
});
