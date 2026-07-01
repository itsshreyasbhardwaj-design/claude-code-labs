# Architecture

This doc explains how Aperture is built internally: its data flow, its core
abstractions, and the design decisions that shape what it will and won't do.

## Data Flow

```
┌─────────────┐     ┌───────────────────┐     ┌────────────┐     ┌──────────────┐
│  ContextSource│ →  │  Estimator         │ →  │  Aggregator │ →  │  Reporter     │
│  (6 built-in  │     │ (~chars/4 heuristic)│    │ (by category)│    │ (scan/tui/   │
│   + plugins)  │     │                    │     │             │     │  doctor/diff)│
└─────────────┘     └───────────────────┘     └────────────┘     └──────────────┘
```

1. **`ContextSource`s** walk the filesystem (`~/.claude/*` and an optional
   target project directory) and return raw findings — file paths plus eager
   and lazy character counts.
2. The **estimator** converts character counts to estimated token counts.
   v1 ships one estimator: `heuristic-chars-4` (characters ÷ 4). This is
   pluggable via config (`estimator` field) for future estimator strategies.
3. The **aggregator** groups findings by category and computes per-category
   and total eager/lazy sums.
4. **Reporters** format the aggregated result for each command: a static
   report for `scan`, an interactive dashboard for `tui`, a warnings-only
   view for `doctor`, or a delta view for `diff`.

## The `ContextSource` Interface

Every data source — built-in or third-party plugin — implements the same
small interface:

```typescript
interface ContextSourceFinding {
  path: string;        // file this finding came from
  eagerChars: number;   // chars always injected into context
  lazyChars: number;    // chars only loaded on invocation (0 if none)
}

interface ContextSource {
  id: string;                              // unique source id
  category: Category;                       // one of the 6 categories, or a custom one
  collect(ctx: ScanContext): Promise<ContextSourceFinding[]>;
}

interface ScanContext {
  homeDir: string;      // resolved home directory (overridable via --home)
  targetDir?: string;   // optional project directory passed to scan/tui/doctor
}
```

This is intentionally small. A source's only job is to find things and
report how many characters are eager vs. lazy — it doesn't estimate tokens,
format output, or know about CLI flags. That separation is what makes the
plugin system safe: a plugin can be wrong about what it finds, but it can't
corrupt how the rest of the pipeline works.

## The 6 Built-in Categories

| Category | What it collects | Eager | Lazy |
|---|---|---|---|
| `claude-md` | Global `~/.claude/CLAUDE.md` + nested project `CLAUDE.md` files | Full file contents | None — CLAUDE.md is always eager |
| `skills` | `~/.claude/skills/<name>/SKILL.md` | `name` + `description` frontmatter | Full `SKILL.md` body, loaded only on invocation |
| `agents` | Agent definition files | `name` + `description` frontmatter (rendered into the "available agent types" list whenever the Agent tool is available) | Full agent body, loaded only when that agent actually runs |
| `commands` | `~/.claude/commands/*.md` | None — commands are not injected until typed | Full command body, loaded only when the user types the command |
| `mcp` | MCP server entries in `~/.claude/.claude.json` and `settings.json`'s `mcpServers` key | Not measured (see below) | Not measured (see below) |
| `settings` | Settings and hooks files | Full file contents where always active | Hook bodies that only run conditionally, where applicable |

## Why MCP Is Different

Aperture deliberately does **not** estimate MCP tool-schema token cost in v1.
Measuring it accurately requires connecting to each configured MCP server and
inspecting the tool schemas it actually returns — a static file read can't
tell you that, because schemas are generated at connection time and can vary.
Rather than fabricate a plausible-looking number from config files alone,
Aperture reports the configured server names and count, with an explicit
"not measured — requires a live connection" caveat.

A future `--live` mode (see [ROADMAP.md](../ROADMAP.md)) will close this gap
by opt-in, without changing Aperture's default zero-network posture.

## The Estimator

`heuristic-chars-4` is deliberately simple: `estimatedTokens = chars / 4`.
This is a widely-used rough approximation for English text, not a real
tokenizer — Anthropic doesn't publish one publicly. Aperture labels every
number this heuristic produces as "estimated" in every report format
(`scan`, `--json`, `--md`, `tui`, `doctor`). The `estimator` field in
`aperture.config.json` exists so alternative estimators can be swapped in
later without changing the rest of the pipeline.

## Plugin Loading

Plugins are declared in `aperture.config.json`'s `plugins` array (npm package
names or local paths) or in a `.aperture/plugins.json` file. At scan time,
Aperture dynamically imports each one and validates it exposes the
`ContextSource` shape. If a plugin fails to load — missing dependency, throws
on import, malformed export — Aperture logs a warning and **skips it**,
continuing the scan with the remaining sources. A single bad plugin never
takes down the whole scan.

## Command-to-Reporter Mapping

- `scan` → static reporter, human-readable by default, `--json`/`--md` for
  alternate formats.
- `tui` → interactive reporter built on a terminal UI framework; navigates
  the same aggregated data as `scan`, just rendered differently.
- `doctor` → a filtering reporter that runs the same aggregation, then
  applies a set of warning rules (oversized CLAUDE.md, shadowed skill/agent
  names, MCP server count) and prints only what's actionable.
- `diff` → loads two previously saved `scan --json` outputs and computes a
  per-category delta; doesn't re-scan anything itself.

## Zero Network, Zero Telemetry

There is no code path in Aperture that opens a network socket during normal
operation. This isn't a configuration default that can accidentally regress —
it's an architectural property enforced by the fact that no `ContextSource`,
reporter, or command handler in v1 has network access as a dependency. The
planned `--live` MCP mode will be the first and only deliberate exception,
and it will be opt-in.
