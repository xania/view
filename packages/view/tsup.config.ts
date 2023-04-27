import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['esm', 'cjs'],
  external: ['xania'],
  entryPoints: {
    router: '../router/index.ts',
    'jsx-runtime': './jsx-runtime.ts',
    'jsx-dev-runtime': './jsx-dev-runtime.ts',
  },
  dts: true,
});
