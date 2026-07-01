import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, loadConfig } from "../../../src/core/config.js";

describe("loadConfig", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "aperture-config-test-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns defaults when no config file exists", async () => {
    const { config, validationError } = await loadConfig(dir);
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(validationError).toBeUndefined();
  });

  it("loads and merges a valid aperture.config.json", async () => {
    await writeFile(join(dir, "aperture.config.json"), JSON.stringify({ budgetTokens: 12345 }));
    const { config, validationError } = await loadConfig(dir);
    expect(config.budgetTokens).toBe(12345);
    expect(config.ignore).toEqual([]);
    expect(validationError).toBeUndefined();
  });

  it("surfaces a validation error and falls back to defaults for a malformed value", async () => {
    await writeFile(
      join(dir, "aperture.config.json"),
      JSON.stringify({ budgetTokens: "not-a-number" }),
    );
    const { config, validationError } = await loadConfig(dir);
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(validationError).toMatch(/budgetTokens/);
  });

  it("merges .aperture/plugins.json entries into config.plugins", async () => {
    await writeFile(
      join(dir, "aperture.config.json"),
      JSON.stringify({ plugins: ["from-config"] }),
    );
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(dir, ".aperture"), { recursive: true });
    await writeFile(
      join(dir, ".aperture", "plugins.json"),
      JSON.stringify({ plugins: ["from-file"] }),
    );

    const { config } = await loadConfig(dir);
    expect(config.plugins).toEqual(expect.arrayContaining(["from-config", "from-file"]));
  });
});
