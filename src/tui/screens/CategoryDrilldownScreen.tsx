import { useState } from "react";
import { Box, Text } from "ink";
import type { Category, ContextItem } from "../../core/types.js";
import { formatEstTokens } from "../../utils/format.js";
import { Footer } from "../components/Footer.js";
import { ItemTable } from "../components/ItemTable.js";
import { useKeymap } from "../hooks/useKeymap.js";

export interface CategoryDrilldownScreenProps {
  category: Category;
  items: ContextItem[];
  onBack: () => void;
}

const CATEGORY_NOTES: Partial<Record<Category, string>> = {
  mcp: "MCP tool-schema cost is not measured without a live connection.",
  commands: "Commands are loaded on invocation only — no always-on (eager) cost.",
};

export function CategoryDrilldownScreen({ category, items, onBack }: CategoryDrilldownScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const count = items.length;
  const note = CATEGORY_NOTES[category];
  const selected = items[selectedIndex];

  useKeymap({
    up: () => setSelectedIndex((i) => (count === 0 ? 0 : (i - 1 + count) % count)),
    down: () => setSelectedIndex((i) => (count === 0 ? 0 : (i + 1) % count)),
    back: onBack,
  });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Dashboard › {category}
      </Text>
      {note ? <Text dimColor>{note}</Text> : null}
      <Box marginTop={1}>
        <ItemTable items={items} selectedIndex={selectedIndex} />
      </Box>
      {selected ? (
        <Box flexDirection="column" marginTop={1} borderStyle="round" paddingX={1}>
          <Text bold>{selected.label}</Text>
          {selected.filePath ? <Text dimColor>{selected.filePath}</Text> : null}
          <Text>
            scope: {selected.scope}
            {selected.pluginName ? ` (${selected.pluginName})` : ""}
          </Text>
          <Text>
            eager {formatEstTokens(selected.cost.eagerTokens)} · lazy{" "}
            {formatEstTokens(selected.cost.lazyTokens)}
          </Text>
          {selected.warnings?.length ? (
            <Text color="yellow">{selected.warnings.join("; ")}</Text>
          ) : null}
        </Box>
      ) : null}
      <Footer hints="↑↓/jk move · Esc/← back · q quit" />
    </Box>
  );
}
