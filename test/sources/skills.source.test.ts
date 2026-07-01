import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { skillsSource } from "../../src/sources/skills.source.js";
import { fixture, makeContext } from "../helpers.js";

describe("skillsSource", () => {
  it("finds global, project, and plugin-scoped skills", async () => {
    const home = fixture("kitchen-sink", "home");
    const project = fixture("kitchen-sink", "project");
    const ctx = makeContext(home, project);

    const items = await skillsSource.scan(ctx);
    const byScope = {
      global: items.filter((i) => i.scope === "global"),
      project: items.filter((i) => i.scope === "project"),
      plugin: items.filter((i) => i.scope === "plugin"),
    };

    expect(byScope.global.map((i) => i.label).sort()).toEqual(["pdf-fill", "seo-audit"]);
    expect(byScope.project.map((i) => i.label)).toEqual(["local-skill"]);
    expect(byScope.plugin.map((i) => i.label)).toEqual(["seo-audit"]);
    expect(byScope.plugin[0]?.pluginName).toBe("acme-pack/growth-tools");
  });

  it("splits eager (name: description) from lazy (body) cost correctly", async () => {
    const home = fixture("kitchen-sink", "home");
    const ctx = makeContext(home, home);
    const items = await skillsSource.scan(ctx);

    const pdfFill = items.find((i) => i.label === "pdf-fill");
    expect(pdfFill).toBeDefined();

    const raw = readFileSync(pdfFill!.filePath!, "utf-8");
    const { data, content } = matter(raw);
    const expectedEager = `${data.name}: ${data.description}`;

    expect(pdfFill!.cost.eagerChars).toBe(expectedEager.length);
    expect(pdfFill!.cost.lazyChars).toBe(content.length);
    expect(pdfFill!.meta?.hasVersion).toBe(true);
    expect(pdfFill!.meta?.descriptionLength).toBe(data.description.length);
  });

  it("records a warning instead of throwing on invalid frontmatter YAML", async () => {
    const home = fixture("malformed-frontmatter", "home");
    const ctx = makeContext(home, home);
    const items = await skillsSource.scan(ctx);

    expect(items).toHaveLength(1);
    const broken = items[0]!;
    expect(broken.warnings).toContain("invalid frontmatter YAML");
    expect(broken.warnings).toContain("missing description");
    expect(broken.cost.eagerChars).toBe(0);
  });
});
