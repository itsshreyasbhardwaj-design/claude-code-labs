import { useState } from "react";
import { Box } from "ink";
import type { Category } from "../../core/types.js";
import type { CategoryTotal } from "../../report/aggregate.js";
import { CategoryBarChart } from "../components/CategoryBarChart.js";
import { Footer } from "../components/Footer.js";
import { Header } from "../components/Header.js";
import { useKeymap } from "../hooks/useKeymap.js";

export interface DashboardScreenProps {
  totals: CategoryTotal[];
  grandTotal: number;
  budgetTokens: number;
  targetPath: string;
  onSelectCategory: (category: Category) => void;
  onTrim: () => void;
  onRescan: () => void;
}

export function DashboardScreen(props: DashboardScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const count = props.totals.length;

  useKeymap({
    up: () => setSelectedIndex((i) => (count === 0 ? 0 : (i - 1 + count) % count)),
    down: () => setSelectedIndex((i) => (count === 0 ? 0 : (i + 1) % count)),
    select: () => {
      const total = props.totals[selectedIndex];
      if (total) props.onSelectCategory(total.category);
    },
    char: (char) => {
      if (char === "t") props.onTrim();
      if (char === "r") props.onRescan();
    },
  });

  return (
    <Box flexDirection="column">
      <Header
        targetPath={props.targetPath}
        totalTokens={props.grandTotal}
        budgetTokens={props.budgetTokens}
      />
      <CategoryBarChart totals={props.totals} selectedIndex={selectedIndex} />
      <Footer hints="↑↓/jk move · Enter/→ drill in · t trim suggestions · r re-scan · q quit" />
    </Box>
  );
}
