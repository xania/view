import { resolve } from "node:path";
import { run } from "../run";
import { Action } from "./action";
import { ActionContext } from "./action-context";

export function npmInstall(workingDir: string, ...packages: string[]): Action {
  return (context: ActionContext) => {
    run("npm install " + packages.join(" "), {
      cwd: resolve(context.cwd, workingDir),
    });
  };
}

export function npmUninstall(
  workingDir: string,
  ...packages: string[]
): Action {
  return (context: ActionContext) => {
    run("npm uninstall " + packages.join(" "), {
      cwd: resolve(context.cwd, workingDir),
    });
  };
}
