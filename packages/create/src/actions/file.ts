import { resolve } from "node:path";
import { Action } from "./action";
import { ActionContext } from "./action-context";
import fs from "node:fs";

export function file(projectPath: string, content: string): Action {
  return (context: ActionContext) => {
    const targetFile = resolve(context.cwd, projectPath);

    fs.writeFile(targetFile, content, function (err) {
      if (err) throw err;
    });
    // console.log("tsconfig ", schema);
  };
}
