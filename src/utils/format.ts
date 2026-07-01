/**
 * Every surface that prints a token number must go through this — the "~" and "(est.)"
 * markers are a hard requirement, not decoration: Aperture never claims exact token counts.
 */
export function formatEstTokens(n: number): string {
  if (n === 0) return "0 tokens (est.)";
  if (n < 1000) return `~${n} tokens (est.)`;
  const k = n / 1000;
  const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
  return `~${rounded}k tokens (est.)`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${Math.round(kb * 10) / 10} KB`;
  return `${Math.round((kb / 1024) * 10) / 10} MB`;
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return n === 1 ? singular : plural;
}
