import { defineConfig } from "vite";
import { resumable } from "../vite-plugin-resumable/lib/index";
import path from "node:path";

export default defineConfig({
  server: {
    port: 1981,
    host: "0.0.0.0",
  },
  plugins: [resumable()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname),
      "@xania/view/jsx-runtime": path.resolve(
        __dirname,
        "../view/jsx-runtime.ts"
      ),
      "@xania/view/jsx-dev-runtime": path.resolve(
        __dirname,
        "../view/jsx-dev-runtime.ts"
      ),
      "@xania/view/headless": path.resolve(
        __dirname,
        "../view/lib/headless/index.ts"
      ),
      "@xania/view/reactivity": path.resolve(
        __dirname,
        "../view/lib/reactivity/index.ts"
      ),
      "@xania/view": path.resolve(__dirname, "../view/index.ts"),
      "@xania/state": path.resolve(__dirname, "../state/index.ts"),
      "@xania/router": path.resolve(__dirname, "../router/index.ts"),
      "@xania/grid": path.resolve(__dirname, "../grid/index.ts"),
    },
  },
});
