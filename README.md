# Aperture

> See exactly what's silently loaded into every Claude Code session — before it costs you context.

[![CI](https://img.shields.io/github/actions/workflow/status/itsshreyasbhardwaj-design/claude-code-labs/ci.yml?branch=main)](https://github.com/itsshreyasbhardwaj-design/claude-code-labs/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/cc-aperture.svg)](https://www.npmjs.com/package/cc-aperture)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why This Exists

Every Claude Code session quietly loads a pile of "ambient context" before you type a single word: your global `~/.claude/CLAUDE.md`, every nested project `CLAUDE.md`, the `name` + `description` frontmatter of every installed Agent and Skill, and your MCP server configuration. On one real developer machine we scanned, that was **232 agent files and 159 skill directories** — all contributing to the token budget on every single turn, whether or not any of them are ever used.

Nobody could tell you how big that ambient context actually is, which category was the worst offender, or whether last week's "install this skill pack" PR quietly doubled it. Aperture answers that question in one command, fully offline.

## Why Estimated, Not Exact

Aperture reports **estimated** token counts using a simple, transparent heuristic (`~chars / 4`). Anthropic doesn't publish a public tokenizer, so any tool claiming an exact count is guessing harder than we are — we'd rather be upfront about it. Every number Aperture prints is labeled "estimated," and every report says so explicitly. This is a deliberate trust decision: rough-but-honest beats precise-but-fabricated.

The same honesty applies to MCP: Aperture reports configured server **names and counts**, but does not estimate MCP tool-schema token cost, because that requires a live connection to each server. Rather than fabricate a number, v1 says so plainly (a future `--live` mode will close this gap — see [ROADMAP.md](./ROADMAP.md)).

## Install

Requires Node.js >= 18.17.

```bash
npm install -g cc-aperture
```

Or run it ad hoc with no install:

```bash
npx cc-aperture scan
```

## Quick Start

```bash
npx cc-aperture scan
```

## Usage

### `aperture scan [dir]`

One-shot analysis of your global Claude Code config plus an optional target project directory.

```bash
aperture scan
aperture scan ~/projects/my-app --json > snapshot.json
aperture scan --md > context-report.md
```

Flags: `--json` (machine-readable output), `--md` (Markdown report). The hidden `--home <dir>` flag overrides the home directory used for scanning — mainly useful for tests and bug repros.

### `aperture tui [dir]`

Interactive terminal dashboard. Also runs automatically when you invoke `aperture` with no subcommand in an interactive terminal.

```bash
aperture tui
aperture tui ~/projects/my-app
```

Shows a bar chart of the 6 categories (`claude-md`, `skills`, `agents`, `commands`, `mcp`, `settings`) sorted by estimated size, each bar split visually into **eager** vs **lazy** segments.

| Key | Action |
|---|---|
| `↑`/`↓` or `j`/`k` | Navigate categories |
| `Enter` / `→` | Drill into a category, see the biggest offenders (by file) |
| `←` / `Esc` | Go back |
| `t` | Open the trim suggestions panel |
| `r` | Re-scan |
| `q` / `Ctrl+C` | Quit |

### `aperture doctor [dir]`

Non-interactive, prints only actionable warnings — no dashboard, no noise. Good for a quick sanity check or CI.

```bash
aperture doctor
aperture doctor --fail-on-warn
```

Flags a CLAUDE.md over a configurable byte threshold, a skill or agent name defined twice across different plugin packs (silent shadowing), and MCP server count. `--fail-on-warn` exits non-zero if any warnings are found, so you can gate CI on it.

### `aperture diff <snapshotA.json> <snapshotB.json>`

Compares two saved `scan --json` outputs and shows the per-category token delta.

```bash
aperture scan --json > before.json
# ...make changes...
aperture scan --json > after.json
aperture diff before.json after.json --max-increase 5000
```

`--max-increase <n>` fails (non-zero exit) if the total increase exceeds the threshold — built for CI, to catch a PR that installs a bloated skill pack and silently inflates always-on context.

### `aperture init`

Writes a starter `aperture.config.json`.

```bash
aperture init
aperture init --force   # overwrite an existing config
```

Refuses to overwrite an existing config unless `--force` is passed.

## How It Works

Aperture scans your global `~/.claude/*` directory (plus an optional target project directory) and buckets everything it finds into 6 categories:

- **`claude-md`** — global and nested project `CLAUDE.md` files
- **`skills`** — `~/.claude/skills/<name>/SKILL.md`
- **`agents`** — Agent definition files
- **`commands`** — `~/.claude/commands/*.md`
- **`mcp`** — MCP server configuration entries
- **`settings`** — settings and hooks files

### Eager vs. lazy cost

This is the single most important idea in Aperture. Every number is split into:

- **Eager cost** — text that is *always* injected into context, on every turn, whether or not you use it. For an Agent or Skill, that's the `name` + `description` frontmatter rendered into the "available agent types" / "available skills" list. For a CLAUDE.md, it's the whole file — CLAUDE.md is always eager.
- **Lazy cost** — text only loaded if that item is actually invoked. For an Agent, that's its full body/system prompt, only loaded when the agent actually runs. For a Skill, that's the `SKILL.md` body, only loaded on invocation. Slash Commands are **entirely lazy** — a command file costs nothing until you type it.

A 900-character skill description that never gets invoked still costs you eager tokens on *every single turn* for as long as that skill is installed. A 3,000-word agent body costs nothing until that agent actually runs. Conflating the two hides where your budget is really going — Aperture never does.

MCP is the one category Aperture deliberately does not fully measure: schema cost depends on a live connection to each server, so v1 reports server names/count with a clear "not measured" caveat instead of guessing.

## Plugin Architecture

Every data source in Aperture implements a small `ContextSource` interface. Built-in sources cover the 6 categories above; third-party sources can be added without forking Aperture.

Register a plugin by listing an npm package name (or local path) in `aperture.config.json`:

```json
{
  "plugins": ["cc-aperture-plugin-hooks-detail", "./local-plugins/my-source.js"]
}
```

...or in a `.aperture/plugins.json` file. Aperture loads plugins dynamically at scan time and **skips any plugin that fails to load** — one broken third-party source never crashes the whole scan.

A minimal `ContextSource` plugin looks like this:

```javascript
// my-source.js
module.exports = {
  id: "my-custom-source",
  category: "settings", // or your own category
  async collect(ctx) {
    // ctx gives you the resolved home dir and target project dir
    return [
      {
        path: "~/.claude/my-extension.json",
        eagerChars: 240,   // always injected
        lazyChars: 0,      // never lazily loaded, or however your source behaves
      },
    ];
  },
};
```

## No Network, No Telemetry, No API Keys

Aperture makes **zero network calls** and requires **zero API keys**. It doesn't call an LLM, doesn't phone home, doesn't sync anything to the cloud, and collects no telemetry. It reads files on disk and does arithmetic. That's the whole product — which is also why `npx cc-aperture` works instantly with nothing to configure.

## Roadmap

Aperture v1 is the measurement layer. Planned next: Drift Radar, an AI Provenance Ledger, a Project Health Score, and an Onboarding Simulator — see [ROADMAP.md](./ROADMAP.md) for the full picture.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the dev workflow, test/lint/build commands, and the changesets flow.

## License

MIT © [Shreyas Bhardwaj](https://github.com/itsshreyasbhardwaj-design)
