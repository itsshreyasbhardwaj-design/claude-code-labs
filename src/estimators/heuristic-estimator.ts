import type { TokenEstimator } from "../core/types.js";

/**
 * ~4 characters per token is the standard rough heuristic for English text (Anthropic does
 * not publish a public BPE tokenizer). Every consumer must present this as "estimated" —
 * never as an exact count.
 */
export const heuristicEstimator: TokenEstimator = {
  id: "heuristic-chars-4",
  estimate(text: string): number {
    const trimmed = text.trim();
    if (trimmed.length === 0) return 0;
    return Math.ceil(trimmed.length / 4);
  },
};

const estimators: Record<string, TokenEstimator> = {
  [heuristicEstimator.id]: heuristicEstimator,
};

export function getEstimator(id: string): TokenEstimator {
  const estimator = estimators[id];
  if (!estimator) {
    throw new Error(`Unknown estimator "${id}". Available: ${Object.keys(estimators).join(", ")}`);
  }
  return estimator;
}
