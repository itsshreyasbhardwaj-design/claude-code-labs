import { runScan } from "../core/scan-runner.js";
import { computeWarnings, formatDoctorReport } from "../report/doctor-report.js";
import type { CommandResult } from "./scan.js";
import { resolveTarget } from "./shared.js";

export interface DoctorOptions {
  home?: string;
  failOnWarn?: boolean;
}

export async function runDoctorCommand(
  dir: string | undefined,
  options: DoctorOptions,
): Promise<CommandResult> {
  const target = await resolveTarget(dir, options.home);
  const result = await runScan({
    homeDir: target.homeDir,
    projectDir: target.projectDir,
    config: target.config,
  });

  const warnings = computeWarnings(result.items, target.config);
  const output = formatDoctorReport(warnings);
  const hasWarnLevel = warnings.some((w) => w.severity === "warn");

  return { output, exitCode: options.failOnWarn && hasWarnLevel ? 1 : 0 };
}
