import { join } from "node:path";
import { z } from "zod";
import type { ApertureConfig } from "./types.js";
import { readFileSafe } from "../utils/fs-safe.js";

const configSchema = z.object({
  budgetTokens: z.number().positive().default(50_000),
  ignore: z.array(z.string()).default([]),
  claudeMdWarnBytes: z.number().positive().default(8_000),
  estimator: z.string().default("heuristic-chars-4"),
  plugins: z.array(z.string()).default([]),
});

export const DEFAULT_CONFIG: ApertureConfig = configSchema.parse({});

export const CONFIG_FILENAME = "aperture.config.json";
export const PLUGINS_FILENAME = join(".aperture", "plugins.json");

export interface LoadConfigResult {
  config: ApertureConfig;
  /** true if aperture.config.json existed but failed validation (defaults were used instead) */
  validationError?: string;
}

export async function loadConfig(projectDir: string): Promise<LoadConfigResult> {
  const configPath = join(projectDir, CONFIG_FILENAME);
  const raw = await readFileSafe(configPath);

  let base: ApertureConfig = DEFAULT_CONFIG;
  let validationError: string | undefined;

  if (raw !== undefined) {
    try {
      const parsedJson = JSON.parse(raw);
      const result = configSchema.safeParse(parsedJson);
      if (result.success) {
        base = result.data;
      } else {
        validationError = result.error.issues
          .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
          .join("; ");
      }
    } catch (error) {
      validationError = error instanceof Error ? error.message : "invalid JSON";
    }
  }

  const pluginsFilePath = join(projectDir, PLUGINS_FILENAME);
  const pluginsRaw = await readFileSafe(pluginsFilePath);
  if (pluginsRaw !== undefined) {
    try {
      const parsed = JSON.parse(pluginsRaw) as { plugins?: unknown };
      if (Array.isArray(parsed.plugins)) {
        const fromFile = parsed.plugins.filter((p): p is string => typeof p === "string");
        // aperture.config.json's plugins array takes precedence when both declare entries.
        const merged = new Set([...base.plugins, ...fromFile]);
        base = { ...base, plugins: [...merged] };
      }
    } catch {
      // malformed .aperture/plugins.json is non-fatal — just ignored.
    }
  }

  return { config: base, validationError };
}
