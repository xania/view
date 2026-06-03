import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    sourcemap: true,
  },
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
