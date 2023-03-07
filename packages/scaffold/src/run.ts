import { execa, CommonOptions } from "execa";

export const run = (command: string, options: CommonOptions<string> = {}) => {
  const [script, ...scriptArgs] = command.split(" ");

  return execa(script, scriptArgs, {
    stdio: "inherit",
    ...options,
  });
};
