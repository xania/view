import { Action } from "./action";
import { ActionContext } from "./action-context";
import degit from "degit";
import { resolve } from "path";
import fs from "fs";

export function subgit(source: string, dest: string): Action {
  return (context: ActionContext) => {
    const targetDir = resolve(context.projectDir, dest);
    if (fs.existsSync(targetDir)) {
      console.log("skip " + targetDir);
      return;
    }

    const emitter = degit(source, {
      cache: false,
      force: true,
      verbose: true,
    });

    emitter.on("info", (info) => {
      console.log(info.message);
    });

    return emitter.clone(targetDir);
  };
}
