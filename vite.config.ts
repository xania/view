import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  server: {
    port: 1981,
    host: "0.0.0.0",
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname),
      "@xania/view": path.resolve(__dirname, "./packages/view"),
    },
  },
});
