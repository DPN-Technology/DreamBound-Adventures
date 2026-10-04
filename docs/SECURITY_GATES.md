# DPN DreamShield Security Gates

DreamShield is the security and quality control layer for DreamBound Adventures.

## Required gate model

| Gate | Purpose | Expected merge status |
| --- | --- | --- |
| DreamShield Green Gate | Aggregates source, policy, child-safety and security checks | Required |
| CodeQL JavaScript Analysis | Static application security analysis | Required |
| Dependency Review | Detect risky dependency changes in pull requests | Required when available |
| Local Runtime Smoke | Ensures core static game files serve correctly | Required |
| OpenSSF Scorecard | Repository/supply-chain posture signal | Scheduled / monitored |

## Quality Gate internals

The main quality workflow evaluates four independent jobs.

### Source Integrity

- JavaScript parses successfully.
- Required runtime files exist.
- Merge conflict markers are absent.
- Required game identifiers are present.

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

### Policy Files

- Security policy
- Threat model
- Contributor rules
- CODEOWNERS
- Dependabot

The final **DreamShield Green Gate** fails if any required internal gate does not succeed.

## Branch protection target

Recommended main policy:

- Require pull request before merge.
- Require at least one approving review for non-trivial changes.
- Require conversation resolution.
- Require branches to be up to date.
- Require DreamShield Green Gate, CodeQL and Local Runtime Smoke.
- Require Dependency Review when present.
- Block force pushes.
- Block deletion of main.
- Require CODEOWNERS review for security-sensitive files.
- Keep workflow permissions least-privilege.

The connected GitHub interface currently exposes workflow/file writes but not repository ruleset mutation, so the CI controls are installed in-repo and the ruleset target is documented here for repository/organization enforcement.

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
