# DreamBound Adventures Security Policy

DreamBound Adventures is a children's game for ages 4–8. DPN Technology treats **child safety, privacy, local-data integrity, supply-chain security and secure development controls** as core product requirements.

## Current security boundary

The current game is intentionally local-first:

- No required online account
- No public chat
- No strangers / public multiplayer
- No analytics
- No ads
- No in-app purchases
- No required remote content
- Player progress stored in browser localStorage
- Local launcher serves static game files on the player's computer

A future change that adds accounts, cloud storage, remote APIs, telemetry, voice, AI, chat, public multiplayer, user-generated content or third-party content expands the trust boundary and requires explicit security/privacy review before merge.

## Report a vulnerability

Please report issues involving:

- Cross-site scripting or script injection
- Unsafe dynamic code execution
- External-content injection
- Untrusted URL handling
- Save-data corruption or unsafe migration
- Path traversal or launcher issues
- Credential/token exposure
- Dependency or GitHub Actions compromise
- Child privacy or unintended data collection
- Security control bypass
- Public-network exposure from the local launcher
- Any feature that violates the documented child-safety boundary

Do **not** publish weaponized exploit details or private information in a public issue.

Use GitHub's private security reporting/security area when available, or another official private DPN Technology channel.

## Sensitive information

Never commit or report real passwords, API keys, access tokens, private keys, webhooks, child identifying information, home addresses, school information, private photos, authentication cookies or session data.

## DreamShield merge standard

Security-sensitive changes should pass the DPN DreamBound Quality Gate, DreamShield Child Safety validation, Security Baseline validation, CodeQL, Dependency Review when dependencies change, supply-chain posture checks and local runtime smoke testing.

See [Security Gates](docs/SECURITY_GATES.md).

## Supported version

The actively developed version on main and the most recent GitHub release are the supported security targets unless a release note states otherwise.

## Disclosure credit

DPN Technology may credit researchers who responsibly disclose valid issues unless the reporter asks to remain anonymous or publication would create additional risk.
