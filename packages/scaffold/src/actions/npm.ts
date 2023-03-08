import { run } from "../run";
import { Action } from "./action";
import { ActionContext } from "./action-context";

export function npmInstall(...packages: string[]): Action {
  return (context: ActionContext) => {
    run("npm install " + packages.join(" "), {
      cwd: context.projectDir,
    });
  };
}

export function npmUninstall(...packages: string[]): Action {
  return (context: ActionContext) => {
    run("npm uninstall " + packages.join(" "), {
      cwd: context.projectDir,
    });
  };
}
