import { getEstimator } from "../estimators/heuristic-estimator.js";
import { buildIgnoreMatcher } from "../utils/glob.js";
import type { PluginLoadFailure } from "./plugin-loader.js";
import { loadPlugins } from "./plugin-loader.js";
import { createDefaultRegistry } from "./registry.js";
import type { ApertureConfig, ContextItem, ScanContext, TokenEstimator } from "./types.js";

export interface RunScanOptions {
  homeDir: string;
  projectDir: string;
  config: ApertureConfig;
  estimator?: TokenEstimator;
}

export interface SourceError {
  sourceId: string;
  error: string;
}

export interface RunScanResult {
  items: ContextItem[];
  sourceErrors: SourceError[];
  pluginFailures: PluginLoadFailure[];
}

/**
 * Runs every registered source (built-ins + config-declared plugins) and aggregates their
 * items. A source throwing (built-in or plugin) is caught and recorded in `sourceErrors`
 * rather than aborting the rest of the scan — one bad source should never blank the report.
 */
export async function runScan(options: RunScanOptions): Promise<RunScanResult> {
  const estimator = options.estimator ?? getEstimator(options.config.estimator);
  const isIgnored = buildIgnoreMatcher(options.config.ignore);
  const ctx: ScanContext = {
    homeDir: options.homeDir,
    projectDir: options.projectDir,
    config: options.config,
    estimator,
    isIgnored,
  };

  const registry = createDefaultRegistry();
  const { sources: pluginSources, failures: pluginFailures } = await loadPlugins(
    options.config,
    options.projectDir,
  );
  for (const source of pluginSources) {
    try {
      registry.register(source);
    } catch (error) {
      pluginFailures.push({
        entry: source.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const sources = registry.list();
  const settled = await Promise.allSettled(sources.map((source) => source.scan(ctx)));

  const items: ContextItem[] = [];
  const sourceErrors: SourceError[] = [];

  settled.forEach((result, index) => {
    const source = sources[index];
    if (!source) return;
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      sourceErrors.push({
        sourceId: source.id,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });

  return { items, sourceErrors, pluginFailures };
}
