import { Box, Text } from "ink";
import { formatEstTokens } from "../../utils/format.js";

export interface HeaderProps {
  targetPath: string;
  totalTokens: number;
  budgetTokens: number;
}

export function Header({ targetPath, totalTokens, budgetTokens }: HeaderProps) {
  const ratio = budgetTokens > 0 ? totalTokens / budgetTokens : 0;
  const color = ratio >= 1 ? "red" : ratio >= 0.7 ? "yellow" : "green";

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} marginBottom={1}>
      <Text bold color="cyan">
        Aperture
      </Text>
      <Text dimColor>{targetPath}</Text>
      <Text>
        Total: <Text color={color}>{formatEstTokens(totalTokens)}</Text>
        {budgetTokens > 0 ? <Text dimColor> / budget {formatEstTokens(budgetTokens)}</Text> : null}
      </Text>
    </Box>
  );
}
