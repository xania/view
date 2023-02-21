import fs from "fs";

import { defineConfig } from "vite";
import { resumable } from "vite-plugin-resumable";

export default defineConfig({
  server: {
    port: 1981,
    host: "0.0.0.0",
  },
  plugins: [
    resumable({
      fileExists(file: string) {
        return new Promise((resolve, reject) => {
          fs.stat(file, (err, stats) => {
            if (stats) resolve(stats.isFile());
            else resolve(false);
          });
        });
      },
    }),
  ],
});
