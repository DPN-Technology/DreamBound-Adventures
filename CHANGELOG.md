## v0.7.1-dev — Runtime Interaction Reliability

- Added a DOM collection compatibility bridge for nine legacy multi-element selector sites in the monolithic game runtime.
- Restored reliable controls for co-op magic, the Star Chamber, Fossil Scanner, Gear Builder, and Explorer Submarine sonar.
- Added CI enforcement that caps legacy selector debt at nine sites and rejects new collection methods through the single-element `$()` helper.
- Added the bridge to DreamShield child-safety scanning, runtime-security checks, smoke testing, the secure local-server allowlist, and release packaging.
- Kept all existing CSP, loopback-only serving, profile sanitization, fuzzing, and no-network child-safety restrictions.
- Planned next architecture step: split the oversized game runtime into smaller modules so the compatibility bridge can be removed.

## v0.7.0-dev — Three Worlds Expansion

- Added the connected **The Lost Explorer Map** story chapter.
- Added enterable **Fossil Hall** in Dino Valley.
- Added age-adaptive Fossil Scanner and mystery fossil-map sequence.
- Added enterable **Maker Workshop** in Builder Bay.
- Added blueprint-driven Gear Builder and persistent Dive Compass story item.
- Added enterable **Ocean Discovery Center** with aquarium lab and submarine dock.
- Added unlockable **Explorer Submarine** and repeatable sonar expeditions.
- Added alternating Player 1 / Player 2 sonar turns when local co-op is active.
- Added Interior Explorer and Pathfinder sticker/achievement progression.
- Added three new world structures to the Storybook renderer.
- Added strict sanitizer support for all v0.7 story/interior/submarine state.
- Fixed the Avatar Studio option selector regression on the expanded branch.
- Added a v0.7 world-expansion CI contract.
- No new external network access, analytics, accounts, remote assets, or third-party runtime dependency.

## v0.6.1-dev — Runtime & Save Security Hardening

- Added strict sanitization for all locally loaded child profiles.
- Added malformed/oversized save recovery and local quarantine instead of unhandled JSON crashes.
- Added protection against localStorage-based HTML/style injection through profile fields.
- Added a dedicated loopback-only DreamBound HTTP server with an explicit runtime-file allowlist.
- Added CSP, anti-framing, MIME-sniffing, referrer, cross-origin and browser-permission security headers.
- Added an in-page CSP for the direct-file fallback path.
- Added a 4,000-case randomized profile-sanitizer fuzz test.
- Added a runtime-security CI contract.
- Upgraded the smoke test to validate security headers and the sanitizer runtime.
- Fixed the v0.6 Avatar Studio multi-option selector bug.
- No remote services, accounts, analytics, ads or new network capability added.

## v0.6.0-dev — Home & Magic Story Chapter

- Added DreamBound's first connected story chapter: **The Sleeping Star**.
- Added three collectible DreamPetals in Home Valley.
- Added dynamic story compass targeting based on chapter step.
- Added Star Compass discovery inside the Dream Home.
- Added an enterable Moonflower Tower interior.
- Added the Star Chamber age-adaptive memory sequence.
- Added permanent Dream Lantern world/home reward.
- Added Star Keeper sticker and story quest rewards.
- Added persistent Avatar Studio customization.
- Added four hairstyle modes and five playful accessory options.
- Added more expressive animated DreamCreature presentation and proximity reactions.
- Added v0.6 save migration fields without invalidating existing profiles.
- Added a CI story-contract check to protect the new chapter wiring.
- No new network access or third-party runtime dependency.

## v0.5.1-dev — Co-op Gameplay

- Fixed the co-op profile-picker selector regression discovered during runtime review.
- Added DreamLink Team Raceway with two independently controlled karts and a shared score.
- Added Team Creature Rescue requiring both explorers to participate.
- Added DreamLink Magic Lesson with alternating Player 1 / Player 2 turns.
- Added DreamLink Workshop role challenge: Spark Engineer + Gear Engineer.
- Added Sibling Stars co-op activity quest and persistent activity tracking.
- Added shared co-op activity rewards, XP, gems, stickers and guest-profile progression.
- Added Team DreamCreature Sanctuary behavior.
- Expanded co-op center with playable activity guidance.
- Added dedicated co-op contract validation to CI.

## v0.5.0-dev — Local Sibling Co-op

- Added profile-aware local sibling co-op foundation.
- Player 2 joins from another existing child profile.
- Added I/J/K/L + O keyboard controls for Player 2.
- Added second-gamepad support.
- Added second explorer and second DreamBuddy rendering.
- Added shared-screen midpoint camera and DreamLink tether.
- Added shared star/gem/falling-star rewards while co-op is active.
- Added three cooperative DreamLink Gates across Home Valley, Builder Bay and Ocean Cove.
- Added Dream Team quest, sticker, achievements and teamwork progression.
- Added co-op HUD status and co-op profile picker.
- Preserved single-player behavior and existing profile/save compatibility.

# Changelog

## v0.4.1 — DreamBound Rebrand

- Renamed WonderWorld Adventures to **DreamBound Adventures**
- New tagline: **Every Adventure Starts With Imagination.**
- Rebranded WonderBuddy → DreamBuddy, WonderCreatures → DreamCreatures, Wonder Stars → Dream Stars, Wonder Collection → Dream Collection, and Wonder Home → Dream Home
- Added automatic import from legacy `wonderworld-profile-*` saves into new `dreambound-profile-*` saves
- Renamed Windows launchers to `PLAY-DREAMBOUND.bat` and `PLAY-DREAMBOUND.ps1`
- Preserved all v0.4 gameplay and progression systems


## v0.4.0 — Storybook World Build

### Added
- Storybook World procedural rendering layer
- Biome-specific scenery and environmental details
- Animated Ocean Cove water effects
- Drawn roads, boardwalks, raceway, buildings, and landmark structures
- Animated explorer character and custom scooter renderer
- Scooter travel trail
- Six-land Landmark Hunt
- Landmark Legend main adventure
- Landmark Legend sticker / achievement progression
- Landmark Collection tab
- Landmark state on the interactive map
- Upgraded Dream Home interior
- Four unlockable Dream Home visual themes
- Dream Home Dance Party, Dream Time, and Buddy Play activities

### Improved
- Title screen presentation
- HUD, level bar, quest tracker, world-event card, and modal depth
- NPC and DreamCreature rendering
- DreamBuddy presentation
- Builder object rendering
- World lighting, shadows, day/night presentation, and vignette
- Save migration for older profiles
- Main Adventure count increased from 13 to 14

### Compatibility
- v0.1, v0.2, and v0.3 profile structures remain loadable and are expanded when used in v0.4.

### Safety
- Remains local-first with no ads, purchases, analytics, public chat, public multiplayer, or online strangers.
