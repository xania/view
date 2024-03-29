﻿import { Action } from "./action";
import { ActionContext } from "./action-context";
import { resolve } from "path";
import fs from "fs";
import rif from "replace-in-file";
import degit from "../degit";

export function subgit(
  source: string,
  dest: string,
  mappings: Record<string, string> = {}
): Action {
  return async (context: ActionContext) => {
    const targetDir = resolve(context.cwd, dest);
    if (fs.existsSync(targetDir)) {
      console.log("skip " + targetDir);
      return;
    }

    const emitter = degit(source, {
      cache: false,
      force: true,
      verbose: true,
    });

    await emitter.clone(targetDir);

    const keys = Object.keys(mappings).filter((k) => mappings[k]);
    const from = keys.map((k) => new RegExp(`{{\\s*${k}\\s*}}`, "g"));
    const to = keys.map((k) => mappings[k]);

    await rif.replaceInFile({
      files: targetDir + "/**/*",
      from,
      to,
    });

    function log(results: any[]) {
      console.log(results.filter((e) => e.hasChanged));
    }
  };
}
