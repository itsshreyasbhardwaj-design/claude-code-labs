import { describe, expect, it } from "vitest";
import { settingsSource } from "../../src/sources/settings.source.js";
import { fixture, makeContext } from "../helpers.js";

describe("settingsSource", () => {
  it("finds global settings.json and settings.local.json", async () => {
    const home = fixture("kitchen-sink", "home");
    const ctx = makeContext(home, home);
    const items = await settingsSource.scan(ctx);

    expect(items.map((i) => i.label).sort()).toEqual([
      "settings.json (global)",
      "settings.local.json (global)",
    ]);
  });

  it("excludes mcpServers from the byte count to avoid double-counting with mcp.source", async () => {
    const home = fixture("kitchen-sink", "home");
    const ctx = makeContext(home, home);
    const items = await settingsSource.scan(ctx);

    const settingsJson = items.find((i) => i.label === "settings.json (global)");
    // The fixture's mcpServers.headroom block is large; if it leaked into the byte count,
    // this would be far bigger than the small remaining hooks/someFlag payload.
    expect(settingsJson!.cost.eagerChars).toBeLessThan(300);
    expect(JSON.stringify(settingsJson)).not.toContain("HEADROOM_PROXY_URL");
  });

  it("extracts hook count and event names into meta", async () => {
    const home = fixture("kitchen-sink", "home");
    const ctx = makeContext(home, home);
    const items = await settingsSource.scan(ctx);
    const settingsJson = items.find((i) => i.label === "settings.json (global)");

    expect(settingsJson?.meta?.hookEvents).toEqual(["PreToolUse"]);
    expect(settingsJson?.meta?.hookCount).toBe(1);
  });

  it("finds project-scoped settings files", async () => {
    const home = fixture("minimal", "home");
    const project = fixture("kitchen-sink", "project");
    const ctx = makeContext(home, project);
    const items = await settingsSource.scan(ctx);
    // kitchen-sink/project has no .claude/settings*.json of its own — expect none from project scope.
    expect(items.filter((i) => i.scope === "project")).toEqual([]);
  });
});
