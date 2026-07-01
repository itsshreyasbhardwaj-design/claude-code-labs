import { Text } from "ink";
import Spinner from "ink-spinner";

export function LoadingSpinner({ label }: { label: string }) {
  return (
    <Text>
      <Text color="cyan">
        <Spinner type="dots" />
      </Text>{" "}
      {label}
    </Text>
  );
}
