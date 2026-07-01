# Quick Start

**What you'll do**: run your first Aperture scan and understand what the
output is telling you.

**Time**: under 2 minutes.

**Prerequisites**:

- [ ] Node.js >= 18.17 installed
- [ ] A Claude Code setup with a `~/.claude` directory (if you've used Claude
      Code at all, you already have one)

No install step is required — everything below uses `npx`.

## Step 1: Run a Scan

```bash
npx cc-aperture scan
```

This scans your global `~/.claude` directory and prints a breakdown across
6 categories: `claude-md`, `skills`, `agents`, `commands`, `mcp`, `settings`.

## Step 2: Read the Output

Each category shows an **estimated** token count, split into:

- **Eager** — always injected into context, every turn, whether or not you
  use it (e.g. an agent's or skill's `name` + `description`, or the full
  contents of any CLAUDE.md).
- **Lazy** — only loaded if that item is actually invoked (e.g. an agent's or
  skill's full body).

If `skills` or `agents` looks unexpectedly large, that's usually eager cost
from `description` frontmatter accumulating across many installed items —
each one is small, but they add up on every single turn.

MCP will show configured server names and a count, with a note that
tool-schema cost isn't measured in v1 (see [FAQ](./faq.md) for why).

## Step 3: Scan a Specific Project

Pass a directory to also include that project's nested `CLAUDE.md`:

```bash
npx cc-aperture scan ~/projects/my-app
```

## Step 4: Get Machine-Readable Output

For scripting, CI, or feeding into `aperture diff`:

```bash
npx cc-aperture scan --json > snapshot.json
```

Or a shareable Markdown report:

```bash
npx cc-aperture scan --md > context-report.md
```

## Step 5: Explore Interactively

For a live, navigable view instead of a static report:

```bash
npx cc-aperture tui
```

Use `↑`/`↓` (or `j`/`k`) to move between categories, `Enter`/`→` to drill into
the biggest offenders in a category, `t` for trim suggestions, and `q` to
quit.

## Step 6: Check for Actionable Warnings

```bash
npx cc-aperture doctor
```

This is the fastest way to find real problems: an oversized CLAUDE.md, a
skill or agent name silently shadowed by a duplicate across plugin packs, or
a suspiciously high MCP server count.

## What You Just Did

You measured your Claude Code ambient context, distinguished what's always
costing you tokens from what only costs tokens on invocation, and got a
warnings pass on common misconfigurations — all fully offline.

## Next Steps

- [Architecture](./architecture.md) — how Aperture is built internally
- [Examples](./examples.md) — real output samples and CI recipes
- [FAQ](./faq.md) — common questions, including "why estimated, not exact?"
