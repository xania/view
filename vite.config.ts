import { defineConfig } from "vite";
import path from "node:path";

// Configure Vitest (https://vitest.dev/config/)

export default defineConfig({
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "./playground/**/*.*",
      "./playground-temp/**/*.*",
    ],
  },
  server: {
    port: 1981,
    host: "0.0.0.0",
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname),

      "vite-plugin-resumable": path.resolve(
        __dirname,
        "./packages/vite-plugin-resumable/lib/index.ts"
      ),

      "xania/jsx-runtime": path.resolve(
        __dirname,
        "./packages/view/jsx-runtime.ts"
      ),
      "xania/jsx-dev-runtime": path.resolve(
        __dirname,
        "./packages/view/jsx-dev-runtime.ts"
      ),
      "xania/headless": path.resolve(
        __dirname,
        "./packages/view/lib/headless/index.ts"
      ),
      "xania/reactivity": path.resolve(
        __dirname,
        "./packages/view/lib/reactivity/index.ts"
      ),

      "xania/router": path.resolve(__dirname, "./packages/view/router.ts"),
      xania: path.resolve(__dirname, "./packages/view/index.ts"),
    },
  },
});
