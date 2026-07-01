import { join } from "node:path";
import { computeCost } from "../core/cost.js";
import { parseFrontmatter, stringField } from "../core/markdown.js";
import { globalClaudeDir, pluginNameFromPath } from "../core/paths.js";
import type { ContextItem, ContextSource, ScanContext, Scope } from "../core/types.js";
import { dedupeByPath } from "../utils/dedupe.js";
import { readFileSafe, readdirSafe } from "../utils/fs-safe.js";
import fg from "fast-glob";

interface FoundFile {
  path: string;
  scope: Scope;
  pluginName?: string;
}

async function findAgentFiles(ctx: ScanContext): Promise<FoundFile[]> {
  const claudeDir = globalClaudeDir(ctx.homeDir);
  const found: FoundFile[] = [];

  const globalDir = join(claudeDir, "agents");
  const globalNames = await readdirSafe(globalDir);
  for (const name of globalNames) {
    if (name.endsWith(".md")) found.push({ path: join(globalDir, name), scope: "global" });
  }

  const projectDir = join(ctx.projectDir, ".claude", "agents");
  const projectNames = await readdirSafe(projectDir);
  for (const name of projectNames) {
    if (name.endsWith(".md")) found.push({ path: join(projectDir, name), scope: "project" });
  }

  const pluginMatches = await fg("plugins/*/*/agents/*.md", { cwd: claudeDir, absolute: true });
  for (const path of pluginMatches) {
    found.push({ path, scope: "plugin", pluginName: pluginNameFromPath(path, claudeDir) });
  }

  return dedupeByPath(found).filter((f) => !ctx.isIgnored(f.path));
}

/**
 * An agent's `name`+`description` frontmatter is rendered into the "Available agent types"
 * listing any time the Agent tool is available — that's the eager cost, present in every
 * relevant system prompt regardless of whether the agent is ever used. The body (its full
 * personality/instructions) is only loaded if that agent is actually spawned — lazy cost.
 *
 * Real-world scale check: one machine had 232 flat files here. Every file is parsed in
 * isolation — one malformed file must never abort the other 231.
 */
export const agentsSource: ContextSource = {
  id: "agents",
  category: "agents",

  async scan(ctx: ScanContext): Promise<ContextItem[]> {
    const files = await findAgentFiles(ctx);
    const items: ContextItem[] = [];

    for (const file of files) {
      const raw = await readFileSafe(file.path);
      if (raw === undefined) continue;

      const { data, body, frontmatterError } = parseFrontmatter(raw);
      const fileStem = file.path.split("/").pop()?.replace(/\.md$/, "") ?? "unknown";
      const name = stringField(data, "name") ?? fileStem;
      const description = stringField(data, "description");

      const warnings: string[] = [];
      if (frontmatterError) warnings.push("invalid frontmatter YAML");
      if (!description) warnings.push("missing description");

      const eagerText = description ? `${name}: ${description}` : "";

      // Non-standard extras (color/emoji/vibe/etc.) are recorded for visibility but never
      // counted toward cost — they aren't part of what the Agent tool listing renders.
      const knownKeys = new Set(["name", "description"]);
      const extraFrontmatterKeys = Object.keys(data).filter((k) => !knownKeys.has(k));

      items.push({
        id: `agents:${file.scope}:${name}:${file.path}`,
        category: "agents",
        sourceId: agentsSource.id,
        label: name,
        filePath: file.path,
        scope: file.scope,
        pluginName: file.pluginName,
        cost: computeCost(ctx.estimator, eagerText, body, "eager"),
        meta: {
          descriptionLength: description?.length ?? 0,
          extraFrontmatterKeys,
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    }

    return items;
  },
};
