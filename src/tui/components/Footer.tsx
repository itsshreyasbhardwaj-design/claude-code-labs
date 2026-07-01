import { Box, Text } from "ink";

export function Footer({ hints }: { hints: string }) {
  return (
    <Box marginTop={1}>
      <Text dimColor>{hints}</Text>
    </Box>
  );
}
