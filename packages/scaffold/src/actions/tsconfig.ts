import { resolve } from "node:path";
import { Action } from "./action";
import { ActionContext } from "./action-context";
import { Optional } from "./optional";
import fs from "node:fs";

export function tsconfig(
  path: string,
  schema: Optional<TsConfigScheme>
): Action {
  return (context: ActionContext) => {
    const targetFile = resolve(context.projectDir, path);

    fs.writeFile(
      targetFile,
      JSON.stringify(schema, null, "  "),
      function (err) {
        if (err) throw err;
      }
    );
    // console.log("tsconfig ", schema);
  };
}

interface TsConfigScheme {
  compilerOptions: {
    jsxFactory: string;
    jsx: "react" | "preserve" | "react-jsx" | "react-jsxdev" | "react-native";
    jsxImportSource: string;
    jsxFragmentFactory: string;
    moduleResolution: "node" | "classic";
    module: "ES2020";
    typeRoots: string[];
    types: string[];
    paths: Record<string, string[]>;
    composite: boolean;
  };
}
