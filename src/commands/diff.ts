import { readSnapshot } from "../core/snapshot.js";
import { computeDiff, formatDiffReport } from "../report/diff-report.js";
import type { CommandResult } from "./scan.js";

export interface DiffOptions {
  maxIncrease?: number;
}

export async function runDiffCommand(
  snapshotAPath: string,
  snapshotBPath: string,
  options: DiffOptions,
): Promise<CommandResult> {
  const [before, after] = await Promise.all([
    readSnapshot(snapshotAPath),
    readSnapshot(snapshotBPath),
  ]);
  const diff = computeDiff(before, after);
  const output = formatDiffReport(diff);
  const exceeds = typeof options.maxIncrease === "number" && diff.totalDelta > options.maxIncrease;

  return { output, exitCode: exceeds ? 1 : 0 };
}
