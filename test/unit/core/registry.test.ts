import { describe, expect, it } from "vitest";
import { SourceRegistry, createDefaultRegistry } from "../../../src/core/registry.js";
import type { ContextSource } from "../../../src/core/types.js";

function fakeSource(id: string): ContextSource {
  return {
    id,
    category: "settings",
    async scan() {
      return [];
    },
  };
}

describe("SourceRegistry", () => {
  it("starts empty", () => {
    const registry = new SourceRegistry();
    expect(registry.list()).toEqual([]);
    expect(registry.get("anything")).toBeUndefined();
  });

  it("registers and retrieves sources by id", () => {
    const registry = new SourceRegistry();
    const source = fakeSource("a");
    registry.register(source);
    expect(registry.get("a")).toBe(source);
    expect(registry.list()).toEqual([source]);
  });

  it("throws on duplicate id registration", () => {
    const registry = new SourceRegistry();
    registry.register(fakeSource("dup"));
    expect(() => registry.register(fakeSource("dup"))).toThrow(/already registered/);
  });
});

describe("createDefaultRegistry", () => {
  it("registers exactly the 6 built-in sources", () => {
    const registry = createDefaultRegistry();
    const ids = registry
      .list()
      .map((s) => s.id)
      .sort();
    expect(ids).toEqual(["agents", "claude-md", "commands", "mcp", "settings", "skills"]);
  });
});
