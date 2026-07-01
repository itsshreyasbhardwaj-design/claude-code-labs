/**
 * Shared contract for every piece of Aperture: a ContextSource turns some part of a
 * Claude Code installation into a list of ContextItems, each carrying an estimated
 * eager/lazy token cost. Nothing outside sources/ should know how a category is scanned.
 */

export type Category = "claude-md" | "skills" | "agents" | "commands" | "mcp" | "settings";

export type CostBasis = "eager" | "lazy" | "coarse";

export interface TokenCost {
  eagerChars: number;
  eagerTokens: number;
  lazyChars: number;
  lazyTokens: number;
  basis: CostBasis;
  /** true if this number is a coarse placeholder (e.g. MCP tool schemas), not derived from real text length */
  isCoarseEstimate: boolean;
}

export type Scope = "global" | "project" | "plugin";

export interface ContextItem {
  id: string;
  category: Category;
  sourceId: string;
  label: string;
  filePath?: string;
  scope: Scope;
  pluginName?: string;
  cost: TokenCost;
  meta?: Record<string, unknown>;
  warnings?: string[];
}

export interface ApertureConfig {
  budgetTokens: number;
  ignore: string[];
  claudeMdWarnBytes: number;
  estimator: string;
  plugins: string[];
}

export interface ScanContext {
  homeDir: string;
  projectDir: string;
  config: ApertureConfig;
  estimator: TokenEstimator;
  isIgnored: (absolutePath: string) => boolean;
}

export interface ContextSource {
  readonly id: string;
  readonly category: Category;
  scan(ctx: ScanContext): Promise<ContextItem[]>;
}

export interface TokenEstimator {
  readonly id: string;
  estimate(text: string): number;
}

export function zeroCost(basis: CostBasis = "eager"): TokenCost {
  return {
    eagerChars: 0,
    eagerTokens: 0,
    lazyChars: 0,
    lazyTokens: 0,
    basis,
    isCoarseEstimate: basis === "coarse",
  };
}
