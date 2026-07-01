/**
 * When projectDir resolves to the same directory as homeDir (or otherwise overlaps it), a
 * source's global and project glob patterns can resolve to the exact same physical file.
 * Deduping by path keeps the first occurrence (global sources are listed before project
 * sources in every source's scan order), preventing double-counted items.
 */
export function dedupeByPath<T extends { path: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.path)) continue;
    seen.add(item.path);
    result.push(item);
  }
  return result;
}
