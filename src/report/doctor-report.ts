import type { ApertureConfig, ContextItem } from "../core/types.js";

export type WarningSeverity = "warn" | "info";

export interface Warning {
  severity: WarningSeverity;
  message: string;
  itemId?: string;
}

const DESCRIPTION_WARN_CHARS = 600;

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2) : sorted[mid]!;
}

function descriptionLength(item: ContextItem): number {
  const value = item.meta?.descriptionLength;
  return typeof value === "number" ? value : 0;
}

/**
 * Pure, deterministic rule engine shared by `aperture doctor` and the TUI's trim-suggestions
 * panel — the two surfaces must never drift out of sync on what counts as a warning.
 */
export function computeWarnings(items: ContextItem[], config: ApertureConfig): Warning[] {
  const warnings: Warning[] = [];

  for (const item of items) {
    if (item.category === "claude-md" && item.cost.eagerChars > config.claudeMdWarnBytes) {
      warnings.push({
        severity: "warn",
        itemId: item.id,
        message: `${item.label} is ${item.cost.eagerChars} bytes — over your configured ${config.claudeMdWarnBytes} byte warn threshold.`,
      });
    }
  }

  for (const category of ["skills", "agents"] as const) {
    const byLabel = new Map<string, ContextItem[]>();
    for (const item of items) {
      if (item.category !== category) continue;
      const list = byLabel.get(item.label) ?? [];
      list.push(item);
      byLabel.set(item.label, list);
    }
    for (const [label, group] of byLabel) {
      const origins = new Set(group.map((item) => item.pluginName ?? item.scope));
      if (origins.size > 1) {
        warnings.push({
          severity: "warn",
          message: `${group.length} ${category} share the name "${label}" across ${[...origins].join(", ")} — Claude Code will only load one; check for unintended shadowing.`,
        });
      }
    }
  }

  for (const category of ["skills", "agents"] as const) {
    const categoryItems = items.filter((item) => item.category === category);
    const med = median(categoryItems.map(descriptionLength).filter((n) => n > 0));
    for (const item of categoryItems) {
      const len = descriptionLength(item);
      if (len > DESCRIPTION_WARN_CHARS) {
        warnings.push({
          severity: "info",
          itemId: item.id,
          message: `${category === "agents" ? "Agent" : "Skill"} "${item.label}" description is ${len} chars — consider shortening (median across your ${category} is ${med} chars).`,
        });
      }
    }
  }

  const mcpItems = items.filter((item) => item.category === "mcp");
  if (mcpItems.length > 0) {
    warnings.push({
      severity: "info",
      message: `${mcpItems.length} MCP ${mcpItems.length === 1 ? "server" : "servers"} configured (${mcpItems.map((i) => i.label).join(", ")}) — tool schema cost not measured without a live connection.`,
    });
  }

  return warnings;
}

export function formatDoctorReport(warnings: Warning[]): string {
  if (warnings.length === 0) return "No issues found.\n";

  const lines: string[] = [];
  const warnCount = warnings.filter((w) => w.severity === "warn").length;
  const infoCount = warnings.filter((w) => w.severity === "info").length;
  lines.push(`${warnCount} warning(s), ${infoCount} info note(s):\n`);

  for (const warning of warnings) {
    const tag = warning.severity === "warn" ? "[warn]" : "[info]";
    lines.push(`${tag} ${warning.message}`);
  }

  return `${lines.join("\n")}\n`;
}
