import { Action } from "./action";
import { ActionContext } from "./action-context";
import type { UserConfig } from "vite";
import { Optional } from "./optional";
import { cwd } from "node:process";
import fs from "node:fs";
import { resolve } from "node:path";

console.log(`Current directory: ${cwd()}`);

export function vite(config: Optional<UserConfig>): Action {
  return (context: ActionContext) => {
    const viteConfig = Object.assign(
      {
        server: {
          host: "0.0.0.0",
        },
      },
      config
    );

    const targetFile = resolve(context.projectDir, "./vite.config.ts");
    console.log("writing vite config...");

    fs.writeFile(
      targetFile,
      `
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig(${JSON.stringify(viteConfig, null, "  ")});
      `,
      function (err) {
        if (err) throw err;
      }
    );

    // console.log("apply vite config ", viteConfig);
  };
}
