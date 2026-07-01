import { join } from "node:path";
import { coarseCost } from "../core/cost.js";
import { globalClaudeDir, globalClaudeJsonPath } from "../core/paths.js";
import type { ContextItem, ContextSource, ScanContext, Scope } from "../core/types.js";
import { dedupeByPath } from "../utils/dedupe.js";
import { readFileSafe } from "../utils/fs-safe.js";

interface McpServerConfig {
  command?: string;
  args?: unknown[];
  env?: Record<string, unknown>;
}

interface McpFileRef {
  path: string;
  scope: Scope;
}

async function readMcpServers(path: string): Promise<Record<string, McpServerConfig> | undefined> {
  const raw = await readFileSafe(path);
  if (raw === undefined) return undefined;
  try {
    const parsed = JSON.parse(raw) as { mcpServers?: Record<string, McpServerConfig> };
    return parsed.mcpServers;
  } catch {
    return undefined;
  }
}

const NOT_MEASURED_WARNING =
  "tool schema cost not measured — requires a live connection (planned as a future --live mode)";

/**
 * MCP server tool schemas can only be measured precisely by connecting to each server —
 * something Aperture deliberately does not do in v1 (no network calls). Every item here is
 * a coarse placeholder: server names/count are real, but token cost is always 0, never a
 * fabricated number. `meta` never stores actual env values, only whether env vars are set,
 * since MCP configs can carry secrets.
 */
export const mcpSource: ContextSource = {
  id: "mcp",
  category: "mcp",

  async scan(ctx: ScanContext): Promise<ContextItem[]> {
    const claudeDir = globalClaudeDir(ctx.homeDir);

    const globalRefs: McpFileRef[] = [
      { path: globalClaudeJsonPath(ctx.homeDir), scope: "global" },
      { path: join(claudeDir, "settings.json"), scope: "global" },
    ];
    const projectRefs: McpFileRef[] = [
      { path: join(ctx.projectDir, ".mcp.json"), scope: "project" },
      { path: join(ctx.projectDir, ".claude", "settings.json"), scope: "project" },
      { path: join(ctx.projectDir, ".claude", "settings.local.json"), scope: "project" },
    ];

    const seen = new Map<
      string,
      { config: McpServerConfig; scope: Scope; filePath: string; duplicateSources: string[] }
    >();

    for (const ref of dedupeByPath([...globalRefs, ...projectRefs])) {
      if (ctx.isIgnored(ref.path)) continue;
      const servers = await readMcpServers(ref.path);
      if (!servers) continue;

      for (const [name, config] of Object.entries(servers)) {
        const existing = seen.get(name);
        if (!existing) {
          seen.set(name, { config, scope: ref.scope, filePath: ref.path, duplicateSources: [] });
        } else if (JSON.stringify(existing.config) !== JSON.stringify(config)) {
          existing.duplicateSources.push(ref.path);
        }
      }
    }

    const items: ContextItem[] = [];
    for (const [name, entry] of seen.entries()) {
      items.push({
        id: `mcp:${entry.scope}:${name}`,
        category: "mcp",
        sourceId: mcpSource.id,
        label: name,
        filePath: entry.filePath,
        scope: entry.scope,
        cost: coarseCost(),
        meta: {
          command: entry.config.command,
          hasEnv: Boolean(entry.config.env && Object.keys(entry.config.env).length > 0),
          argsCount: entry.config.args?.length ?? 0,
          conflictingDefinitionsIn:
            entry.duplicateSources.length > 0 ? entry.duplicateSources : undefined,
        },
        warnings: [NOT_MEASURED_WARNING],
      });
    }

    return items;
  },
};
