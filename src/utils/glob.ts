import picomatch from "picomatch";

/** Builds an isIgnored(absolutePath) matcher from a list of glob patterns. Empty list matches nothing. */
export function buildIgnoreMatcher(patterns: string[]): (absolutePath: string) => boolean {
  if (patterns.length === 0) return () => false;
  const isMatch = picomatch(patterns, { dot: true });
  return (absolutePath: string) => isMatch(absolutePath);
}
