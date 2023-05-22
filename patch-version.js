const fs = require("fs");

async function patch(packageJsonPath) {
  const packageJson = require(packageJsonPath);
  const versionParts = packageJson.version.split(".");
  const patchVersion = Number(versionParts[2]) + 1;
  const newVersion = `${versionParts[0]}.${versionParts[1]}.${patchVersion}`;

  packageJson.version = newVersion;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

patch("./packages/view/package.json");
