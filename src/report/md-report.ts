import type { ScanSnapshot } from "../core/snapshot.js";
import { formatEstTokens } from "../utils/format.js";
import { aggregateByCategory, grandTotal } from "./aggregate.js";

const CATEGORY_NOTES: Partial<Record<string, string>> = {
  mcp: "_MCP tool-schema cost is not measured without a live connection — see item warnings._",
  commands: "_Commands are loaded on invocation only — they carry no always-on (eager) cost._",
};

export function formatMarkdownReport(snapshot: ScanSnapshot): string {
  const lines: string[] = [];
  const totals = aggregateByCategory(snapshot.items);
  const grand = grandTotal(snapshot.items);

  lines.push("# Aperture Context Scan");
  lines.push("");
  lines.push(
    "> All token counts below are **estimated** (~4 chars/token heuristic), not exact BPE tokenization — Anthropic does not publish a public tokenizer.",
  );
  lines.push("");
  lines.push(`- Target: \`${snapshot.target.projectDir}\``);
  lines.push(`- Generated: ${snapshot.generatedAt}`);
  lines.push(`- **Total estimated context budget: ${formatEstTokens(grand)}**`);
  lines.push("");
  lines.push("| Category | Eager | Lazy | Total | Items |");
  lines.push("|---|---|---|---|---|");
  for (const total of totals) {
    lines.push(
      `| ${total.category} | ${formatEstTokens(total.eagerTokens)} | ${formatEstTokens(total.lazyTokens)} | ${formatEstTokens(total.totalTokens)} | ${total.itemCount} |`,
    );
  }
  lines.push("");

  for (const total of totals) {
    if (total.itemCount === 0) continue;
    lines.push(`## ${total.category}`);
    lines.push("");
    const note = CATEGORY_NOTES[total.category];
    if (note) {
      lines.push(note);
      lines.push("");
    }
    const categoryItems = snapshot.items
      .filter((item) => item.category === total.category)
      .sort(
        (a, b) => b.cost.eagerTokens + b.cost.lazyTokens - (a.cost.eagerTokens + a.cost.lazyTokens),
      );

    lines.push("| Item | Scope | Eager | Lazy |");
    lines.push("|---|---|---|---|");
    for (const item of categoryItems) {
      lines.push(
        `| ${item.label} | ${item.scope} | ${formatEstTokens(item.cost.eagerTokens)} | ${formatEstTokens(item.cost.lazyTokens)} |`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
