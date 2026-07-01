import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ApertureConfig, ContextSource } from "./types.js";

export interface PluginLoadFailure {
  entry: string;
  error: string;
}

export interface PluginLoadResult {
  sources: ContextSource[];
  failures: PluginLoadFailure[];
}

function looksLikeContextSource(value: unknown): value is ContextSource {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ContextSource>;
  return typeof candidate.id === "string" && typeof candidate.scan === "function";
}

function isLocalSpecifier(entry: string): boolean {
  return entry.startsWith(".") || entry.startsWith("/") || isAbsolute(entry);
}

/**
 * Dynamically imports every plugin listed in config.plugins. A single bad plugin (missing
 * package, throwing module, malformed export) is logged to stderr and skipped — it must
 * never take down the whole scan. `failures` is returned so `doctor`/the TUI can surface it.
 */
export async function loadPlugins(config: ApertureConfig, cwd: string): Promise<PluginLoadResult> {
  const sources: ContextSource[] = [];
  const failures: PluginLoadFailure[] = [];

  for (const entry of config.plugins) {
    try {
      const specifier = isLocalSpecifier(entry) ? pathToFileURL(resolve(cwd, entry)).href : entry;
      const mod = (await import(specifier)) as { default?: unknown };

      if (!looksLikeContextSource(mod.default)) {
        throw new Error("module's default export is not a valid ContextSource ({ id, scan })");
      }

      sources.push(mod.default);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ entry, error: message });
      process.stderr.write(`aperture: skipping plugin "${entry}" — ${message}\n`);
    }
  }

  return { sources, failures };
}
