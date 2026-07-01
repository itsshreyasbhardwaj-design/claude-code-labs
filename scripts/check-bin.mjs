import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "dist", "cli.js");
const fixtureHome = join(here, "..", "test", "fixtures", "minimal", "home");

const result = spawnSync(
  process.execPath,
  [cli, "scan", fixtureHome, "--home", fixtureHome, "--json"],
  { encoding: "utf-8" },
);

if (result.status !== 0) {
  console.error("check-bin: `aperture scan --json` exited non-zero");
  console.error(result.stdout);
  console.error(result.stderr);
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(result.stdout);
} catch (error) {
  console.error("check-bin: scan --json output was not valid JSON");
  console.error(result.stdout);
  console.error(error);
  process.exit(1);
}

if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
  console.error("check-bin: scan --json output did not look like a valid snapshot");
  process.exit(1);
}

console.log(`check-bin: OK (${parsed.items.length} item(s) found in the built CLI's smoke test)`);
