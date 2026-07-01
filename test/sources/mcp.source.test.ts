import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mcpSource } from "../../src/sources/mcp.source.js";
import { fixture, makeContext } from "../helpers.js";

describe("mcpSource", () => {
  it("finds servers from .claude.json, settings.json, and project .mcp.json", async () => {
    const home = fixture("kitchen-sink", "home");
    const project = fixture("kitchen-sink", "project");
    const ctx = makeContext(home, project);

    const items = await mcpSource.scan(ctx);
    expect(items.map((i) => i.label).sort()).toEqual(["acme", "headroom", "project-db"]);
  });

  it("never fabricates a token number — always coarse, always zero", async () => {
    const home = fixture("kitchen-sink", "home");
    const ctx = makeContext(home, home);
    const items = await mcpSource.scan(ctx);

    for (const item of items) {
      expect(item.cost.basis).toBe("coarse");
      expect(item.cost.isCoarseEstimate).toBe(true);
      expect(item.cost.eagerTokens).toBe(0);
      expect(item.cost.lazyTokens).toBe(0);
      expect(item.warnings).toContain(
        "tool schema cost not measured — requires a live connection (planned as a future --live mode)",
      );
    }
  });

  it("never leaks actual env values, only a boolean presence flag", async () => {
    const home = fixture("kitchen-sink", "home");
    const ctx = makeContext(home, home);
    const items = await mcpSource.scan(ctx);
    const headroom = items.find((i) => i.label === "headroom");

    expect(headroom?.meta?.hasEnv).toBe(true);
    const serialized = JSON.stringify(headroom);
    expect(serialized).not.toContain("127.0.0.1");
    expect(serialized).not.toContain("HEADROOM_PROXY_URL");
  });

  describe("conflicting definitions across files", () => {
    let dir: string;

    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), "aperture-mcp-test-"));
      await mkdir(join(dir, ".claude"), { recursive: true });
      await writeFile(
        join(dir, ".claude.json"),
        JSON.stringify({ mcpServers: { shared: { command: "cmd-a" } } }),
      );
      await writeFile(
        join(dir, ".claude", "settings.json"),
        JSON.stringify({ mcpServers: { shared: { command: "cmd-b" } } }),
      );
    });

    afterEach(async () => {
      await rm(dir, { recursive: true, force: true });
    });

    it("prefers .claude.json's definition and flags the conflict", async () => {
      const ctx = makeContext(dir, dir);
      const items = await mcpSource.scan(ctx);
      expect(items).toHaveLength(1);
      expect(items[0]?.meta?.command).toBe("cmd-a");
      expect(items[0]?.meta?.conflictingDefinitionsIn).toEqual([
        join(dir, ".claude", "settings.json"),
      ]);
    });
  });
});
