import enquirer, { multiselect } from "enquirer";
import { Action } from "./actions/action";
import { subgit } from "./actions/subgit";
import { npmInstall, npmUninstall } from "./actions/npm";
import { tsconfig } from "./actions/tsconfig";
import { vite } from "./actions/vite";
import { resolve } from "node:path";

const { select } = enquirer;

async function installXaniaPackage(targetPath: string, actions: Action[] = []) {
  const response = await select({
    name: "@xania",
    message: "Select how to pull @xania",
    choices: [{ name: "install from npm" }, { name: "with source code" }],
  });

  switch (response) {
    case "with source code":
      actions.push(
        npmUninstall(targetPath, "@xania/view", "@xania/state"),
        tsconfig(resolve(targetPath, "./tsconfig.xania.json"), {
          compilerOptions: {
            composite: true,
            paths: {
              "@xania/view": ["./xania/view/index.ts"],
              "@xania/state": ["./xania/state/index.ts"],
            },
          },
        }),
        vite(targetPath, {
          resolve: {
            alias: {
              "~": process.cwd(),
              "@xania/view/jsx-runtime": "~/xania/view/jsx-runtime.ts",
              "@xania/view/jsx-dev-runtime": "~/xania/view/jsx-runtime.ts",
              "@xania/view": "~/xania/view/index.ts",
              "@xania/state": "~/xania/state/index.ts",
            },
          },
        }),
        subgit("xania/view/packages/view", resolve(targetPath, "./xania/view")),
        subgit(
          "xania/view/packages/state",
          resolve(targetPath, "./xania/state")
        )
      );
      break;
    case "install from npm":
      actions.push(
        npmInstall(targetPath, "@xania/view", "@xania/state"),
        vite(targetPath, {}),
        subgit("xania/view/packages/view", resolve(targetPath, "./xania/view")),
        subgit(
          "xania/view/packages/state",
          resolve(targetPath, "./xania/state")
        )
      );
      break;
  }

  return actions;
}

export default (projectPath: string) => installXaniaPackage(projectPath);
