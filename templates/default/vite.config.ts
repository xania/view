// vite.config.ts
import { defineConfig } from "vite";

import path from "path";

export default defineConfig({
  server: {
    port: 1981,
    host: "0.0.0.0",
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname),
    },
  },
});
