import { describe, expect, it } from "vitest";
import { parseFrontmatter, stringField } from "../../../src/core/markdown.js";

describe("parseFrontmatter", () => {
  it("parses valid frontmatter into data + body", () => {
    const raw = "---\nname: foo\ndescription: bar\n---\n\n# Body\n\nHello.";
    const parsed = parseFrontmatter(raw);
    expect(parsed.frontmatterError).toBe(false);
    expect(parsed.data.name).toBe("foo");
    expect(parsed.data.description).toBe("bar");
    expect(parsed.body.trim()).toBe("# Body\n\nHello.");
  });

  it("falls back to raw content without throwing on invalid YAML", () => {
    const raw = '---\nname: foo\ndescription: "unterminated\n---\nBody';
    const parsed = parseFrontmatter(raw);
    expect(parsed.frontmatterError).toBe(true);
    expect(parsed.data).toEqual({});
    expect(parsed.body).toBe(raw);
  });

  it("handles a file with no frontmatter block at all", () => {
    const raw = "Just plain markdown, no frontmatter.";
    const parsed = parseFrontmatter(raw);
    expect(parsed.frontmatterError).toBe(false);
    expect(parsed.data).toEqual({});
    expect(parsed.body.trim()).toBe(raw);
  });
});

describe("stringField", () => {
  it("returns the value when it is a string", () => {
    expect(stringField({ name: "foo" }, "name")).toBe("foo");
  });

  it("returns undefined for missing or non-string fields", () => {
    expect(stringField({}, "name")).toBeUndefined();
    expect(stringField({ name: 42 }, "name")).toBeUndefined();
  });
});
