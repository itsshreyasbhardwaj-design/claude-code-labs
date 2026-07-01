import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { CONFIG_FILENAME, DEFAULT_CONFIG } from "../core/config.js";
import type { CommandResult } from "./scan.js";

export interface InitOptions {
  force?: boolean;
}

export async function runInitCommand(
  dir: string | undefined,
  options: InitOptions,
): Promise<CommandResult> {
  const projectDir = resolve(dir ?? process.cwd());
  const configPath = join(projectDir, CONFIG_FILENAME);

  if (existsSync(configPath) && !options.force) {
    return {
      output: `${CONFIG_FILENAME} already exists at ${configPath} — use --force to overwrite.\n`,
      exitCode: 1,
    };
  }

  await writeFile(configPath, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, "utf-8");
  return { output: `Wrote ${configPath}\n`, exitCode: 0 };
}
