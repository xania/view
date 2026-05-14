// vite.config.ts
import { defineConfig } from 'vite';

import path from 'path';

export default defineConfig({
  test: {
    testTimeout: 3000 * 1000,
  },
  resolve: {
    alias: [
      {
        find: '~',
        replacement: path.resolve(__dirname, './lib'),
      },
    ],
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
});
