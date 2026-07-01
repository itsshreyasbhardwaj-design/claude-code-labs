import { Command } from "commander";
import { runDiffCommand } from "./commands/diff.js";
import { runDoctorCommand } from "./commands/doctor.js";
import { runInitCommand } from "./commands/init.js";
import { runScanCommand } from "./commands/scan.js";
import { runTuiCommand } from "./commands/tui.js";

const KNOWN_COMMANDS = new Set(["scan", "doctor", "diff", "init", "tui", "help"]);

/**
 * `aperture` with no recognized subcommand behaves like `aperture tui` in an interactive
 * terminal, or `aperture scan` when piped/non-interactive (e.g. `aperture | cat`).
 */
function insertDefaultCommandIfNeeded(): void {
  const rawArgs = process.argv.slice(2);
  const first = rawArgs[0];
  const isHelpOrVersion =
    first === "--help" || first === "-h" || first === "--version" || first === "-V";
  if (isHelpOrVersion) return;
  if (first !== undefined && (KNOWN_COMMANDS.has(first) || first.startsWith("-"))) return;

  const defaultCommand = process.stdout.isTTY ? "tui" : "scan";
  process.argv = [...process.argv.slice(0, 2), defaultCommand, ...rawArgs];
}

insertDefaultCommandIfNeeded();

const program = new Command();
program
  .name("aperture")
  .description(
    "See exactly what Claude Code loads into every session's context, and trim the bloat.",
  )
  .version("0.1.0");

program
  .command("scan")
  .description("Scan Claude Code config and print an estimated context token budget")
  .argument("[dir]", "project directory to scan (defaults to the current directory)")
  .option("--json", "output a machine-readable JSON snapshot")
  .option("--md", "output a markdown report")
  .option("--home <dir>", "override the home directory used for scanning")
  .action(async (dir: string | undefined, opts) => {
    const { output, exitCode } = await runScanCommand(dir, opts);
    process.stdout.write(output);
    process.exitCode = exitCode;
  });

program
  .command("doctor")
  .description("Print actionable warnings only (oversized CLAUDE.md, name collisions, etc.)")
  .argument("[dir]", "project directory to scan")
  .option("--fail-on-warn", "exit non-zero if any warning-level issue is found (for CI)")
  .option("--home <dir>", "override the home directory used for scanning")
  .action(async (dir: string | undefined, opts) => {
    const { output, exitCode } = await runDoctorCommand(dir, {
      home: opts.home,
      failOnWarn: Boolean(opts.failOnWarn),
    });
    process.stdout.write(output);
    process.exitCode = exitCode;
  });

program
  .command("diff")
  .description("Compare two `scan --json` snapshots and show the per-category token delta")
  .argument("<snapshotA>", "path to the earlier scan --json output")
  .argument("<snapshotB>", "path to the later scan --json output")
  .option(
    "--max-increase <n>",
    "exit non-zero if the total token delta exceeds this (for CI)",
    (v) => Number.parseInt(v, 10),
  )
  .action(async (snapshotA: string, snapshotB: string, opts) => {
    const { output, exitCode } = await runDiffCommand(snapshotA, snapshotB, {
      maxIncrease: opts.maxIncrease,
    });
    process.stdout.write(output);
    process.exitCode = exitCode;
  });

program
  .command("init")
  .description("Write a starter aperture.config.json")
  .argument("[dir]", "project directory to write into")
  .option("--force", "overwrite an existing config file")
  .action(async (dir: string | undefined, opts) => {
    const { output, exitCode } = await runInitCommand(dir, { force: Boolean(opts.force) });
    process.stdout.write(output);
    process.exitCode = exitCode;
  });

program
  .command("tui")
  .description("Open the interactive context budget dashboard")
  .argument("[dir]", "project directory to scan")
  .option("--home <dir>", "override the home directory used for scanning")
  .action(async (dir: string | undefined, opts) => {
    await runTuiCommand(dir, { home: opts.home });
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  process.stderr.write(`aperture: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
