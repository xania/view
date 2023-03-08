#!/usr/bin/env node

import init from "./init";
import { Action } from "./actions/action";
import { npmInstall } from "./actions/npm";

init().then(run);

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
