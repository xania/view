import type { CommonSpawnOptions } from "child_process";
import { spawn } from "cross-spawn";
import fs from "fs";
import path from "path";

export function spawnPromise(
  command: string,
  args: string[] = [],
  options: CommonSpawnOptions = {}
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("close", (code) => {
      if (code !== 0) {
        return reject(code);
      }
      resolve(code);
    });
  });
}

export function exists(filePath: string, baseDir: string): boolean {
  return fs.existsSync(path.resolve(baseDir, filePath));
}

export function isOccupied(dirname: string) {
  try {
    return (
      fs.readdirSync(dirname).filter((s) => !s.startsWith(".")).length !== 0
    );
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}
