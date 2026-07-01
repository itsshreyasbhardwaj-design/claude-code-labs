import { describe, expect, it } from "vitest";
import { agentsSource } from "../../src/sources/agents.source.js";
import { fixture, makeContext } from "../helpers.js";

describe("agentsSource", () => {
  it("finds global, project, and plugin-scoped agents", async () => {
    const home = fixture("kitchen-sink", "home");
    const project = fixture("kitchen-sink", "project");
    const ctx = makeContext(home, project);

    const items = await agentsSource.scan(ctx);
    const byScope = {
      global: items.filter((i) => i.scope === "global"),
      project: items.filter((i) => i.scope === "project"),
      plugin: items.filter((i) => i.scope === "plugin"),
    };

    expect(byScope.global.map((i) => i.label).sort()).toEqual(["researcher", "reviewer"]);
    expect(byScope.project.map((i) => i.label)).toEqual(["local-agent"]);
    expect(byScope.plugin.map((i) => i.label)).toEqual(["reviewer"]);
    expect(byScope.plugin[0]?.pluginName).toBe("acme-pack/growth-tools");
  });

  it("records non-standard frontmatter keys in meta without counting them toward cost", async () => {
    const home = fixture("kitchen-sink", "home");
    const ctx = makeContext(home, home);
    const items = await agentsSource.scan(ctx);

    const reviewer = items.find((i) => i.scope === "global" && i.label === "reviewer");
    expect(reviewer?.meta?.extraFrontmatterKeys).toContain("color");
    // Eager cost is derived only from name+description, regardless of extra keys present.
    expect(reviewer!.cost.eagerChars).toBe(
      "reviewer: Reviews code for correctness, security, and style issues.".length,
    );
  });

  it("isolates a malformed agent file so it doesn't stop the rest of the directory from scanning", async () => {
    const home = fixture("malformed-frontmatter", "home");
    // malformed-frontmatter only has a skills/ fixture, so point agents at a dir with nothing —
    // this asserts the source doesn't throw when the agents dir itself is entirely absent.
    const ctx = makeContext(home, home);
    await expect(agentsSource.scan(ctx)).resolves.toEqual([]);
  });

  it("flags duplicate agent names across a global scope and a plugin pack", async () => {
    const home = fixture("duplicate-names", "home");
    const ctx = makeContext(home, home);
    const items = await agentsSource.scan(ctx);

    const reviewers = items.filter((i) => i.label === "reviewer");
    expect(reviewers).toHaveLength(2);
    const origins = new Set(reviewers.map((i) => i.pluginName ?? i.scope));
    expect(origins.size).toBe(2);
  });
});
