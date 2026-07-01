import { join } from "node:path";
import { computeCost } from "../core/cost.js";
import { globalClaudeDir } from "../core/paths.js";
import type { ContextItem, ContextSource, ScanContext, Scope } from "../core/types.js";
import { dedupeByPath } from "../utils/dedupe.js";
import { readFileSafe } from "../utils/fs-safe.js";

interface SettingsFileRef {
  path: string;
  label: string;
  scope: Scope;
}

function extractHookMeta(data: Record<string, unknown>): {
  hookCount: number;
  hookEvents: string[];
} {
  const hooks = data.hooks;
  if (!hooks || typeof hooks !== "object") return { hookCount: 0, hookEvents: [] };
  const hookEvents = Object.keys(hooks as Record<string, unknown>);
  let hookCount = 0;
  for (const value of Object.values(hooks as Record<string, unknown>)) {
    if (Array.isArray(value)) hookCount += value.length;
  }
  return { hookCount, hookEvents };
}

/**
 * settings.json/settings.local.json content is always active (hooks, permissions, feature
 * flags) — there's no "invocation" concept the way there is for skills/agents/commands, so
 * the whole thing counts as eager cost. The `mcpServers` key is excluded from the byte count
 * here since mcp.source.ts already accounts for it — otherwise it would be double-counted.
 */
export const settingsSource: ContextSource = {
  id: "settings",
  category: "settings",

  async scan(ctx: ScanContext): Promise<ContextItem[]> {
    const claudeDir = globalClaudeDir(ctx.homeDir);
    const refs: SettingsFileRef[] = [
      { path: join(claudeDir, "settings.json"), label: "settings.json (global)", scope: "global" },
      {
        path: join(claudeDir, "settings.local.json"),
        label: "settings.local.json (global)",
        scope: "global",
      },
      {
        path: join(ctx.projectDir, ".claude", "settings.json"),
        label: "settings.json (project)",
        scope: "project",
      },
      {
        path: join(ctx.projectDir, ".claude", "settings.local.json"),
        label: "settings.local.json (project)",
        scope: "project",
      },
    ];

    const items: ContextItem[] = [];

    for (const ref of dedupeByPath(refs)) {
      if (ctx.isIgnored(ref.path)) continue;
      const raw = await readFileSafe(ref.path);
      if (raw === undefined) continue;

      let data: Record<string, unknown> = {};
      let parseError = false;
      try {
        data = JSON.parse(raw);
      } catch {
        parseError = true;
      }

      const { mcpServers: _mcpServers, ...withoutMcp } = data;
      const measuredText = parseError ? raw : JSON.stringify(withoutMcp);
      const { hookCount, hookEvents } = extractHookMeta(data);

      items.push({
        id: `settings:${ref.scope}:${ref.path}`,
        category: "settings",
        sourceId: settingsSource.id,
        label: ref.label,
        filePath: ref.path,
        scope: ref.scope,
        cost: computeCost(ctx.estimator, measuredText, "", "eager"),
        meta: { hookCount, hookEvents },
        warnings: parseError ? ["invalid JSON"] : undefined,
      });
    }

    return items;
  },
};
