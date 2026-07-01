# FAQ

## Why are token counts estimated instead of exact?

Anthropic doesn't publish a public tokenizer for Claude, so any tool claiming
an exact count is either using a different model's tokenizer as a proxy
(imprecise) or guessing. Aperture uses a simple, transparent heuristic —
`~chars / 4` — and labels every number it produces as "estimated," in every
output format. We'd rather be honest about the approximation than dress it up
as precision it doesn't have.

## What's the difference between "eager" and "lazy" cost?

**Eager** cost is text that's injected into context on every single turn,
regardless of whether you use it — for example, an agent's or skill's `name`
+ `description` frontmatter, which gets rendered into the "available agent
types" or "available skills" list any time the relevant tool is available.
**Lazy** cost is text only loaded if that specific item is actually invoked —
an agent's full body/system prompt, or a skill's `SKILL.md` body, load only
when that agent or skill actually runs.

This distinction matters because a 900-character skill `description` that
never gets used still costs you tokens on every turn, for as long as it's
installed — while a 5,000-word agent body costs nothing until that agent
actually runs. A single combined "size" number would hide which one is
actually worth trimming.

Slash Commands are the cleanest example of fully lazy cost: a command file
in `~/.claude/commands/` isn't loaded at all until the user types that
command — no always-on cost, ever.

## Why doesn't Aperture measure MCP tool-schema cost?

Because doing so accurately requires connecting to each configured MCP
server and inspecting the tool schemas it returns at connection time — a
static read of config files can't tell you that reliably. Aperture reports
configured server names and count, with an explicit "not measured — requires
a live connection" caveat, rather than fabricate a plausible-but-wrong
number. A future opt-in `--live` mode will add real measurement here (see
[ROADMAP.md](../ROADMAP.md)).

## Does Aperture call any APIs or send my data anywhere?

No. Aperture makes zero network calls and requires zero API keys. It reads
files from your local `~/.claude` directory and an optional target project
directory, does arithmetic, and prints a report. Nothing leaves your
machine. There's no telemetry.

## Does Aperture use an LLM to analyze anything?

No. There is no LLM call anywhere in Aperture's pipeline. Token estimation is
a character-count heuristic, not a model call.

## What counts as a "category"?

Six fixed categories: `claude-md`, `skills`, `agents`, `commands`, `mcp`, and
`settings`. See [Architecture](./architecture.md) for exactly what each one
collects.

## How do I stop a plugin from being loaded if it's misbehaving?

Remove it from the `plugins` array in `aperture.config.json` (or
`.aperture/plugins.json`). If a plugin throws on load, Aperture already skips
it automatically and continues the scan — it will never crash the whole
run because of one bad plugin.

## Can I use Aperture in CI to prevent context bloat?

Yes — that's exactly what `aperture doctor --fail-on-warn` and
`aperture diff --max-increase <n>` are for. See
[examples.md](./examples.md) for CI recipes.

## Does `aperture scan` need a target project directory?

No, it's optional. Without one, Aperture scans only your global `~/.claude`
config. Passing a directory additionally picks up that project's nested
`CLAUDE.md`.

## What does the hidden `--home <dir>` flag do?

It overrides the home directory Aperture uses for scanning, instead of the
real `$HOME`. It exists mainly for tests and for reproducing a bug report
against a specific `~/.claude` snapshot without touching your own machine's
config.

## Why "Aperture"?

A camera aperture controls how much light — how much context — gets let in.
The tool doesn't change what's loaded; it lets you see it clearly before you
decide.
