import type { Action } from "./actions/action";
import { npmInstall } from "./actions/npm";
import update from "./update";
import init from "./init";

if (process.argv.includes("--update")) {
  update().then(run);
} else {
  init().then(run);
}

async function run(actions: Action[]) {
  const opts = {
    projectDir: process.cwd(),
  };
  for (const action of actions) {
    await action(opts);
  }
  const install = npmInstall();
  install(opts);
}
