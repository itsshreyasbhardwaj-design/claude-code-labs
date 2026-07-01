import { Box, Text } from "ink";
import type { ContextItem } from "../../core/types.js";
import { formatEstTokens } from "../../utils/format.js";

export interface ItemTableProps {
  items: ContextItem[];
  selectedIndex: number;
}

export function ItemTable({ items, selectedIndex }: ItemTableProps) {
  return (
    <Box flexDirection="column">
      <Box>
        <Box width={30}>
          <Text bold underline>
            Item
          </Text>
        </Box>
        <Box width={10}>
          <Text bold underline>
            Scope
          </Text>
        </Box>
        <Box width={18}>
          <Text bold underline>
            Eager
          </Text>
        </Box>
        <Box width={18}>
          <Text bold underline>
            Lazy
          </Text>
        </Box>
      </Box>
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box key={item.id}>
            <Box width={30}>
              <Text color={isSelected ? "cyan" : undefined} bold={isSelected}>
                {isSelected ? "› " : "  "}
                {item.label}
              </Text>
            </Box>
            <Box width={10}>
              <Text dimColor>{item.scope}</Text>
            </Box>
            <Box width={18}>
              <Text>{formatEstTokens(item.cost.eagerTokens)}</Text>
            </Box>
            <Box width={18}>
              <Text>{formatEstTokens(item.cost.lazyTokens)}</Text>
            </Box>
          </Box>
        );
      })}
      {items.length === 0 ? <Text dimColor>No items in this category.</Text> : null}
    </Box>
  );
}
