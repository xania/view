import { run } from "../run";
import { Action } from "./action";
import { ActionContext } from "./action-context";

export function submodule(url: string, dest: string): Action {
  return (context: ActionContext) => {
    run(`git submodule add ${url} ${dest}`, { cwd: context.projectDir });
  };
}
