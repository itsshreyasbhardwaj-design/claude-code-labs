# Roadmap

Aperture v1 answers one question well: how big is my ambient Claude Code
context, and where is it coming from? Everything below is genuinely planned,
not yet built, and each item extends the same source/plugin pattern v1
establishes — a `ContextSource` that collects data and reports it honestly,
with estimates clearly labeled as estimates.

This is a directional roadmap, not a committed timeline. Order is not a
promise of sequencing.

## Platform Features

### 1. Drift Radar

Continuously diffs what your documentation (README, CLAUDE.md) *claims* about
a codebase against what the code *actually does*, and flags contradictions.
The same instinct that makes Aperture measure ambient context honestly,
pointed at documentation accuracy: is this doc still true, or is it stale in a
way that will mislead a human or an agent reading it?

### 2. AI Provenance Ledger

Wraps Claude-Code-driven git commits with structured provenance metadata —
files touched, stated rationale, claimed vs. actual test coverage, and a
confidence signal. A git-blame-style trust and audit layer for AI-driven
changes, so a reviewer (human or automated) can answer "what did the agent
actually do here, and how sure was it?" without re-deriving that from the diff
alone.

### 3. Project Health Score

A trended composite score — doc freshness, dead/duplicate code, test
coverage, security issues, TODO staleness — surfaced as a dashboard over
time. The goal is a single number (with a breakdown) that tells you whether a
codebase's health is improving or decaying, tracked commit over commit rather
than as a one-time snapshot.

### 4. Onboarding Simulator

Spins up a zero-context agent that reads *only* a project's public docs (no
source access) and reports exactly where it got confused. Automated onboarding
QA: if a fresh agent can't figure out how to install, configure, or use your
project from the docs alone, neither can a new developer.

## Near-Term Technical Roadmap

These aren't "features" in the product sense — they're infrastructure changes
planned for the existing tool:

- **`--live` MCP introspection mode** — a future flag that connects to
  configured MCP servers to measure real tool-schema token cost, closing the
  one gap v1 leaves deliberately unmeasured. This will remain opt-in: Aperture
  stays network-free by default, and `--live` is the explicit exception a user
  reaches for when they want that number badly enough to accept a live
  connection.
- **Monorepo migration (pnpm workspaces)** — once a second flagship feature
  (see above) begins active development, the codebase moves to a pnpm
  workspace layout so each feature can live in its own package without
  entangling release cadences.

## How to Influence This

Open an issue or start a discussion on GitHub. If you're building against
Aperture's `ContextSource` plugin interface and want a hook that doesn't exist
yet, that's exactly the kind of feedback that reshapes this list.
