# DPN DreamShield Security Gates

DreamShield is the security and quality control layer for DreamBound Adventures.

## Required gate model

| Gate | Purpose | Expected merge status |
| --- | --- | --- |
| DreamShield Green Gate | Aggregates source, policy, child-safety and security checks | Required |
| Workflow Security Contract | Enforces immutable Action pins and least-privilege workflow patterns | Required |
| CodeQL JavaScript Analysis | Static application security analysis | Required |
| Dependency Review | Detect risky dependency changes in pull requests | Required when available |
| Local Runtime Smoke | Ensures core static game files serve correctly | Required |
| OpenSSF Scorecard | Repository/supply-chain posture signal | Scheduled / monitored |
| Release Provenance | Attests tagged release packages before publication | Required for tagged releases |

## Quality Gate internals

### Source Integrity

- JavaScript parses successfully.
- Required runtime files exist.
- Merge conflict markers are absent.
- Required game identifiers are present.
- Co-op wiring contract is intact.
- GitHub Actions pass the workflow-security contract.

### DreamShield Child Safety

- No remote scripts.
- No external runtime URLs.
- No iframes.
- No telemetry-style browser APIs.
- No WebSocket/EventSource network channels.
- No unexpected child-facing external links.

### Security Baseline

- No eval or dynamic Function constructor.
- No obvious embedded credentials/tokens.
- No dangerous document injection APIs.
- No unexpected network expansion without review.

### Workflow Security Contract

- Every third-party/GitHub Action is pinned to an immutable 40-character commit SHA.
- Checkout credentials are not persisted.
- Top-level write permissions are forbidden.
- Write access is scoped to the minimum job that needs it.
- `pull_request_target` is forbidden without an explicit security exception.
- Dangerous download-and-execute shell patterns are rejected.
- Untrusted issue/PR text cannot be directly interpolated into executable workflow source.

## Branch protection target

Recommended `main` policy:

- Require pull request before merge.
- Require at least one approving review for non-trivial changes.
- Require conversation resolution.
- Require branches to be up to date.
- Require DreamShield Green Gate, CodeQL and Local Runtime Smoke.
- Require Dependency Review when present.
- Block force pushes.
- Block deletion of `main`.
- Require CODEOWNERS review for security-sensitive files.
- Keep workflow permissions least-privilege.

Repository code can enforce CI but cannot replace an organization/repository ruleset. The active GitHub integration does not expose administrative ruleset mutation, so ruleset enforcement remains an administrator-level repository setting.

## Release hardening

Tagged releases are built by CI from repository source, receive a SHA-256 checksum, and receive GitHub build-provenance attestation before publication. The release-publishing job is separated from the build job so `contents: write` is not available while untrusted source validation/build steps run.

## Security exception process

If a gate must be bypassed:

1. Document why.
2. Identify the exact check.
3. Explain child/player security impact.
4. Keep the exception time-bounded.
5. Add a follow-up issue.
6. Never disable multiple gates as a convenience workaround.

## Future online features

Cloud saves, accounts, online multiplayer, chat, AI, voice, camera, remote assets or user-generated content require a separate architecture review and cannot be treated as a small feature change.
