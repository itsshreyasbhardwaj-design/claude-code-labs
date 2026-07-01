import { existsSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

/**
 * The single seam that resolves where "home" and "project" config live. Every function here
 * takes explicit directories rather than calling os.homedir()/process.cwd() itself, which is
 * what lets tests point at fixture trees instead of the real machine.
 */

export function globalClaudeDir(homeDir: string): string {
  return join(homeDir, ".claude");
}

/** Sibling of ~/.claude/, not inside it — confirmed on a real install. */
export function globalClaudeJsonPath(homeDir: string): string {
  return join(homeDir, ".claude.json");
}

export function globalClaudeMdPath(homeDir: string): string {
  return join(globalClaudeDir(homeDir), "CLAUDE.md");
}

/**
 * Walks upward from `startDir` collecting every CLAUDE.md found, stopping once it reaches
 * (and including, if present) `stopAtDir` but never walking past it. Returns nearest-first.
 */
export function walkUpForClaudeMd(startDir: string, stopAtDir: string): string[] {
  const found: string[] = [];
  const stop = resolve(stopAtDir);
  let current = resolve(startDir);

  // Safety bound in case of unusual filesystem layouts (e.g. symlink loops).
  for (let i = 0; i < 200; i++) {
    // Never include stopAtDir's own CLAUDE.md here — that's globalClaudeMdPath's job.
    if (current === stop) break;

    const candidate = join(current, "CLAUDE.md");
    if (existsSync(candidate)) found.push(candidate);

    const parent = dirname(current);
    if (parent === current) break; // reached filesystem root without hitting stop
    current = parent;
  }

  return found;
}

/**
 * Given an absolute path under `<globalClaudeDir>/plugins/<marketplace>/<plugin-name>/...`,
 * returns "<marketplace>/<plugin-name>". Returns undefined for paths that don't match that shape.
 */
export function pluginNameFromPath(absolutePath: string, claudeDir: string): string | undefined {
  const rel = relative(claudeDir, absolutePath);
  const parts = rel.split(sep);
  if (parts[0] !== "plugins" || parts.length < 3) return undefined;
  return `${parts[1]}/${parts[2]}`;
}
