import type { Category, ContextItem } from "../core/types.js";

export interface CategoryTotal {
  category: Category;
  eagerTokens: number;
  lazyTokens: number;
  totalTokens: number;
  itemCount: number;
  isCoarse: boolean;
}

const ALL_CATEGORIES: Category[] = ["claude-md", "skills", "agents", "commands", "mcp", "settings"];

export function itemTotal(item: ContextItem): number {
  return item.cost.eagerTokens + item.cost.lazyTokens;
}

/** Always returns one entry per known category (zeroed if absent), sorted descending by total. */
export function aggregateByCategory(items: ContextItem[]): CategoryTotal[] {
  const totals = new Map<Category, CategoryTotal>(
    ALL_CATEGORIES.map((category) => [
      category,
      { category, eagerTokens: 0, lazyTokens: 0, totalTokens: 0, itemCount: 0, isCoarse: true },
    ]),
  );

  for (const item of items) {
    const entry = totals.get(item.category);
    if (!entry) continue;
    entry.eagerTokens += item.cost.eagerTokens;
    entry.lazyTokens += item.cost.lazyTokens;
    entry.totalTokens += itemTotal(item);
    entry.itemCount += 1;
    entry.isCoarse = entry.isCoarse && item.cost.isCoarseEstimate;
  }

  return [...totals.values()].sort((a, b) => b.totalTokens - a.totalTokens);
}

export function grandTotal(items: ContextItem[]): number {
  return items.reduce((sum, item) => sum + itemTotal(item), 0);
}

export function topOffenders(items: ContextItem[], n = 3): ContextItem[] {
  return [...items].sort((a, b) => itemTotal(b) - itemTotal(a)).slice(0, n);
}
