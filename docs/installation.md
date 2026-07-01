# Installation

## Requirements

- Node.js >= 18.17
- npm 9+ (bundled with modern Node.js)

Aperture makes zero network calls and requires zero API keys once installed —
these requirements are only about running the tool itself.

## Option 1: Run Without Installing

The fastest way to try Aperture is via `npx`. Nothing is installed globally:

```bash
npx cc-aperture scan
```

Every subsequent `npx cc-aperture <command>` in this doc works the same way,
with no separate install step.

## Option 2: Global Install

If you'll use Aperture regularly, install it globally so the `aperture`
binary is on your `PATH`:

```bash
npm install -g cc-aperture
```

Verify it installed correctly:

```bash
aperture --version
```

## Option 3: Project Dev Dependency

If you want to gate a CI pipeline on Aperture (see `aperture doctor
--fail-on-warn` or `aperture diff --max-increase`), install it as a dev
dependency in the project whose CI will run it:

```bash
npm install --save-dev cc-aperture
```

Then reference it via an npm script or `npx cc-aperture` in your CI config.

## Verifying the Install

```bash
aperture scan --json | head -n 1
```

If this prints JSON output, Aperture is installed and working. No
configuration, login, or API key is needed — the first real run is your
verification.

## Next Steps

Continue to the [Quick Start](./quick-start.md) to run your first scan and
interpret the results.
