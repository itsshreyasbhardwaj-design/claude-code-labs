import { useEffect, useState } from "react";
import { type RunScanResult, runScan } from "../../core/scan-runner.js";
import type { ApertureConfig } from "../../core/types.js";

export interface UseScanDataOptions {
  homeDir: string;
  projectDir: string;
  config: ApertureConfig;
}

export type ScanState =
  | { status: "loading" }
  | { status: "ready"; result: RunScanResult }
  | { status: "error"; message: string };

export function useScanData(options: UseScanDataOptions): { state: ScanState; rescan: () => void } {
  const [state, setState] = useState<ScanState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce intentionally forces a re-scan on rescan()
  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    runScan({ homeDir: options.homeDir, projectDir: options.projectDir, config: options.config })
      .then((result) => {
        if (!cancelled) setState({ status: "ready", result });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [options.homeDir, options.projectDir, options.config, nonce]);

  return { state, rescan: () => setNonce((n) => n + 1) };
}
