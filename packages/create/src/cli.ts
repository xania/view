#!/usr/bin/env node

import init, { input } from "./init";
import { Action } from "./actions/action";
// import scaffold from "./scaffold";
import { npmInstall } from "./actions/npm";
import { select } from "enquirer";
import { run } from "./run";

checkVersion().then((ok) => {
  if (ok)
    input().then(async (inputs) => {
      const [actions, projectPath] = await init(inputs);
      await execute(actions);
      // await scaffold(projectPath).then(execute);

      // await execute([npmInstall(projectPath)]);

      process.exit();
    });
});

async function execute(actions: Action[]) {
  const opts = {
    cwd: process.cwd(),
  };
  for (const action of actions) {
    await action(opts);
  }
}

async function checkVersion() {
  const packageName = "create-xania";

  const idx = __filename.indexOf(packageName);
  if (idx > 0) {
    const packageDir = __filename.slice(0, idx + packageName.length);

    const current = require(packageDir + "/package.json");
    const latest = await fetch(
      "https://registry.npmjs.org/create-xania/latest"
    ).then((e) => e.json());

    if (latest.version !== current.version) {
      const updateToLatest = await select({
        name: "Update to latest?",
        choices: [{ name: "Yes" }, { name: "No" }],
      });

      if (updateToLatest) {
        const rimraf = require("rimraf");
        rimraf.sync(packageDir);

        await run("npm init xania");

        return false;
      }
    }
  }
  return true;
}
