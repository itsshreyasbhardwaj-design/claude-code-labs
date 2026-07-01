import { relative } from "node:path";
import { computeCost } from "../core/cost.js";
import { globalClaudeMdPath, walkUpForClaudeMd } from "../core/paths.js";
import type { ContextItem, ContextSource, ScanContext } from "../core/types.js";
import { readFileSafe } from "../utils/fs-safe.js";

/**
 * CLAUDE.md is plain markdown, no frontmatter, and Claude Code loads the full file content
 * unconditionally every session — so the whole thing counts as eager cost, no lazy portion.
 */
export const claudeMdSource: ContextSource = {
  id: "claude-md",
  category: "claude-md",

  async scan(ctx: ScanContext): Promise<ContextItem[]> {
    const items: ContextItem[] = [];

    const globalPath = globalClaudeMdPath(ctx.homeDir);
    if (!ctx.isIgnored(globalPath)) {
      const globalContent = await readFileSafe(globalPath);
      if (globalContent !== undefined) {
        items.push({
          id: "claude-md:global",
          category: "claude-md",
          sourceId: claudeMdSource.id,
          label: "CLAUDE.md (global)",
          filePath: globalPath,
          scope: "global",
          cost: computeCost(ctx.estimator, globalContent, "", "eager"),
        });
      }
    }

    const projectPaths = walkUpForClaudeMd(ctx.projectDir, ctx.homeDir);
    for (const path of projectPaths) {
      if (ctx.isIgnored(path)) continue;
      const content = await readFileSafe(path);
      if (content === undefined) continue;
      const rel = relative(ctx.projectDir, path) || "CLAUDE.md";
      items.push({
        id: `claude-md:project:${path}`,
        category: "claude-md",
        sourceId: claudeMdSource.id,
        label: `CLAUDE.md (${rel === "CLAUDE.md" ? "./" : rel})`,
        filePath: path,
        scope: "project",
        cost: computeCost(ctx.estimator, content, "", "eager"),
      });
    }

    return items;
  },
};
