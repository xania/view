import { defineConfig, Plugin } from "vite";
import { resumable } from "../vite-plugin-resumable/lib/index";
import path from "node:path";

import { ViteDevServer, PluginOption } from "vite";
import { dirname, basename, join, resolve } from "path";
import { readdir, access, writeFile } from "fs/promises";
import { Dirent } from "fs";

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
      "@xania/view": path.resolve(__dirname, "../view/lib/index.ts"),
      "@xania/jsx/jsx-runtime": path.resolve(
        __dirname,
        "../jsx/jsx-runtime.ts"
      ),
      "@xania/jsx": path.resolve(__dirname, "../jsx/lib/index.ts"),
      "@xania/state": path.resolve(__dirname, "../state/index.ts"),
      "@xania/router": path.resolve(__dirname, "../router/index.ts"),
    },
  },
});
