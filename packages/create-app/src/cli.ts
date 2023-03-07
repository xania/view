#!/usr/bin/env node

import { create } from "create-create-app";
import { resolve } from "path";
import { existsSync } from "fs";
import degit from "degit";

const emitter = degit("xania/view/templates", {
  cache: false,
  force: true,
  verbose: true,
});

emitter.on("info", (info) => {
  console.log(info.message);
});

const templateRoot = resolve(".xania");
if (!existsSync(templateRoot)) emitter.clone(templateRoot).then(run);
else {
  run();
}

function run() {
  create("create-xania", {
    templateRoot,

    promptForTemplate: true,
    promptForAuthor: true,

    promptForDescription: false,
    promptForEmail: false,
    promptForLicense: false,

    // extra: {
    //   template: {
    //     type: "list",
    //     choices: ["default", "submodule", "react+xania"],
    //     describe: "select template",
    //   },
    // },

    async after({ answers, run, template }) {
      await run("npm run bootstrap");
    },
    caveat: `Welcome to xania App`,
  });
}

// const git: SimpleGit = simpleGit();

// git.listRemote(["--head"]).then((response) => {
//   console.log(response);

//   create("create-xania", {
//     templateRoot,

//     promptForTemplate: true,
//     promptForAuthor: true,

//     promptForDescription: false,
//     promptForEmail: false,
//     promptForLicense: false,

//     extra: {
//       template: {
//         type: "list",
//         choices: ["default", "submodule", "react+xania"],
//         describe: "select template",
//       },
//     },

//     async after({ answers, run, template }) {
//       if (template === "gitmodule") {
//         await run("git submodule add https://github.com/xania/view.git xania");
//       }
//     },
//     caveat: `Welcome to xania App`,
//   });
// });

// See https://github.com/uetchy/create-create-app/blob/master/README.md for other options.
