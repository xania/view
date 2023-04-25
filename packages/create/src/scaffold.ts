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
    name: "xania",
    message: "Select how to pull Xania",
    choices: [{ name: "install from npm" }, { name: "with source code" }],
  });

  switch (response) {
    case "with source code":
      actions.push(
        npmUninstall(targetPath, "xania", "@xania/state"),
        tsconfig(resolve(targetPath, "./tsconfig.xania.json"), {
          compilerOptions: {
            composite: true,
            paths: {
              xania: ["./xania/view/index.ts"],
              "@xania/state": ["./xania/state/index.ts"],
            },
          },
        }),
        vite(targetPath, {
          resolve: {
            alias: {
              "~": process.cwd(),
              "xania/jsx-runtime": "~/xania/view/jsx-runtime.ts",
              "xania/jsx-dev-runtime": "~/xania/view/jsx-runtime.ts",
              xania: "~/xania/view/index.ts",
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
      actions.push(npmInstall(targetPath, "xania"), vite(targetPath, {}));
      break;
  }

  return actions;
}

export default (projectPath: string) => installXaniaPackage(projectPath);
