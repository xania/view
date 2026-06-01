import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      '@xania/reactivity': path.resolve(__dirname, '../reactivity/lib'),
    },
  },
});
