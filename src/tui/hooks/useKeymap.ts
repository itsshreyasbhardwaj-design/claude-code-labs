import { useInput } from "ink";

export interface KeyHandlerMap {
  up?: () => void;
  down?: () => void;
  /** Enter or right arrow */
  select?: () => void;
  /** Left arrow or Escape */
  back?: () => void;
  char?: (char: string) => void;
}

/** Centralizes useInput handling so every screen declares a small map instead of scattered ad-hoc logic. */
export function useKeymap(handlers: KeyHandlerMap, isActive = true): void {
  useInput(
    (input, key) => {
      if (key.upArrow || input === "k") {
        handlers.up?.();
        return;
      }
      if (key.downArrow || input === "j") {
        handlers.down?.();
        return;
      }
      if (key.return || key.rightArrow) {
        handlers.select?.();
        return;
      }
      if (key.leftArrow || key.escape) {
        handlers.back?.();
        return;
      }
      if (input) handlers.char?.(input);
    },
    { isActive },
  );
}
