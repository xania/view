import type { CommonOptions } from "execa";

export const run = async (
  command: string,
  options: CommonOptions<string> = {}
) => {
  const [script, ...scriptArgs] = command.split(" ");

  if (options.cwd) console.log("[" + options.cwd + "] ", script, ...scriptArgs);

  const execa = (await import("execa")).execa;
  return execa(script, scriptArgs, {
    stdio: "inherit",
    ...options,
  });
};
