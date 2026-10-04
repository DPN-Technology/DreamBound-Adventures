# DreamBound Adventures Threat Model

## Product profile

DreamBound is currently a local-first browser game launched from static files or a local HTTP server.

Primary users include children ages 4–8, with parents/caregivers controlling the device and installation.

## Assets to protect

- Child privacy
- Local profile/save integrity
- Game code integrity
- Parent settings
- Release/download integrity
- DPN GitHub organization and CI credentials
- Trust in child-safety promises

## Trust boundaries

### Child input → game runtime

Keyboard, touch, controller and in-game selections are untrusted input and must not become executable code, HTML injection or external navigation.

### Game runtime → local save

Save data is local and can be modified by users or browser tools. Treat it as untrusted on load. Migrations should be defensive and tolerate missing/malformed fields.

### Source repository → release

GitHub Actions, pull requests, dependencies and release packaging are supply-chain boundaries. Workflows use least privilege and automated scanning.

### Local launcher → browser

The launcher should bind only as intended for local play and must not introduce unnecessary network services.

## Current threat categories

| Threat | Primary control |
| --- | --- |
| XSS / DOM injection | Avoid dynamic unsafe HTML from untrusted data; CodeQL; source review |
| External tracking | DreamShield external URL/network API guard |
| Remote code | No remote scripts; no eval/new Function |
| Secret leakage | Repository validator + GitHub scanning capabilities |
| Supply-chain compromise | Dependency Review, Dependabot, Scorecard, minimal dependencies |
| Save corruption | Defensive migrations, local backup behavior, testing |
| Misleading repository claims | Evidence-first README policy |
| Unsafe future online expansion | Mandatory architecture/privacy review |

## Child privacy rule

DreamBound should not collect or transmit child personal data in the current architecture.

Any feature that changes this statement must not merge without a new data-flow diagram, retention policy, parental-consent analysis where applicable, abuse model and privacy review.

## Out of scope / local reality

A local user with full control of the device can modify localStorage or source files. DreamBound does not treat local save values as security credentials.

The goal is to protect children and the software supply chain—not to prevent a device owner from editing their own local game.
