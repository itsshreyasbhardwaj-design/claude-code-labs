# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `aperture scan [dir]` — one-shot analysis of global `~/.claude/*` config plus
  an optional target project directory, with `--json` and `--md` output modes
  and a hidden `--home <dir>` override for testing/support repro.
- `aperture tui [dir]` — interactive terminal dashboard (default command in an
  interactive terminal) with a bar chart across all 6 categories split into
  eager vs. lazy segments, category drill-down, a trim suggestions panel, and
  re-scan support.
- `aperture doctor [dir]` — non-interactive actionable-warnings report,
  including oversized-CLAUDE.md detection, shadowed skill/agent name
  detection across plugin packs, and MCP server count, with `--fail-on-warn`
  for CI gating.
- `aperture diff <snapshotA.json> <snapshotB.json>` — per-category token delta
  between two saved scans, with `--max-increase <n>` for CI gating against
  context bloat.
- `aperture init` — writes a starter `aperture.config.json`
  (`budgetTokens`, `ignore`, `claudeMdWarnBytes`, `estimator`, `plugins`),
  refusing to overwrite an existing config without `--force`.
- Context categorization across 6 sources: `claude-md`, `skills`, `agents`,
  `commands`, `mcp`, `settings`.
- Eager vs. lazy token cost distinction across all categories — the core
  design idea of Aperture.
- Heuristic token estimator (`~chars / 4`), explicitly labeled as an estimate
  everywhere it's surfaced.
- MCP category reports configured server names/count only; tool-schema token
  cost is explicitly not measured in v1 (requires a live connection).
- Plugin architecture: third-party `ContextSource` plugins loadable via the
  `plugins` array in `aperture.config.json` or a `.aperture/plugins.json`
  file, loaded dynamically at scan time; a plugin that fails to load is
  skipped rather than crashing the scan.
- Fully offline operation — zero network calls, zero API keys required.

[Unreleased]: https://github.com/itsshreyasbhardwaj-design/claude-code-labs/compare/HEAD
