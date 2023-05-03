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
      "~": path.resolve(__dirname)
    },
  },
});
