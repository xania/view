import { defineConfig } from "vite";
import { resumable } from "vite-plugin-resumable";

export default defineConfig({
  server: {
    port: 1981,
    host: "0.0.0.0",
  },
  plugins: [resumable()],
});
