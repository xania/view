#!/usr/bin/env node

import init, { input } from "./init";
import { Action } from "./actions/action";
// import scaffold from "./scaffold";
import { npmInstall } from "./actions/npm";
import { select } from "enquirer";
import { run } from "./run";
import https from "https";

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
    const latest = await fetchJson("create-xania/latest");

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

function fetchJson(path: string) {
  return new Promise<any>((resolve, reject) => {
    const requestOptions = {
      hostname: "registry.npmjs.org",
      path: `/${path}`,
      method: "GET",
    };

    // Collect response data
    const req = https.request(requestOptions, (res) => {
      let data = "";

      // Collect response data
      res.on("data", (chunk) => {
        data += chunk;
      });

      // Process response data
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    });

    // Handle any errors
    req.on("error", reject);

    // Send the request
    req.end();
  });
}
