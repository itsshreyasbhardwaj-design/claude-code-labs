import { homedir } from "node:os";
import { resolve } from "node:path";
import { loadConfig } from "../core/config.js";
import type { ApertureConfig } from "../core/types.js";

export interface ResolvedTarget {
  homeDir: string;
  projectDir: string;
  config: ApertureConfig;
}

export async function resolveTarget(
  dir: string | undefined,
  homeOverride: string | undefined,
): Promise<ResolvedTarget> {
  const projectDir = resolve(dir ?? process.cwd());
  const homeDir = homeOverride ? resolve(homeOverride) : homedir();
  const { config, validationError } = await loadConfig(projectDir);
  if (validationError) {
    process.stderr.write(
      `aperture: aperture.config.json is invalid (${validationError}) — using defaults\n`,
    );
  }
  return { homeDir, projectDir, config };
}
