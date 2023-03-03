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
    rollupOptions: {
    },
    sourcemap: true,
  },
});
console.log('hello');
// rollupOptions: {
//   // make sure to externalize deps that shouldn't be bundled
//   // into your library
//   external: ['vue'],
//   output: {
//     // Provide global variables to use in the UMD build
//     // for externalized deps
//     globals: {
//       vue: 'Vue',
//     },
//   },
