#!/usr/bin/env node

import init, { input } from "./init";
import { Action } from "./actions/action";
// import scaffold from "./scaffold";
import { npmInstall } from "./actions/npm";
import { select } from "enquirer";
import { run } from "./run";
import { fetchJson } from "./utils/fetch-json";

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

    const latest = await fetchJson({
      hostname: "registry.npmjs.org",
      path: `/create-xania/latest`,
      method: "GET",
    });

    if (latest.version !== current.version) {
      const updateToLatest = await select({
        name: `New version is found, shall I uninstall current version so that new version will be used on next run? (${current.version} -> ${latest.version})`,
        choices: [{ name: "Yes" }, { name: "No" }],
      });

      if (updateToLatest === "Yes") {
        const rimraf = require("rimraf");
        rimraf.sync(packageDir);

        return false;
      }
    }
  }
  return true;
}
