# DreamBound Adventures — Third-Party Components

DreamBound Adventures is intentionally lightweight and local-first.

## Runtime dependency status

**Current v0.4.1 runtime:** no third-party JavaScript framework, CDN script, analytics SDK, ad SDK, remote font, remote game service or packaged runtime library is required by the game source in this repository.

The game primarily uses standard browser APIs, HTML, CSS and JavaScript.

## Development / CI tooling

The GitHub repository uses automation maintained by third parties or GitHub:

| Component | Purpose | Distribution |
| --- | --- | --- |
| actions/checkout | Repository checkout in CI | GitHub Action |
| actions/setup-node | Node.js setup for validation | GitHub Action |
| actions/upload-artifact | Release artifact retention | GitHub Action |
| github/codeql-action | CodeQL security analysis / SARIF upload | GitHub Action |
| actions/dependency-review-action | Pull request dependency review | GitHub Action |
| ossf/scorecard-action | OpenSSF repository security posture analysis | GitHub Action |

These tools run in GitHub Actions and are **not shipped as part of the DreamBound game runtime**.

Each component remains subject to its own upstream license and terms. Contributors should verify licensing before introducing any new runtime or build dependency.

## DPN dependency rule

New third-party runtime components must have:

1. A clear technical need.
2. A compatible commercial-use license.
3. A maintained upstream source.
4. A security review.
5. An entry in this file.
6. A documented reason the platform/browser capability is insufficient.

This file separates DPN-owned DreamBound source from externally maintained tooling and dependencies.
