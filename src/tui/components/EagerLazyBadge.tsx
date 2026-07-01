import { Text } from "ink";

export type BadgeKind = "eager" | "lazy" | "coarse";

const LABELS: Record<BadgeKind, string> = { eager: "[E]", lazy: "[L]", coarse: "[~]" };
const COLORS: Record<BadgeKind, string> = { eager: "cyan", lazy: "gray", coarse: "yellow" };

/** Reused next to every token number so the eager-vs-lazy distinction is never just a bare number. */
export function EagerLazyBadge({ kind }: { kind: BadgeKind }) {
  return <Text color={COLORS[kind]}>{LABELS[kind]}</Text>;
}
