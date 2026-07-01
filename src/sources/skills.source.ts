import { join } from "node:path";
import fg from "fast-glob";
import { computeCost } from "../core/cost.js";
import { parseFrontmatter, stringField } from "../core/markdown.js";
import { globalClaudeDir, pluginNameFromPath } from "../core/paths.js";
import type { ContextItem, ContextSource, ScanContext, Scope } from "../core/types.js";
import { dedupeByPath } from "../utils/dedupe.js";
import { readFileSafe } from "../utils/fs-safe.js";

interface FoundFile {
  path: string;
  scope: Scope;
  pluginName?: string;
}

async function findSkillFiles(ctx: ScanContext): Promise<FoundFile[]> {
  const claudeDir = globalClaudeDir(ctx.homeDir);
  const found: FoundFile[] = [];

  const globalMatches = await fg("skills/*/SKILL.md", { cwd: claudeDir, absolute: true });
  found.push(...globalMatches.map((path) => ({ path, scope: "global" as const })));

  const projectRoot = join(ctx.projectDir, ".claude");
  const projectMatches = await fg("skills/*/SKILL.md", { cwd: projectRoot, absolute: true });
  found.push(...projectMatches.map((path) => ({ path, scope: "project" as const })));

  const pluginMatches = await fg("plugins/*/*/skills/*/SKILL.md", {
    cwd: claudeDir,
    absolute: true,
  });
  found.push(
    ...pluginMatches.map((path) => ({
      path,
      scope: "plugin" as const,
      pluginName: pluginNameFromPath(path, claudeDir),
    })),
  );

  return dedupeByPath(found).filter((f) => !ctx.isIgnored(f.path));
}

/**
 * A skill's `name`+`description` frontmatter is what Claude Code renders in the available-skills
 * listing to decide whether to invoke it — that's the eager cost. The body (instructions) is
 * only loaded once the Skill tool actually invokes it — that's the lazy cost.
 */
export const skillsSource: ContextSource = {
  id: "skills",
  category: "skills",

  async scan(ctx: ScanContext): Promise<ContextItem[]> {
    const files = await findSkillFiles(ctx);
    const items: ContextItem[] = [];

    for (const file of files) {
      const raw = await readFileSafe(file.path);
      if (raw === undefined) continue;

      const { data, body, frontmatterError } = parseFrontmatter(raw);
      const dirName = file.path.split("/").slice(-2, -1)[0] ?? "unknown";
      const name = stringField(data, "name") ?? dirName;
      const description = stringField(data, "description");

      const warnings: string[] = [];
      if (frontmatterError) warnings.push("invalid frontmatter YAML");
      if (!description) warnings.push("missing description");

      const eagerText = description ? `${name}: ${description}` : "";
      const metadata = data.metadata as Record<string, unknown> | undefined;

      items.push({
        id: `skills:${file.scope}:${name}:${file.path}`,
        category: "skills",
        sourceId: skillsSource.id,
        label: name,
        filePath: file.path,
        scope: file.scope,
        pluginName: file.pluginName,
        cost: computeCost(ctx.estimator, eagerText, body, "eager"),
        meta: {
          hasVersion: typeof metadata?.version === "string",
          descriptionLength: description?.length ?? 0,
          frontmatterKeys: Object.keys(data),
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    }

    return items;
  },
};
