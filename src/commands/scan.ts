import Table from "cli-table3";
import chalk from "chalk";
import { runScan } from "../core/scan-runner.js";
import { aggregateByCategory, grandTotal } from "../report/aggregate.js";
import { buildSnapshot, formatJsonReport } from "../report/json-report.js";
import { formatMarkdownReport } from "../report/md-report.js";
import { formatEstTokens } from "../utils/format.js";
import { resolveTarget } from "./shared.js";

export interface ScanOptions {
  json?: boolean;
  md?: boolean;
  home?: string;
}

export interface CommandResult {
  output: string;
  exitCode: number;
}

export async function runScanCommand(
  dir: string | undefined,
  options: ScanOptions,
): Promise<CommandResult> {
  const target = await resolveTarget(dir, options.home);
  const result = await runScan({
    homeDir: target.homeDir,
    projectDir: target.projectDir,
    config: target.config,
  });

  const snapshot = buildSnapshot(result, {
    homeDir: target.homeDir,
    projectDir: target.projectDir,
    estimatorId: target.config.estimator,
    generatedAt: new Date().toISOString(),
  });

  if (options.json) {
    return { output: formatJsonReport(snapshot), exitCode: 0 };
  }
  if (options.md) {
    return { output: formatMarkdownReport(snapshot), exitCode: 0 };
  }

  const totals = aggregateByCategory(result.items);
  const grand = grandTotal(result.items);

  const lines: string[] = [];
  lines.push(chalk.bold(`Aperture scan: ${target.projectDir}`));
  lines.push(chalk.dim("All numbers are estimated (~4 chars/token heuristic), not exact."));
  lines.push("");

  const table = new Table({ head: ["Category", "Eager", "Lazy", "Total", "Items"] });
  for (const total of totals) {
    table.push([
      total.category,
      formatEstTokens(total.eagerTokens),
      formatEstTokens(total.lazyTokens),
      formatEstTokens(total.totalTokens),
      String(total.itemCount),
    ]);
  }
  lines.push(table.toString());
  lines.push("");
  lines.push(chalk.bold(`Total estimated context budget: ${formatEstTokens(grand)}`));

  if (result.sourceErrors.length > 0) {
    lines.push("");
    lines.push(
      chalk.yellow(
        `${result.sourceErrors.length} source(s) failed: ${result.sourceErrors.map((e) => e.sourceId).join(", ")}`,
      ),
    );
  }
  if (result.pluginFailures.length > 0) {
    lines.push(
      chalk.yellow(
        `${result.pluginFailures.length} plugin(s) failed to load: ${result.pluginFailures.map((f) => f.entry).join(", ")}`,
      ),
    );
  }

  return { output: `${lines.join("\n")}\n`, exitCode: 0 };
}
