import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runDiffCommand } from "../../src/commands/diff.js";
import { serializeSnapshot } from "../../src/core/snapshot.js";
import type { ScanSnapshot } from "../../src/core/snapshot.js";
import type { ContextItem } from "../../src/core/types.js";

function item(overrides: Partial<ContextItem>): ContextItem {
  return {
    id: "id",
    category: "agents",
    sourceId: "agents",
    label: "label",
    scope: "global",
    cost: {
      eagerChars: 0,
      eagerTokens: 0,
      lazyChars: 0,
      lazyTokens: 0,
      basis: "eager",
      isCoarseEstimate: false,
    },
    ...overrides,
  };
}

function snapshot(items: ContextItem[]): ScanSnapshot {
  return {
    version: 1,
    generatedAt: "2026-01-01T00:00:00.000Z",
    target: { homeDir: "/home", projectDir: "/project" },
    estimatorId: "heuristic-chars-4",
    items,
  };
}

describe("runDiffCommand", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "aperture-diff-test-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("computes a correct signed per-category delta and total", async () => {
    const before = snapshot([
      item({
        id: "a1",
        category: "agents",
        cost: {
          eagerChars: 40,
          eagerTokens: 10,
          lazyChars: 0,
          lazyTokens: 0,
          basis: "eager",
          isCoarseEstimate: false,
        },
      }),
    ]);
    const after = snapshot([
      item({
        id: "a1",
        category: "agents",
        cost: {
          eagerChars: 40,
          eagerTokens: 10,
          lazyChars: 0,
          lazyTokens: 0,
          basis: "eager",
          isCoarseEstimate: false,
        },
      }),
      item({
        id: "a2",
        category: "agents",
        cost: {
          eagerChars: 4000,
          eagerTokens: 1000,
          lazyChars: 0,
          lazyTokens: 0,
          basis: "eager",
          isCoarseEstimate: false,
        },
      }),
    ]);

    const beforePath = join(dir, "before.json");
    const afterPath = join(dir, "after.json");
    await writeFile(beforePath, serializeSnapshot(before));
    await writeFile(afterPath, serializeSnapshot(after));

    const { output, exitCode } = await runDiffCommand(beforePath, afterPath, {});
    expect(exitCode).toBe(0);
    expect(output).toContain("+1000 tokens (est.)");
    expect(output).toMatch(/Total:.*\+1000 tokens \(est\.\)/);
  });

  it("exits non-zero when the total delta exceeds --max-increase", async () => {
    const before = snapshot([]);
    const after = snapshot([
      item({
        cost: {
          eagerChars: 4000,
          eagerTokens: 1000,
          lazyChars: 0,
          lazyTokens: 0,
          basis: "eager",
          isCoarseEstimate: false,
        },
      }),
    ]);

    const beforePath = join(dir, "before.json");
    const afterPath = join(dir, "after.json");
    await writeFile(beforePath, serializeSnapshot(before));
    await writeFile(afterPath, serializeSnapshot(after));

    const under = await runDiffCommand(beforePath, afterPath, { maxIncrease: 5000 });
    expect(under.exitCode).toBe(0);

    const over = await runDiffCommand(beforePath, afterPath, { maxIncrease: 500 });
    expect(over.exitCode).toBe(1);
  });
});
