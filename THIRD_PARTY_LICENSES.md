# DreamBound Adventures — Third-Party Components

DreamBound Adventures is intentionally lightweight and local-first.

## Runtime dependency status

**Current runtime:** no third-party JavaScript framework, CDN script, analytics SDK, ad SDK, remote font, remote game service or packaged runtime library is required by the game source in this repository.

The game primarily uses standard browser APIs, HTML, CSS and JavaScript.

## Development / CI tooling

The GitHub repository uses automation maintained by third parties or GitHub. Workflow references are pinned to immutable commit SHAs; human-readable versions are retained as comments in the workflow files.

| Component | Version line | Purpose | Runtime-shipped? |
| --- | --- | --- | --- |
| actions/checkout | v7 | Repository checkout | No |
| actions/setup-node | v7 | Node.js setup | No |
| actions/upload-artifact | v7 | Release artifact retention | No |
| actions/download-artifact | v8.0.1 | Release artifact retrieval | No |
| actions/attest-build-provenance | v4.2.2 | Release provenance attestation | No |
| github/codeql-action | v4 | CodeQL analysis / SARIF upload | No |
| actions/dependency-review-action | v5.0.0 | Pull request dependency review | No |
| ossf/scorecard-action | v2.4.4 | OpenSSF repository security posture | No |

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
