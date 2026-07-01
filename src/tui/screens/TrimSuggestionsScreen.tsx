import { Box, Text } from "ink";
import { computeWarnings } from "../../report/doctor-report.js";
import type { ApertureConfig, ContextItem } from "../../core/types.js";
import { Footer } from "../components/Footer.js";
import { useKeymap } from "../hooks/useKeymap.js";

export interface TrimSuggestionsScreenProps {
  items: ContextItem[];
  config: ApertureConfig;
  onBack: () => void;
}

/** Shares computeWarnings with `aperture doctor` so the two surfaces never drift out of sync. */
export function TrimSuggestionsScreen({ items, config, onBack }: TrimSuggestionsScreenProps) {
  const warnings = computeWarnings(items, config);
  useKeymap({ back: onBack });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Trim suggestions
      </Text>
      {warnings.length === 0 ? (
        <Text dimColor>No issues found.</Text>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {warnings.map((warning) => (
            <Text
              key={`${warning.severity}:${warning.message}`}
              color={warning.severity === "warn" ? "yellow" : undefined}
            >
              {warning.severity === "warn" ? "! " : "· "}
              {warning.message}
            </Text>
          ))}
        </Box>
      )}
      <Footer hints="Esc/← back · q quit" />
    </Box>
  );
}
