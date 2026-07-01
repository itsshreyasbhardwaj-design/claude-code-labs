import { useState } from "react";
import { Text, useApp } from "ink";
import type { ApertureConfig, Category } from "../core/types.js";
import { aggregateByCategory, grandTotal } from "../report/aggregate.js";
import { LoadingSpinner } from "./components/LoadingSpinner.js";
import { CategoryDrilldownScreen } from "./screens/CategoryDrilldownScreen.js";
import { DashboardScreen } from "./screens/DashboardScreen.js";
import { TrimSuggestionsScreen } from "./screens/TrimSuggestionsScreen.js";
import { useKeymap } from "./hooks/useKeymap.js";
import { useScanData } from "./hooks/useScanData.js";

export interface AppProps {
  homeDir: string;
  projectDir: string;
  config: ApertureConfig;
}

type Screen = { name: "dashboard" } | { name: "drilldown"; category: Category } | { name: "trim" };

export function App({ homeDir, projectDir, config }: AppProps) {
  const { state, rescan } = useScanData({ homeDir, projectDir, config });
  const [screen, setScreen] = useState<Screen>({ name: "dashboard" });
  const { exit } = useApp();

  useKeymap({
    char: (char) => {
      if (char === "q") exit();
      if (char === "d") setScreen({ name: "dashboard" });
    },
  });

  if (state.status === "loading") {
    return <LoadingSpinner label={`Scanning ${projectDir}...`} />;
  }

  if (state.status === "error") {
    return <Text color="red">Scan failed: {state.message}</Text>;
  }

  const items = state.result.items;
  const totals = aggregateByCategory(items);
  const total = grandTotal(items);

  if (screen.name === "trim") {
    return (
      <TrimSuggestionsScreen
        items={items}
        config={config}
        onBack={() => setScreen({ name: "dashboard" })}
      />
    );
  }

  if (screen.name === "drilldown") {
    const categoryItems = items
      .filter((item) => item.category === screen.category)
      .sort(
        (a, b) => b.cost.eagerTokens + b.cost.lazyTokens - (a.cost.eagerTokens + a.cost.lazyTokens),
      );
    return (
      <CategoryDrilldownScreen
        category={screen.category}
        items={categoryItems}
        onBack={() => setScreen({ name: "dashboard" })}
      />
    );
  }

  return (
    <DashboardScreen
      totals={totals}
      grandTotal={total}
      budgetTokens={config.budgetTokens}
      targetPath={projectDir}
      onSelectCategory={(category) => setScreen({ name: "drilldown", category })}
      onTrim={() => setScreen({ name: "trim" })}
      onRescan={rescan}
    />
  );
}
