import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runInitCommand } from "../../src/commands/init.js";
import { DEFAULT_CONFIG } from "../../src/core/config.js";

describe("runInitCommand", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "aperture-init-test-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("writes a valid aperture.config.json matching the defaults", async () => {
    const { exitCode } = await runInitCommand(dir, {});
    expect(exitCode).toBe(0);

    const written = JSON.parse(await readFile(join(dir, "aperture.config.json"), "utf-8"));
    expect(written).toEqual(DEFAULT_CONFIG);
  });

  it("refuses to overwrite an existing config without --force", async () => {
    await runInitCommand(dir, {});
    const { output, exitCode } = await runInitCommand(dir, {});
    expect(exitCode).toBe(1);
    expect(output).toMatch(/already exists/);
  });

  it("overwrites with --force", async () => {
    await runInitCommand(dir, {});
    const { exitCode } = await runInitCommand(dir, { force: true });
    expect(exitCode).toBe(0);
  });
});
