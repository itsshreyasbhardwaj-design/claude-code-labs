import matter from "gray-matter";

export interface ParsedMarkdown {
  data: Record<string, unknown>;
  body: string;
  /** true if the frontmatter block existed but failed to parse as YAML */
  frontmatterError: boolean;
}

/**
 * Wraps gray-matter so a malformed YAML frontmatter block never throws — callers get back
 * the raw content as the body plus a flag they can turn into an item-level warning instead
 * of aborting an entire scan over one bad file.
 */
export function parseFrontmatter(raw: string): ParsedMarkdown {
  try {
    const parsed = matter(raw);
    return { data: parsed.data ?? {}, body: parsed.content ?? "", frontmatterError: false };
  } catch {
    return { data: {}, body: raw, frontmatterError: true };
  }
}

export function stringField(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" ? value : undefined;
}
