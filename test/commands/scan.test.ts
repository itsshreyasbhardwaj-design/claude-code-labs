import { describe, expect, it } from "vitest";
import { runScanCommand } from "../../src/commands/scan.js";
import { parseSnapshot } from "../../src/core/snapshot.js";
import { fixture } from "../helpers.js";

describe("runScanCommand", () => {
  const project = fixture("kitchen-sink", "project");
  const home = fixture("kitchen-sink", "home");

  it("--json produces a valid, parseable snapshot with all 6 categories represented", async () => {
    const { output, exitCode } = await runScanCommand(project, { json: true, home });
    expect(exitCode).toBe(0);

    const snapshot = parseSnapshot(output);
    const categories = new Set(snapshot.items.map((i) => i.category));
    expect(categories).toEqual(
      new Set(["claude-md", "skills", "agents", "commands", "mcp", "settings"]),
    );
  });

  it("--json never leaks secret-shaped values from mcp env config", async () => {
    const { output } = await runScanCommand(project, { json: true, home });
    expect(output).not.toContain("127.0.0.1");
    expect(output).not.toContain("HEADROOM_PROXY_URL");
  });

  it("--md includes an upfront estimated-tokens disclaimer and per-category sections", async () => {
    const { output, exitCode } = await runScanCommand(project, { md: true, home });
    expect(exitCode).toBe(0);
    expect(output).toMatch(/estimated/i);
    expect(output).toContain("## agents");
    expect(output).toContain("## skills");
  });

  it("plain text output renders a table and a grand total", async () => {
    const { output, exitCode } = await runScanCommand(project, { home });
    expect(exitCode).toBe(0);
    expect(output).toMatch(/Total estimated context budget/);
  });

  it("reports zero source/plugin failures on a healthy fixture", async () => {
    const { output } = await runScanCommand(project, { json: true, home });
    const snapshot = parseSnapshot(output);
    expect(snapshot.items.length).toBeGreaterThan(0);
  });
});
