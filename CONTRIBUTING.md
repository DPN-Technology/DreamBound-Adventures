# Contributing to DreamBound Adventures

Thank you for helping build DreamBound Adventures by DPN Technology.

This project is designed for children ages 4–8, so contributions are evaluated for **fun, accessibility, child safety, privacy, stability and truthfulness** as well as code quality.

## Before you change code

Read the README, SECURITY.md, docs/THREAT_MODEL.md and docs/SECURITY_GATES.md.

## Local checks

~~~bash
node --check game.js
python3 tools/validate_dreambound.py --mode all
~~~

## Pull request requirements

A PR should:

- Be focused and understandable.
- Describe the player-visible behavior.
- Include runtime evidence for significant visual/gameplay changes.
- Preserve existing save compatibility or document the migration.
- Avoid fake screenshots or unsupported feature claims.
- Keep controls understandable for ages 4–8.
- Keep child-facing text age-appropriate.
- Preserve reduced-motion/accessibility behavior where applicable.
- Pass DreamShield gates.

## Child-safety rules

Do not add public chat, strangers, advertising, child-targeted purchases, behavioral analytics, external trackers, remote script execution, public user profiles, cloud child data, voice capture, camera capture, public user-generated content, open web links presented to children or unmoderated multiplayer without an explicit architecture and privacy review.

## Security

Never commit credentials or real private data.

Do not weaken CI, CodeQL, dependency review, DreamShield validation or workflow permissions just to make a check green. Fix the underlying issue or document a narrowly scoped security exception.

## Dependency policy

DreamBound should stay lightweight and local-first. New dependencies require a clear reason, compatible license, maintenance assessment and security review. Prefer browser/platform capabilities when they are sufficient.

## Repository presentation

The GitHub repository can be visually advanced, but every status, screenshot, feature statement and security claim must be backed by real repository evidence.

**DEVELOP. PIONEER. NAVIGATE.**
