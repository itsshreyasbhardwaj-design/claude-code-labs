import { readFile, writeFile } from "node:fs/promises";
import type { ContextItem } from "./types.js";

export interface ScanSnapshot {
  version: 1;
  generatedAt: string;
  target: { homeDir: string; projectDir: string };
  estimatorId: string;
  items: ContextItem[];
}

export function serializeSnapshot(snapshot: ScanSnapshot): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

export async function writeSnapshot(path: string, snapshot: ScanSnapshot): Promise<void> {
  await writeFile(path, serializeSnapshot(snapshot), "utf-8");
}

export async function readSnapshot(path: string): Promise<ScanSnapshot> {
  const raw = await readFile(path, "utf-8");
  const parsed = JSON.parse(raw) as ScanSnapshot;
  if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
    throw new Error(`${path} does not look like a valid Aperture scan snapshot`);
  }
  return parsed;
}

export function parseSnapshot(raw: string): ScanSnapshot {
  const parsed = JSON.parse(raw) as ScanSnapshot;
  if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
    throw new Error("not a valid Aperture scan snapshot");
  }
  return parsed;
}
