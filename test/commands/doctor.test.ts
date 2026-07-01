import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runDoctorCommand } from "../../src/commands/doctor.js";
import { fixture } from "../helpers.js";

describe("runDoctorCommand", () => {
  it("flags an oversized CLAUDE.md against the configured warn threshold", async () => {
    const home = fixture("oversized-claude-md", "home");
    const { output, exitCode } = await runDoctorCommand(home, { home });
    expect(output).toMatch(
      /CLAUDE\.md \(global\) is \d+ bytes — over your configured 8000 byte warn threshold\./,
    );
    expect(exitCode).toBe(0); // failOnWarn not requested
  });

  it("flags a duplicate agent name across a global scope and a plugin pack", async () => {
    const home = fixture("duplicate-names", "home");
    const { output } = await runDoctorCommand(home, { home });
    expect(output).toContain('2 agents share the name "reviewer" across global, pack-a/tools');
  });

  it("reports no issues for the minimal fixture", async () => {
    const home = fixture("minimal", "home");
    const { output, exitCode } = await runDoctorCommand(home, { home });
    expect(output.trim()).toBe("No issues found.");
    expect(exitCode).toBe(0);
  });

  it("exits non-zero with --fail-on-warn when a warning-level issue exists", async () => {
    const home = fixture("oversized-claude-md", "home");
    const { exitCode } = await runDoctorCommand(home, { home, failOnWarn: true });
    expect(exitCode).toBe(1);
  });

  describe("info-only output", () => {
    let dir: string;

    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), "aperture-doctor-info-test-"));
      await mkdir(join(dir, ".claude"), { recursive: true });
      await writeFile(join(dir, ".claude", "CLAUDE.md"), "# Small\n");
      await writeFile(
        join(dir, ".claude.json"),
        JSON.stringify({ mcpServers: { solo: { command: "solo-mcp" } } }),
      );
    });

    afterEach(async () => {
      await rm(dir, { recursive: true, force: true });
    });

    it("--fail-on-warn does not fail when only info-level notes exist (e.g. MCP caveat)", async () => {
      const { output, exitCode } = await runDoctorCommand(dir, { home: dir, failOnWarn: true });
      expect(output).toContain("[info]");
      expect(output).not.toContain("[warn]");
      expect(exitCode).toBe(0);
    });
  });
});
