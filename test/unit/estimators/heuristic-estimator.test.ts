import { describe, expect, it } from "vitest";
import { getEstimator, heuristicEstimator } from "../../../src/estimators/heuristic-estimator.js";

describe("heuristicEstimator", () => {
  it("returns 0 for empty text", () => {
    expect(heuristicEstimator.estimate("")).toBe(0);
  });

  it("returns 0 for whitespace-only text", () => {
    expect(heuristicEstimator.estimate("   \n\t  ")).toBe(0);
  });

  it("estimates ~4 chars per token, rounding up", () => {
    expect(heuristicEstimator.estimate("abcd")).toBe(1);
    expect(heuristicEstimator.estimate("abcde")).toBe(2);
    expect(heuristicEstimator.estimate("a".repeat(400))).toBe(100);
  });

  it("trims surrounding whitespace before counting", () => {
    expect(heuristicEstimator.estimate("  abcd  ")).toBe(heuristicEstimator.estimate("abcd"));
  });

  it("has a stable id", () => {
    expect(heuristicEstimator.id).toBe("heuristic-chars-4");
  });
});

describe("getEstimator", () => {
  it("resolves the heuristic estimator by id", () => {
    expect(getEstimator("heuristic-chars-4")).toBe(heuristicEstimator);
  });

  it("throws a helpful error for an unknown id", () => {
    expect(() => getEstimator("nonexistent")).toThrow(/Unknown estimator/);
  });
});
