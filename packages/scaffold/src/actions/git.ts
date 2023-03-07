import { Action } from "./action";
import { ActionContext } from "./action-context";
import { resolve } from "path";
import { run } from "../run";
import { CommonOptions } from "execa";
import { mkdirSync } from "fs";

export function git(
  url: string,
  sourcePath: string,
  targetPath: string
): Action {
  return async (context: ActionContext) => {
    const subdir = resolve(context.projectDir, "./" + targetPath);
    const runOps: CommonOptions<any> = { cwd: subdir };

    mkdirSync(subdir, { recursive: true });

    const commands = [
      `git init`,
      `git remote add -f origin ${url}`,
      `git config core.sparseCheckout true`,
      `echo '${sourcePath}' >> .git/info/sparse-checkout`,
      `git pull origin main`,
    ];
    for (const cmd of commands) {
      console.log(cmd);
      await run(cmd, runOps);
    }
  };
}
