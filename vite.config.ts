import { defineConfig } from "vite";
import path from "node:path";

// Configure Vitest (https://vitest.dev/config/)

export default defineConfig({
  server: {
    port: 1981,
    host: "0.0.0.0",
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname),

      "@xania/view/jsx-runtime": path.resolve(
        __dirname,
        "./packages/view/jsx-runtime.ts"
      ),
      "@xania/view/jsx-dev-runtime": path.resolve(
        __dirname,
        "./packages/view/jsx-dev-runtime.ts"
      ),
      "@xania/view/headless": path.resolve(
        __dirname,
        "./packages/view/lib/headless/index.ts"
      ),
      "@xania/view/reactivity": path.resolve(
        __dirname,
        "./packages/view/lib/reactivity/index.ts"
      ),

      "@xania/view": path.resolve(__dirname, "./packages/view"),
    },
  },
});
