// vite.config.ts
import { defineConfig } from 'vite';

import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '~',
        replacement: path.resolve(__dirname, './lib'),
      },
    ],
  },
  build: {
    minify: true,
    reportCompressedSize: true,
    lib: {
      entry: path.resolve(__dirname, 'lib/index.ts'),
      fileName: 'main',
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
  },
});
