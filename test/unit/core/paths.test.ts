import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  globalClaudeDir,
  globalClaudeJsonPath,
  globalClaudeMdPath,
  pluginNameFromPath,
  walkUpForClaudeMd,
} from "../../../src/core/paths.js";
import { fixture } from "../../helpers.js";

describe("path helpers", () => {
  it("resolves the global claude dir and files relative to homeDir", () => {
    const home = "/home/alice";
    expect(globalClaudeDir(home)).toBe("/home/alice/.claude");
    expect(globalClaudeMdPath(home)).toBe("/home/alice/.claude/CLAUDE.md");
    // .claude.json is a sibling of .claude/, not inside it.
    expect(globalClaudeJsonPath(home)).toBe("/home/alice/.claude.json");
  });
});

describe("walkUpForClaudeMd", () => {
  const home = fixture("kitchen-sink", "home");
  const projectRoot = fixture("kitchen-sink", "project");
  const nested = fixture("kitchen-sink", "project", "nested");

  it("finds CLAUDE.md at every level from the start dir up to (not including) home", () => {
    const found = walkUpForClaudeMd(nested, home);
    expect(found).toEqual([join(nested, "CLAUDE.md"), join(projectRoot, "CLAUDE.md")]);
  });

  it("returns an empty list when projectDir equals homeDir", () => {
    expect(walkUpForClaudeMd(home, home)).toEqual([]);
  });

  it("does not include homeDir's own CLAUDE.md", () => {
    const found = walkUpForClaudeMd(nested, home);
    expect(found).not.toContain(join(home, "CLAUDE.md"));
  });
});

describe("pluginNameFromPath", () => {
  it("extracts marketplace/plugin-name from a plugin-scoped path", () => {
    const claudeDir = "/home/alice/.claude";
    const path = `${claudeDir}/plugins/acme-pack/growth-tools/agents/reviewer.md`;
    expect(pluginNameFromPath(path, claudeDir)).toBe("acme-pack/growth-tools");
  });

  it("returns undefined for a non-plugin path", () => {
    const claudeDir = "/home/alice/.claude";
    expect(pluginNameFromPath(`${claudeDir}/agents/reviewer.md`, claudeDir)).toBeUndefined();
  });
});
