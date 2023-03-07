import enquirer from "enquirer";
import { Action } from "./actions/action";
import { subgit } from "./actions/subgit";
import { submodule } from "./actions/submodule";
import { npmInstall, npmUninstall } from "./actions/npm";
import { tsconfig } from "./actions/tsconfig";
import { vite } from "./actions/vite";

const { select } = enquirer;

async function installXaniaPackage(actions: Action[] = []) {
  const response = await select({
    name: "@xania/view",
    message: "Select how to pull @xania/view",
    choices: [{ name: "install from npm" }, { name: "with source code" }],
  });

  switch (response) {
    case "with source code":
      actions.push(
        npmUninstall("@xania/view"),
        tsconfig("tsconfig.xania.json", {
          compilerOptions: {
            jsx: "react-jsx",
            jsxImportSource: "@xania/view",
            composite: true,
            paths: {
              ["@xania/view"]: ["./xania/view"],
            },
          },
        }),
        vite({
          resolve: {
            alias: {
              "@xania/view": "./xania/view",
            },
          },
        }),
        subgit("xania/view/packages/view", "./xania/view")
      );
      break;
    case "install from npm":
      actions.push(npmInstall("@xania/view"), vite({}));
      break;
  }

  return actions;
}

async function addExamples(actions: Action[] = []) {
  type GithubContents = [
    { name: string; path: string; git_url: string; type: "dir" | "file" }
  ];
  const templates: GithubContents = await fetch(
    "https://api.github.com/repos/xania/view/contents/packages"
  ).then((e) => e.json());

  const response = await select({
    name: "examples",
    choices: templates
      .filter((tpl) => tpl.type === "dir")
      .map((tpl) => ({ name: tpl.name })),
  });

  const tpl = templates.find((e) => e.name === response);
  if (tpl) {
    actions.push(
      subgit("xania/view/" + tpl.path, tpl.name),
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
