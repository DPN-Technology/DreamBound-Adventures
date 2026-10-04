# DreamBound Adventures Release Process

DreamBound releases should come from a validated main branch and a semantic version tag.

## Release prerequisites

Before tagging a release:

- DreamShield Green Gate is successful.
- Local Runtime Smoke is successful.
- CodeQL is successful or any configuration exception is explicitly documented.
- Supply-chain checks are reviewed.
- The changelog reflects shipped behavior.
- Save migration is tested when player-state structure changed.
- README feature claims match the actual build.
- No unresolved child-safety regression is known.

## Automated tag release

The DPN DreamBound Release Integrity workflow runs for tags matching v*.

It:

1. Runs JavaScript syntax validation.
2. Runs the full DreamShield validator.
3. Creates a versioned DreamBound source package.
4. Generates a SHA-256 checksum.
5. Uploads the validated artifact to the workflow.
6. Publishes the ZIP and checksum to a GitHub Release for tag-triggered runs.

## Versioning

Use semantic versioning where practical:

- Patch: fixes, polish, documentation or small compatible improvements.
- Minor: meaningful new gameplay/features that preserve expected compatibility.
- Major: substantial compatibility or architecture change.

Pre-release labels may be used for test builds.

## Evidence rule

Do not publish a release as working solely because packaging succeeded. Runtime claims should be supported by the smoke test and any feature-specific verification performed for that release.

## Rollback

If a tagged build contains a serious regression:

1. Mark the affected release clearly.
2. Fix forward when practical.
3. If necessary, restore the last known-good source state in a new patch release.
4. Do not silently replace published binaries without a documented reason.
