# Contributing to Aperture

Thanks for considering a contribution. This doc covers the local dev workflow, quality gates, and how to version a change.

## Prerequisites

- Node.js >= 18.17
- npm 9+

## Getting Started

```bash
git clone https://github.com/itsshreyasbhardwaj-design/claude-code-labs.git
cd claude-code-labs
npm install
```

## Development Workflow

Run the CLI directly against TypeScript source with `tsx` — no build step required while iterating:

```bash
npm run dev -- scan
npm run dev -- tui
npm run dev -- doctor --fail-on-warn
```

### Tests

```bash
npm run test         # run the full test suite once
npm run test:watch   # re-run on file change
```

Every new `ContextSource`, CLI command, or estimator should ship with tests. If you fix a bug, add a regression test that fails before your fix and passes after.

### Linting and Formatting

Aperture uses [Biome](https://biomejs.dev/) for linting and formatting.

```bash
npm run lint         # check only
npm run lint:fix      # check and auto-fix
```

### Type Checking

```bash
npm run typecheck
```

### Building

```bash
npm run build
```

This runs `tsup` and produces the distributable CLI in `dist/`.

### Full CI Check, Locally

Before opening a PR, run the same checks CI runs:

```bash
npm run ci
```

`ci` runs typecheck, lint, tests, and build, then a postbuild smoke test that executes the built `bin` to confirm it actually starts.

## Versioning: Changesets

Aperture uses [changesets](https://github.com/changesets/changesets) to manage versioning and the changelog. If your PR changes user-facing behavior (a new flag, a changed default, a bug fix a user would notice), add a changeset before opening the PR:

```bash
npm run changeset
```

Follow the prompts to pick a semver bump (patch/minor/major) and write a one-line summary. Commit the generated file in `.changeset/` along with your change. PRs that only touch internal tooling, tests, or docs generally don't need one — use your judgment, and a maintainer will flag it in review if one's missing.

## Pull Request Checklist

- [ ] `npm run ci` passes locally
- [ ] Tests added/updated for the behavior change
- [ ] A changeset is included if the change is user-facing
- [ ] Docs updated (`README.md` / `docs/`) if you added or changed a CLI command, flag, or config field

## Project Boundaries Worth Knowing

- Aperture makes zero network calls and requires zero API keys. Contributions that introduce a network dependency to core scanning behavior will need strong justification and almost certainly belong behind an opt-in flag (see the planned `--live` MCP introspection mode in [ROADMAP.md](./ROADMAP.md)).
- Token counts are estimates (`~chars / 4`), clearly labeled as such. Do not introduce reporting that implies exact token counts without an equally clear caveat.
- Third-party `ContextSource` plugins must never be allowed to crash a scan — a failing plugin should be skipped, not fatal.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). Be kind.

## Questions

Open a [GitHub issue](https://github.com/itsshreyasbhardwaj-design/claude-code-labs/issues) or start a discussion — there's no such thing as a dumb question in an issue tracker.
