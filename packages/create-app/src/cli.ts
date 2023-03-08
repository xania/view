#!/usr/bin/env node

import init, { input } from "./init";
import { Action } from "./actions/action";
import scaffold from "./scaffold";
import { npmInstall } from "./actions/npm";

input().then(async (inputs) => {
  const [actions, projectPath] = await init(inputs);
  await run(actions);
  await scaffold(projectPath).then(run);

  run([npmInstall(projectPath)]);
});

async function run(actions: Action[]) {
  const opts = {
    cwd: process.cwd(),
  };
  for (const action of actions) {
    await action(opts);
  }
}
