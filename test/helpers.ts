import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { heuristicEstimator } from "../src/estimators/heuristic-estimator.js";
import { buildIgnoreMatcher } from "../src/utils/glob.js";
import type { ApertureConfig, ScanContext } from "../src/core/types.js";

const here = dirname(fileURLToPath(import.meta.url));

export const FIXTURES_DIR = join(here, "fixtures");

export function fixture(...segments: string[]): string {
  return join(FIXTURES_DIR, ...segments);
}

export const DEFAULT_TEST_CONFIG: ApertureConfig = {
  budgetTokens: 50_000,
  ignore: [],
  claudeMdWarnBytes: 8_000,
  estimator: "heuristic-chars-4",
  plugins: [],
};

export function makeConfig(overrides: Partial<ApertureConfig> = {}): ApertureConfig {
  return { ...DEFAULT_TEST_CONFIG, ...overrides };
}

export function makeContext(
  homeDir: string,
  projectDir: string,
  configOverrides: Partial<ApertureConfig> = {},
): ScanContext {
  const config = makeConfig(configOverrides);
  return {
    homeDir,
    projectDir,
    config,
    estimator: heuristicEstimator,
    isIgnored: buildIgnoreMatcher(config.ignore),
  };
}
