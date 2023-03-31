import { resolve } from "node:path";
import { Action } from "./action";
import { ActionContext } from "./action-context";
import fs from "node:fs";

export function file(filePath: string, content: string): Action {
  return (context: ActionContext) => {
    const targetFile = resolve(context.cwd, filePath);

    console.log("Writing file: ", targetFile, content);
    fs.writeFile(targetFile, content, function (err) {
      if (err) throw err;
    });
    // console.log("tsconfig ", schema);
  };
}
