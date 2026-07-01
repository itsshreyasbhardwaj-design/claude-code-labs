import { Box, Text } from "ink";
import type { CategoryTotal } from "../../report/aggregate.js";
import { formatEstTokens } from "../../utils/format.js";

const BAR_WIDTH = 30;

export interface CategoryBarChartProps {
  totals: CategoryTotal[];
  selectedIndex: number;
}

/** Each bar is visually split eager (solid) vs lazy (dotted) so the core insight is never just a number. */
export function CategoryBarChart({ totals, selectedIndex }: CategoryBarChartProps) {
  const max = Math.max(1, ...totals.map((t) => t.totalTokens));

  return (
    <Box flexDirection="column">
      {totals.map((total, index) => {
        const isSelected = index === selectedIndex;
        const eagerWidth = Math.round((total.eagerTokens / max) * BAR_WIDTH);
        const lazyWidth = Math.round((total.lazyTokens / max) * BAR_WIDTH);
        const bar = "█".repeat(eagerWidth) + "▒".repeat(lazyWidth);

        return (
          <Box key={total.category}>
            <Box width={12}>
              <Text bold={isSelected} color={isSelected ? "cyan" : undefined}>
                {isSelected ? "› " : "  "}
                {total.category}
              </Text>
            </Box>
            <Box width={BAR_WIDTH + 2}>
              <Text color={total.isCoarse ? "gray" : "cyan"}>{bar || "·"}</Text>
            </Box>
            <Text dimColor>
              {" "}
              {formatEstTokens(total.totalTokens)}
              {total.isCoarse ? " (not measured)" : ""}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
