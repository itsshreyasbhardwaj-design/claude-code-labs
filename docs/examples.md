# Examples

Real usage patterns for each command, including CI recipes.

## Basic Scan

```bash
aperture scan
```

Scans your global `~/.claude` config and prints a category breakdown to
stdout.

## Scan a Specific Project

```bash
aperture scan ~/projects/my-app
```

Includes `~/projects/my-app`'s nested `CLAUDE.md` in the `claude-md`
category alongside the global one.

## Save a Snapshot for Later Comparison

```bash
aperture scan --json > snapshot-2026-07-01.json
```

## Generate a Shareable Markdown Report

```bash
aperture scan --md > context-report.md
```

Useful for pasting into a PR description or a team wiki page when you want
to show *why* a context budget conversation matters.

## Explore Interactively

```bash
aperture tui
```

Then:

- `j`/`k` or `↑`/`↓` to move between `claude-md`, `skills`, `agents`,
  `commands`, `mcp`, `settings`
- `Enter` or `→` on `agents`, for example, to see which specific agent files
  are the biggest eager-cost offenders
- `t` to open the trim suggestions panel
- `r` to re-scan after you've made a change, without leaving the TUI
- `q` or `Ctrl+C` to quit

## Non-Interactive Warnings Check

```bash
aperture doctor
```

Example output shape (illustrative):

```
[warn] claude-md: ~/.claude/CLAUDE.md is 11,204 bytes (threshold: 8,000)
[warn] skills: "code-review" is defined in both `obra/superpowers` and
       `mattpocock/skills` — the second one silently shadows the first
[info] mcp: 14 servers configured (tool-schema cost not measured)
```

## Gate CI on Warnings

```bash
aperture doctor --fail-on-warn
```

Exits non-zero if any warnings are found — wire this into a CI job so a PR
that introduces an oversized CLAUDE.md or a shadowed skill/agent name fails
the build instead of silently landing.

## Compare Two Snapshots

```bash
aperture scan --json > before.json
# ...install a new skill pack, edit CLAUDE.md, etc...
aperture scan --json > after.json
aperture diff before.json after.json
```

Example output shape (illustrative):

```
category     before      after       delta
claude-md    2,100 tok   2,100 tok   +0
skills       8,400 tok   19,850 tok  +11,450  (!)
agents       31,200 tok  31,200 tok  +0
commands     0 tok       0 tok       +0
mcp          6 servers   6 servers   +0
settings     540 tok     540 tok     +0

total eager increase: +11,450 estimated tokens
```

## Gate CI on a Maximum Context Increase

This is the flagship CI use case: catch a PR that installs a bloated skill
pack and silently doubles your always-on context.

```yaml
# .github/workflows/context-budget.yml (example, not part of this repo's own CI)
- name: Check context budget delta
  run: |
    aperture scan --json --home "$HOME" > before.json
    git stash
    aperture scan --json --home "$HOME" > after.json
    git stash pop
    aperture diff before.json after.json --max-increase 5000
```

```bash
aperture diff before.json after.json --max-increase 5000
```

Exits non-zero if the total estimated token increase exceeds `5000`.

## Initialize a Config File

```bash
aperture init
```

Writes a starter `aperture.config.json`:

```json
{
  "budgetTokens": 50000,
  "ignore": [],
  "claudeMdWarnBytes": 8000,
  "estimator": "heuristic-chars-4",
  "plugins": []
}
```

Refuses to overwrite an existing config:

```bash
aperture init
# Error: aperture.config.json already exists. Use --force to overwrite.

aperture init --force
# Wrote aperture.config.json
```

## Add a Third-Party Plugin

```json
{
  "plugins": ["cc-aperture-plugin-hooks-detail"]
}
```

```bash
aperture scan
```

Aperture loads the plugin at scan time. If it fails to load, Aperture prints
a warning and continues with the built-in sources — no crash.
