import enquirer from "enquirer";
import { Action } from "./actions/action";
import { subgit } from "./actions/subgit";

export async function initProject(actions: Action[] = []) {
  type GithubContents = [
    { name: string; path: string; git_url: string; type: "dir" | "file" }
  ];
  const templates: GithubContents = await fetch(
    "https://api.github.com/repos/xania/view/contents/templates"
  ).then((e) => e.json());

  const choices = templates
    .filter((tpl) => tpl.type === "dir")
    .map((tpl) => ({ name: tpl.name }));

  const name = await enquirer.input({
    message: "name",
    default: "my-project",
  });
  const title = await enquirer.input({
    message: "title",
    default: name,
  });
  const description = await enquirer.input({
    message: "description",
  });

  const mappings = {
    name,
    title,
    description,
  };

  const targetPath = name;

  if (choices.length === 1) {
    const choice = choices[0].name;
    const tpl = templates.find((e) => e.name === choice)!;
    actions.push(subgit("xania/view/" + tpl.path, targetPath, mappings));
  } else {
    const choice = await enquirer.select({
      name: "dev server",
      choices,
    });

    const tpl = templates.find((e) => e.name === choice);
    if (tpl) {
      actions.push(subgit("xania/view/" + tpl.path, targetPath, mappings));
    }
  }

  return actions;
}

export default () => initProject([]);
