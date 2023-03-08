#!/usr/bin/env node

import init, { input } from "./init";
import { Action } from "./actions/action";
import scaffold from "./scaffold";

input().then(async (inputs) => {
  const [actions, targetPath] = await init(inputs);
  await run(actions);
  await scaffold(targetPath).then(run);
});

async function run(actions: Action[]) {
  const opts = {
    cwd: process.cwd(),
  };
  for (const action of actions) {
    await action(opts);
  }
}
