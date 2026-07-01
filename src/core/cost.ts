import type { CostBasis, TokenCost, TokenEstimator } from "./types.js";

export function computeCost(
  estimator: TokenEstimator,
  eagerText: string,
  lazyText: string,
  basis: CostBasis,
): TokenCost {
  return {
    eagerChars: eagerText.length,
    eagerTokens: estimator.estimate(eagerText),
    lazyChars: lazyText.length,
    lazyTokens: estimator.estimate(lazyText),
    basis,
    isCoarseEstimate: false,
  };
}

export function coarseCost(): TokenCost {
  return {
    eagerChars: 0,
    eagerTokens: 0,
    lazyChars: 0,
    lazyTokens: 0,
    basis: "coarse",
    isCoarseEstimate: true,
  };
}

export function totalTokens(cost: TokenCost): number {
  return cost.eagerTokens + cost.lazyTokens;
}
