import { describe, expect, it } from "vitest";
import { loadPlugins } from "../../../src/core/plugin-loader.js";
import { makeConfig } from "../../helpers.js";
import { fixture } from "../../helpers.js";

const pluginFixtureDir = fixture("plugin-fixture");

describe("loadPlugins", () => {
  it("loads a valid local ContextSource module", async () => {
    const config = makeConfig({ plugins: ["./local-source.mjs"] });
    const { sources, failures } = await loadPlugins(config, pluginFixtureDir);
    expect(failures).toEqual([]);
    expect(sources).toHaveLength(1);
    expect(sources[0]?.id).toBe("example-plugin-source");
  });

  it("skips a plugin whose module throws on import, without crashing", async () => {
    const config = makeConfig({ plugins: ["./broken-source.mjs"] });
    const { sources, failures } = await loadPlugins(config, pluginFixtureDir);
    expect(sources).toEqual([]);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.entry).toBe("./broken-source.mjs");
  });

  it("skips a plugin with a malformed default export (missing scan)", async () => {
    const config = makeConfig({ plugins: ["./malformed-export.mjs"] });
    const { sources, failures } = await loadPlugins(config, pluginFixtureDir);
    expect(sources).toEqual([]);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.error).toMatch(/not a valid ContextSource/);
  });

  it("skips a nonexistent module without crashing", async () => {
    const config = makeConfig({ plugins: ["./does-not-exist.mjs"] });
    const { sources, failures } = await loadPlugins(config, pluginFixtureDir);
    expect(sources).toEqual([]);
    expect(failures).toHaveLength(1);
  });

  it("isolates failures — one bad plugin doesn't block a good one", async () => {
    const config = makeConfig({ plugins: ["./broken-source.mjs", "./local-source.mjs"] });
    const { sources, failures } = await loadPlugins(config, pluginFixtureDir);
    expect(sources).toHaveLength(1);
    expect(failures).toHaveLength(1);
  });
});
