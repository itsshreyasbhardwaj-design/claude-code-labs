import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { commandsSource } from "../../src/sources/commands.source.js";
import { fixture, makeContext } from "../helpers.js";

describe("commandsSource", () => {
  it("derives the command name from the file path, not frontmatter (there is no name field)", async () => {
    const home = fixture("kitchen-sink", "home");
    const project = fixture("kitchen-sink", "project");
    const ctx = makeContext(home, project);

    const items = await commandsSource.scan(ctx);
    expect(items.map((i) => i.label).sort()).toEqual(["/deploy", "/local-cmd"]);
  });

  it("treats the entire file as lazy cost with zero eager cost", async () => {
    const home = fixture("kitchen-sink", "home");
    const ctx = makeContext(home, home);
    const items = await commandsSource.scan(ctx);

    const deploy = items.find((i) => i.label === "/deploy");
    expect(deploy).toBeDefined();
    expect(deploy!.cost.basis).toBe("lazy");
    expect(deploy!.cost.eagerTokens).toBe(0);
    expect(deploy!.cost.eagerChars).toBe(0);

    const raw = readFileSync(deploy!.filePath!, "utf-8");
    expect(deploy!.cost.lazyChars).toBe(raw.length);
  });

  it("reads description/argument-hint into meta without requiring a name field", async () => {
    const home = fixture("kitchen-sink", "home");
    const ctx = makeContext(home, home);
    const items = await commandsSource.scan(ctx);
    const deploy = items.find((i) => i.label === "/deploy");
    expect(deploy!.meta?.description).toBe("Deploy the current project to production.");
    expect(deploy!.meta?.argumentHint).toBe("[environment]");
  });
});
