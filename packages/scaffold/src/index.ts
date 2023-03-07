import enquirer from "enquirer";
import { Action } from "./actions/action";
import { subgit } from "./actions/subgit";
import { npmInstall, npmUninstall } from "./actions/npm";
import { tsconfig } from "./actions/tsconfig";
import { vite } from "./actions/vite";

const { select } = enquirer;

async function installXaniaPackage(actions: Action[] = []) {
  const response = await select({
    name: "@xania",
    message: "Select how to pull @xania",
    choices: [{ name: "install from npm" }, { name: "with source code" }],
  });

  switch (response) {
    case "with source code":
      actions.push(
        npmUninstall("@xania/view", "@xania/state"),
        tsconfig("tsconfig.xania.json", {
          compilerOptions: {
            paths: {
              ["@xania/view"]: ["./xania/view"],
              ["@xania/state"]: ["./xania/state"],
            },
          },
        }),
        vite({
          resolve: {
            alias: {
              "@xania/view": "./xania/view",
              "@xania/state": "./xania/state",
            },
          },
        }),
        subgit("xania/view/packages/view", "./xania/view"),
        subgit("xania/view/packages/state", "./xania/state")
      );
      break;
    case "install from npm":
      actions.push(
        npmInstall("@xania/view", "@xania/state"),
        vite({}),
        subgit("xania/view/packages/view", "./xania/view"),
        subgit("xania/view/packages/state", "./xania/state")
      );
      break;
  }

  return actions;
}

async function addExamples(actions: Action[] = []) {
  type GithubContents = [
    { name: string; path: string; git_url: string; type: "dir" | "file" }
  ];
  const templates: GithubContents = await fetch(
    "https://api.github.com/repos/xania/view/contents/packages/kitchen-sink/examples"
  ).then((e) => e.json());

  const choices = templates
    .filter((tpl) => tpl.type === "dir")
    .map((tpl) => ({ name: tpl.name }));
  choices.push({ name: "skip" });

  const response = await select({
    name: "examples",
    choices,
  });

  const tpl = templates.find((e) => e.name === response);
  if (tpl) {
    const targetPath = "src/" + tpl.name;
    actions.push(
      subgit("xania/view/" + tpl.path, targetPath),
      npmInstall("@xania/state")
    );
  }

  return actions;
}

installXaniaPackage().then(addExamples).then(run);

async function run(actions: Action[]) {
  for (const action of actions) {
    await action({ projectDir: process.cwd() });
  }
}
