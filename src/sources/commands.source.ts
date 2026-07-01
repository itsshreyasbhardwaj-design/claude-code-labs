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
  /** path relative to the commands root this file was found under, e.g. "foo/bar.md" */
  relPath: string;
}

async function findCommandFiles(ctx: ScanContext): Promise<FoundFile[]> {
  const claudeDir = globalClaudeDir(ctx.homeDir);
  const found: FoundFile[] = [];

  const globalRoot = join(claudeDir, "commands");
  const globalMatches = await fg("**/*.md", { cwd: globalRoot, absolute: false });
  found.push(
    ...globalMatches.map((relPath) => ({
      path: join(globalRoot, relPath),
      scope: "global" as const,
      relPath,
    })),
  );

  const projectRoot = join(ctx.projectDir, ".claude", "commands");
  const projectMatches = await fg("**/*.md", { cwd: projectRoot, absolute: false });
  found.push(
    ...projectMatches.map((relPath) => ({
      path: join(projectRoot, relPath),
      scope: "project" as const,
      relPath,
    })),
  );

  const pluginMatches = await fg("plugins/*/*/commands/**/*.md", {
    cwd: claudeDir,
    absolute: true,
  });
  for (const path of pluginMatches) {
    const pluginName = pluginNameFromPath(path, claudeDir);
    const marker = "/commands/";
    const idx = path.indexOf(marker);
    const relPath = idx >= 0 ? path.slice(idx + marker.length) : path;
    found.push({ path, scope: "plugin", pluginName, relPath });
  }

  return dedupeByPath(found).filter((f) => !ctx.isIgnored(f.path));
}

function nameFromRelPath(relPath: string): string {
  return relPath.replace(/\.md$/, "").split("/").join(":");
}

/**
 * Slash commands have no `name` frontmatter field — the invocable name is derived from the
 * file path. Unlike skills/agents, a command's content is never rendered as an always-on
 * listing; it's only pulled into context the moment a user types `/command-name`. So the
 * *entire file* (frontmatter + body) counts as lazy cost, and eager cost is always zero.
 */
export const commandsSource: ContextSource = {
  id: "commands",
  category: "commands",

  async scan(ctx: ScanContext): Promise<ContextItem[]> {
    const files = await findCommandFiles(ctx);
    const items: ContextItem[] = [];

    for (const file of files) {
      const raw = await readFileSafe(file.path);
      if (raw === undefined) continue;

      const { data, frontmatterError } = parseFrontmatter(raw);
      const description = stringField(data, "description");
      const argumentHint = stringField(data, "argument-hint");
      const name = nameFromRelPath(file.relPath);

      items.push({
        id: `commands:${file.scope}:${name}:${file.path}`,
        category: "commands",
        sourceId: commandsSource.id,
        label: `/${name}`,
        filePath: file.path,
        scope: file.scope,
        pluginName: file.pluginName,
        cost: computeCost(ctx.estimator, "", raw, "lazy"),
        meta: { description, argumentHint },
        warnings: frontmatterError ? ["invalid frontmatter YAML"] : undefined,
      });
    }

    return items;
  },
};
