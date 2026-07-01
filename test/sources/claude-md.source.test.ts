import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { claudeMdSource } from "../../src/sources/claude-md.source.js";
import { fixture, makeContext } from "../helpers.js";

describe("claudeMdSource", () => {
  it("finds the global CLAUDE.md plus every project-level CLAUDE.md walking upward", async () => {
    const home = fixture("kitchen-sink", "home");
    const project = fixture("kitchen-sink", "project");
    const nested = join(project, "nested");
    const ctx = makeContext(home, nested);

    const items = await claudeMdSource.scan(ctx);
    expect(items).toHaveLength(3);

    const global = items.find((i) => i.scope === "global");
    expect(global?.filePath).toBe(join(home, ".claude", "CLAUDE.md"));
    expect(global?.cost.basis).toBe("eager");
    expect(global?.cost.lazyChars).toBe(0);
    expect(global?.cost.eagerChars).toBe(readFileSync(global!.filePath!, "utf-8").length);

    const projectPaths = items
      .filter((i) => i.scope === "project")
      .map((i) => i.filePath)
      .sort();
    expect(projectPaths).toEqual([join(nested, "CLAUDE.md"), join(project, "CLAUDE.md")].sort());
  });

  it("returns just the global file for the minimal fixture (project === home)", async () => {
    const home = fixture("minimal", "home");
    const ctx = makeContext(home, home);
    const items = await claudeMdSource.scan(ctx);
    expect(items).toHaveLength(1);
    expect(items[0]?.scope).toBe("global");
  });

  it("returns nothing when neither global nor project CLAUDE.md exists", async () => {
    const home = fixture("empty", "home");
    const ctx = makeContext(home, home);
    const items = await claudeMdSource.scan(ctx);
    expect(items).toEqual([]);
  });
});
