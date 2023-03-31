import enquirer, { multiselect } from "enquirer";
import { Action } from "./actions/action";
import { subgit } from "./actions/subgit";
import { npmInstall, npmUninstall } from "./actions/npm";
import { tsconfig } from "./actions/tsconfig";
import { vite } from "./actions/vite";
import { resolve } from "node:path";
import { file } from "./actions/file";

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

async function installExamples(projectPath: string, actions: Action[]) {
  const response = await select({
    name: "example app",
    message: "include example app",
    choices: [{ name: "yes" }, { name: "no" }],
  });

  switch (response) {
    case "yes":
      actions.push(
        subgit(
          "xania/view/packages/kitchen-sink/examples",
          resolve(projectPath, "./examples")
        )
      );
      break;
    case "no":
      break;
  }

  // type GithubContents = [
  //   { name: string; path: string; git_url: string; type: "dir" | "file" }
  // ];
  // const templates: GithubContents = await fetch(
  //   "https://api.github.com/repos/xania/view/contents/packages/kitchen-sink/examples"
  // ).then((e) => e.json());

  // const choices = templates
  //   .filter((tpl) => tpl.type === "dir")
  //   .map((tpl) => ({ name: tpl.name }));
  // choices.push({ name: "skip" });

  // const response = await multiselect({
  //   name: "examples",
  //   choices,
  // });

  // const names: string[] = [];

  // for (const choice of response) {
  //   const tpl = templates.find((e) => e.name === choice);
  //   if (tpl) {
  //     const localPath = resolve(projectPath, "examples/" + tpl.name);
  //     names.push("examples/" + tpl.name);
  //     actions.push(subgit("xania/view/" + tpl.path, localPath));
  //   }
  // }

  return actions;
}

export default (projectPath: string) =>
  installXaniaPackage(projectPath).then((actions) =>
    installExamples(projectPath, actions)
  );
