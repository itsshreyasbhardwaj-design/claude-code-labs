import type { Category } from "../core/types.js";
import type { ScanSnapshot } from "../core/snapshot.js";
import { formatEstTokens } from "../utils/format.js";
import { aggregateByCategory, grandTotal } from "./aggregate.js";

export interface CategoryDelta {
  category: Category;
  beforeTokens: number;
  afterTokens: number;
  deltaTokens: number;
}

export interface DiffResult {
  categories: CategoryDelta[];
  totalBefore: number;
  totalAfter: number;
  totalDelta: number;
}

export function computeDiff(before: ScanSnapshot, after: ScanSnapshot): DiffResult {
  const beforeTotals = aggregateByCategory(before.items);
  const afterTotals = aggregateByCategory(after.items);

  const categories: CategoryDelta[] = beforeTotals.map((beforeTotal) => {
    const afterTotal = afterTotals.find((t) => t.category === beforeTotal.category);
    const afterTokens = afterTotal?.totalTokens ?? 0;
    return {
      category: beforeTotal.category,
      beforeTokens: beforeTotal.totalTokens,
      afterTokens,
      deltaTokens: afterTokens - beforeTotal.totalTokens,
    };
  });

  const totalBefore = grandTotal(before.items);
  const totalAfter = grandTotal(after.items);

  return { categories, totalBefore, totalAfter, totalDelta: totalAfter - totalBefore };
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function formatDiffReport(diff: DiffResult): string {
  const lines: string[] = [];
  lines.push("| Category | Before | After | Delta |");
  lines.push("|---|---|---|---|");
  for (const cat of diff.categories) {
    lines.push(
      `| ${cat.category} | ${formatEstTokens(cat.beforeTokens)} | ${formatEstTokens(cat.afterTokens)} | ${signed(cat.deltaTokens)} tokens (est.) |`,
    );
  }
  lines.push("");
  lines.push(
    `Total: ${formatEstTokens(diff.totalBefore)} -> ${formatEstTokens(diff.totalAfter)} (${signed(diff.totalDelta)} tokens (est.))`,
  );
  return `${lines.join("\n")}\n`;
}
