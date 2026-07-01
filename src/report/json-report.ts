import type { RunScanResult } from "../core/scan-runner.js";
import { type ScanSnapshot, serializeSnapshot } from "../core/snapshot.js";

export interface BuildSnapshotOptions {
  homeDir: string;
  projectDir: string;
  estimatorId: string;
  generatedAt: string;
}

export function buildSnapshot(result: RunScanResult, opts: BuildSnapshotOptions): ScanSnapshot {
  return {
    version: 1,
    generatedAt: opts.generatedAt,
    target: { homeDir: opts.homeDir, projectDir: opts.projectDir },
    estimatorId: opts.estimatorId,
    items: result.items,
  };
}

export function formatJsonReport(snapshot: ScanSnapshot): string {
  return serializeSnapshot(snapshot);
}
