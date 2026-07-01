# Security Policy

## Our Security Posture

Aperture is a fully offline CLI/TUI. It makes **zero network calls**, requires
**zero API keys**, and does not transmit any data anywhere — it reads files
from your local `~/.claude` directory (and an optional target project
directory) and reports on them locally. This significantly limits Aperture's
attack surface compared to a networked tool, but "reads files from disk and
loads plugins" is still worth taking seriously.

Areas we consider most security-sensitive:

- **File system access** — Aperture reads (never writes, except `aperture init`
  writing a config file you explicitly asked for) files under your home
  directory and a target project directory.
- **Plugin loading** — the `plugins` array in `aperture.config.json` (or
  `.aperture/plugins.json`) causes Aperture to dynamically `require`/`import`
  arbitrary npm packages or local paths at scan time. A malicious plugin runs
  with the same privileges as Aperture itself. Only add plugins you trust, the
  same way you'd vet any npm dependency.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest 1.x | Yes |
| < 1.0 (pre-release) | No |

Once Aperture reaches a stable 1.0, security fixes will be backported to the
latest minor release line on a best-effort basis.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, email **shreyas.b.hlc0004@gmail.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce (a minimal repro is hugely helpful)
- Any suggested remediation, if you have one

We aim to acknowledge reports within **72 hours** and to provide a resolution
timeline within **7 days** of confirming the issue. Once a fix is released,
we'll credit you in the release notes unless you prefer to remain anonymous.

## Disclosure Policy

We ask that you give us a reasonable window to investigate and patch a
reported vulnerability before any public disclosure. We'll coordinate a
disclosure timeline with you once the report is triaged.
