<!-- DREAMBOUND-DPN-HERO:START -->
<p align="center"><img src=".github/readme-hero.svg" alt="DreamBound Adventures — DPN Technology" width="100%"></p>
<p align="center">
  <img alt="DPN Technology" src="https://img.shields.io/badge/DPN-Technology-111111?style=flat-square&logo=github">
  <img alt="DreamBound" src="https://img.shields.io/badge/DreamBound-Adventures-8B5CFF?style=flat-square">
  <img alt="Ages 4–8" src="https://img.shields.io/badge/Ages-4--8-FF73B9?style=flat-square">
  <img alt="Local First" src="https://img.shields.io/badge/Play-Local--First-42D6C5?style=flat-square">
</p>
<!-- DREAMBOUND-DPN-HERO:END -->

<p align="center">
  <strong>DPN DREAMBOUND // IMAGINATION NETWORK</strong><br>
  <sub>Every Adventure Starts With Imagination.</sub>
</p>

<p align="center">
  <a href="https://github.com/DPN-Technology/DreamBound-Adventures/actions/workflows/dpn-dreambound-quality-gate.yml"><img alt="DPN DreamBound Quality Gate" src="https://github.com/DPN-Technology/DreamBound-Adventures/actions/workflows/dpn-dreambound-quality-gate.yml/badge.svg"></a>
  <a href="https://github.com/DPN-Technology/DreamBound-Adventures/actions/workflows/dpn-dreambound-codeql.yml"><img alt="CodeQL" src="https://github.com/DPN-Technology/DreamBound-Adventures/actions/workflows/dpn-dreambound-codeql.yml/badge.svg"></a>
  <a href="https://github.com/DPN-Technology/DreamBound-Adventures/actions/workflows/dpn-dreambound-supply-chain.yml"><img alt="Supply Chain" src="https://github.com/DPN-Technology/DreamBound-Adventures/actions/workflows/dpn-dreambound-supply-chain.yml/badge.svg"></a>
  <a href="https://github.com/DPN-Technology/DreamBound-Adventures/actions/workflows/dpn-dreambound-smoke.yml"><img alt="Game Smoke Test" src="https://github.com/DPN-Technology/DreamBound-Adventures/actions/workflows/dpn-dreambound-smoke.yml/badge.svg"></a>
</p>

<p align="center">
  <img alt="Latest release" src="https://img.shields.io/github/v/release/DPN-Technology/DreamBound-Adventures?display_name=tag&sort=semver&style=flat-square&label=release">
  <img alt="Last commit" src="https://img.shields.io/github/last-commit/DPN-Technology/DreamBound-Adventures?style=flat-square&label=last%20commit">
  <img alt="Open issues" src="https://img.shields.io/github/issues/DPN-Technology/DreamBound-Adventures?style=flat-square">
  <img alt="Repository size" src="https://img.shields.io/github/repo-size/DPN-Technology/DreamBound-Adventures?style=flat-square">
</p>

<p align="center"><img src=".github/repo-showcase.svg" alt="DreamBound systems overview" width="100%"></p>

## ✨ What is DreamBound?

**DreamBound Adventures** is DPN Technology's local-first children's adventure game for ages **4–8**. It mixes exploration, imagination, collecting, building, racing, dinosaurs, magic, creative play, light learning, and DreamBuddy friendship in one connected world.

The design goal is simple: **make learning feel like an adventure, not homework**.

> **Child-first baseline:** no ads, no in-app purchases, no analytics, no public chat, no online accounts, no strangers, and no external links presented to children.

## 🚀 DreamBound v1.0 — Advanced World Engine

The modular DreamBound runtime has moved beyond a small Space Center preview into a reusable **Advanced World Engine**.

### Engine upgrades

- **Real scene system** — walkable Lunar Station interior with independent scene bounds and transitions instead of modal-only fake rooms.
- **Advanced rendering/FX** — particles, reward bursts, camera shake, flashes, ambient lighting, animated route markers, moving clouds and Moon shimmer.
- **Live world console** — minimap, compass, current zone, rover energy and Luma Bond telemetry.
- **Vehicle physics** — acceleration, friction, speed limiting, battery drain/recharge, boost, dust trails and optional controller rumble.
- **Procedural audio** — local WebAudio tones/chords/noise; no downloaded sound files or remote audio.
- **Data-driven missions** — reusable quest definitions, milestone rewards and an in-game Mission Journal.
- **Companion AI** — Luma follow physics, moods, emotes and persistent bond progression.
- **Accessibility controls** — audio toggle, reduced motion, high contrast and large UI modes.
- **Controller support** — analog stick/D-pad movement, A-button interaction and trigger boost.
- **Advanced security** — every engine module is scanned by DreamShield and vNext save state is fuzzed with 3,500 randomized hostile inputs.

DreamBound now launches as one unified Living World runtime. The former Storybook implementation is retained only as migration source while its strongest content is moved into the unified engine.

Architecture: `docs/VNEXT_ARCHITECTURE.md`.

## 🌐 Unified Living World — current runtime

DreamBound now ships as **one player-facing game**. The root `index.html` is the canonical modular Living World runtime; there is no Storybook-vs-Living-World game chooser.

### Connected regions now inside the same engine

| Region | Unified runtime role |
| --- | --- |
| 🚀 **Space Center Campus** | Mission Control, Solar Array, Rocket Workshop, Launch Pad and DreamGate Nexus |
| 🌕 **Moon Surface** | Tranquility Basin, Crystal Ridge, Luma Hollow, Moon Base and world-event systems |
| 🛰️ **Lunar Space Station** | Walkable station interior, Hydroponics, Observatory and Discovery Lab |
| 🏡 **Home Valley** | Dream Home / Dream Lantern realm scene |
| 🪄 **Magic Grove** | Moonflower Tower / resonance realm scene |
| 🏎️ **Racing Ridge** | Rainbow Speedway / route-calibration realm scene |
| 🦕 **Dino Valley** | Fossil Hall / fossil-scanner realm scene |
| 🧱 **Builder Bay** | Maker Workshop / blueprint-build realm scene |
| 🌊 **Ocean Cove** | Discovery Center / sonar-trail realm scene |

The six former Storybook lands are registered through the same scene engine and use the same local progression, Odyssey rewards, DreamShield boundary, cinematic system, HUD and save environment.

### Legacy migration inventory

The repository still contains the old monolithic `game.js`, `styles.css`, profile sanitizer and DOM compatibility bridge **only as migration source**. They are no longer loaded by `index.html`, are denied by the secure local server, and are excluded from release packages.

Still to be migrated from that source into the unified engine: the deeper Dream Home customization, full racing activity, dinosaur mini-games, magic lessons, Builder Mode, Photo Safari, legacy profile slots, and sibling co-op. These are migration targets—not claims about the current unified build.

## 🌙 v0.9 Lunar Guardian

The modular preview now continues beyond launch into a persistent **Lunar Guardian** chapter.

- Enter the **Lunar Space Station** interior.
- Restore the station's Moon Garden and power loop.
- Unlock and board the **Moon Rover** with a visibly faster driving mode.
- Use the rover rescue kit to reach **Luma**, a stranded Moon creature.
- Complete a gentle beacon puzzle to rescue Luma.
- Luma becomes a persistent explorer companion after rescue.
- Progress is sanitized and stored locally with the rest of the vNext preview.
- All new code lives in the separate `src/vnext/lunar-guardian.js` module.

## 🚀 Modular Space Center Foundation

DreamBound uses the modular Living World runtime as the single player-facing game. The previous parallel-runtime split is retired.

- State/storage, input, scenes, world systems, UI and bootstrap modules live under `src/vnext/`.
- Playable Space Center campus with Mission Control, Solar Array, Rocket Workshop, and Launch Pad.
- Launch unlocks a Moon training sector with rover-route navigation and collectible Moon rocks.
- Local preview progress is sanitized before use and stored only in the browser.
- No remote assets, accounts, analytics, ads, chat, fetch/XHR/WebSocket, or external child links.
- The secure local server explicitly allowlists only shipped unified-runtime assets and rejects the legacy runtime.
- DreamShield validates unified runtime files, JavaScript syntax, network isolation, packaging and smoke-test reachability.

Launch DreamBound normally; the advanced Living World is now the only player-facing runtime.

### Legacy migration hardening

- Legacy `game.js` remains statically audited while content is migrated.
- The compatibility bridge is retained in source only to keep migration debt measurable.
- CI prevents the nine known legacy selector-debt sites from growing.
- Neither the legacy game nor its bridge is served or shipped in the unified runtime.

### Runtime hardening

- Local profiles are treated as **untrusted input** and sanitized before use.
- Malformed or oversized saves are quarantined locally instead of crashing the game.
- The Windows launcher uses a dedicated **127.0.0.1-only** DreamBound server.
- The local server exposes only the runtime files needed to play, blocking accidental access to repository files.
- CSP disables runtime network connections, remote scripts, frames, workers and forms.
- Security headers disable framing, MIME sniffing, referrer leakage and sensitive browser permissions.
- CI fuzzes the profile sanitizer with thousands of hostile/randomized inputs.

## 🛡️ DPN DreamShield Security Gates

DreamBound uses a child-focused DPN security model called **DreamShield**.

~~~mermaid
flowchart LR
  PR[Pull Request] --> QG[DPN DreamBound Quality Gate]
  QG --> JS[JavaScript Syntax]
  QG --> SAFE[Child-Safety Runtime Guard]
  QG --> INT[Repository Integrity]
  QG --> SEC[Secret / Dangerous API Guard]
  JS --> GREEN[DreamShield Green Gate]
  SAFE --> GREEN
  INT --> GREEN
  SEC --> GREEN
  PR --> CQL[CodeQL]
  PR --> DEP[Dependency Review]
  GREEN --> MAIN[Protected Main Candidate]
  CQL --> MAIN
  DEP --> MAIN
~~~

### Security layers

- **DPN DreamBound Quality Gate** — source integrity, syntax, child-safety policy and repository checks.
- **Child-Safety Runtime Guard** — rejects remote scripts, external child-facing links, telemetry APIs, WebSockets, dynamic code execution and other unexpected network-capable runtime patterns.
- **CodeQL** — JavaScript/TypeScript static analysis.
- **Dependency Review** — PR supply-chain change analysis.
- **OpenSSF Scorecard** — recurring repository security posture review.
- **Dependabot** — weekly GitHub Actions dependency maintenance.
- **Release Integrity** — tag builds create ZIP + SHA-256 checksum before publishing.
- **Smoke Test** — launches the game through a local HTTP server and verifies the runtime shell is reachable.

Read the full model in [Security Gates](docs/SECURITY_GATES.md) and [Threat Model](docs/THREAT_MODEL.md).

## 🎮 Play locally

### Windows

1. Download or clone the repository.
2. Double-click **PLAY-DREAMBOUND.bat**.
3. DreamBound starts its loopback-only secure local server and opens in the default browser.

If Python is unavailable, the launcher falls back to opening **index.html** directly.

### Controls

| Action | Controls |
| --- | --- |
| Move | WASD / Arrow Keys / Touch D-pad / Gamepad |
| Interact | E / Space / Sparkle button |
| Realms | 🌀 REALMS / DreamGate Nexus |
| Journal | 📖 JOURNAL |
| Companion | 🐇 LUMA |
| Discovery Codex | 📚 CODEX |
| Moon Base | 🏗️ BASE |
| Mastery | 🏆 MASTERY |
| World systems | 🌦️ WORLD |
| Settings & accessibility | ⚙️ SETTINGS |

## 📦 Legacy content migration source

The historical sections and systems below describe content that exists in the retained legacy source and is being migrated into the unified engine. They are **not a second playable runtime** and are not included in release packages.

## 🌟 Story Chapter: The Sleeping Star

v0.6 begins DreamBound's first connected story chapter instead of treating every activity as a separate mini-game.

**The Sleeping Star** sends the explorer through Home Valley and Magic Grove:

1. Meet Pip and learn why the Dream Lantern went dark.
2. Find three glowing **DreamPetals** hidden around Home Valley.
3. Return to the Dream Home and uncover the **Star Compass**.
4. Bring the compass to Mira in Magic Grove.
5. Enter **Moonflower Tower** and solve the Star Chamber memory sequence.
6. Restore the Dream Lantern and permanently reconnect the two lands with starlight.

Finishing the chapter awards the **Star Keeper** sticker, a permanent Dream Lantern decoration, quest rewards, gems and a visible restored lantern in the world.

### 🎨 Avatar Studio

The Dream Home now contains an Avatar Studio with persistent hairstyle and accessory customization. Current options include Star Spikes, Cloud Puffs, Adventure Swoop, Star Glasses, Explorer Cap, Magic Bow, Dino Hood and Star Crown.

### 🚪 Enterable spaces

Moonflower Tower now has a dedicated interior with a moon window, crystals, books, Mira, Magic Lessons and the story-specific Star Chamber. The existing Dream Home interior is expanded with story interactions, Avatar Studio and the permanent Dream Lantern reward.

### 🐾 More expressive DreamCreatures

Unrescued DreamCreatures now sway, bob, sparkle, react visually when the explorer approaches, and show their names nearby.

## 👥 Local sibling co-op

The v0.5 development branch introduces same-screen two-player play. Player 1 hosts the world; Player 2 joins from another saved child profile. Player 2 uses **I/J/K/L + O** or a second gamepad. Both explorers keep their own identity and receive co-op rewards. Three **DreamLink Gates** require both kids to stand on paired pads together.

The system includes a one-screen DreamLink tether to keep younger players together and avoid split-screen complexity in the first co-op milestone.

### Co-op activities now playable

- **DreamLink Team Raceway** — two independently controlled karts with one team score.
- **Team Creature Rescue** — both explorers must high-five before a creature joins both collections.
- **DreamLink Magic Lesson** — alternating Player 1 / Player 2 pattern turns.
- **DreamLink Workshop** — role-based repair challenge with separate Spark Engineer and Gear Engineer jobs.
- **Sibling Stars** — persistent quest tracking unique co-op activities.

## 🗺️ Current lands

**Home Valley → Magic Grove → Racing Ridge → Dino Valley → Builder Bay → Ocean Cove**

Each region has its own visual identity, activities, collectibles and signature landmark.

## 🏡 Dream Home

Players can personalize their Dream Home with persistent furniture and four room themes:

- ☀️ Sunny Sky
- 🌿 Forest Hideout
- 🚀 Star Cabin
- 🐠 Ocean Room

The home also supports Dance Party, Dream Time and DreamBuddy play interactions.

## 💾 Save migration

DreamBound stores progress locally using browser localStorage. Existing WonderWorld v0.1–v0.4 profiles are automatically imported into the DreamBound namespace on first load while the legacy save is left untouched as a fallback.

## 🔐 Child-safety architecture

DreamBound intentionally has a narrow runtime trust boundary:

~~~text
Child Input
   │
   ▼
Local Browser Game
   │
   ├── Local Canvas / Audio / UI
   ├── Local Profile Save (localStorage)
   └── Local HTTP launcher
        │
        └── No required cloud account, analytics or public multiplayer
~~~

Any future feature that expands this boundary—cloud saves, online co-op, accounts, telemetry, external content, AI, voice, chat or user-generated sharing—must receive an explicit security/privacy design review before merge.

## 🧪 Local validation

~~~bash
python3 tools/validate_dreambound.py --mode all
find src/vnext -type f -name "*.js" -print0 | while IFS= read -r -d '' file; do node --check "$file"; done
python3 tools/check_unified_realms.py
~~~

The validator checks the **single shipped runtime**, child-safety invariants, dangerous browser APIs, unexpected external URLs, conflict markers, required policy files, and that legacy migration assets are not player-facing.

## 📚 Engineering documents

| Document | Purpose |
| --- | --- |
| [Security Policy](SECURITY.md) | Responsible disclosure and supported security reports |
| [Contributing](CONTRIBUTING.md) | Contribution and development rules |
| [Security Gates](docs/SECURITY_GATES.md) | CI/CD controls and expected merge gates |
| [Threat Model](docs/THREAT_MODEL.md) | Child-safety and local-runtime trust boundaries |
| [Brand Transition](BRAND-TRANSITION.md) | WonderWorld → DreamBound compatibility notes |
| [Verification](VERIFICATION.md) | v0.4.1 verification record |
| [Changelog](CHANGELOG.md) | Version history |
| [Release Process](docs/RELEASE_PROCESS.md) | Validated packaging and release rules |
| [Third-Party Licenses](THIRD_PARTY_LICENSES.md) | Runtime and CI dependency/license ledger |

## 🌌 v1.2 Living World Director

DreamBound's modular engine now behaves like a persistent **living adventure world**, not a sequence of isolated activities.

- **Dynamic world events** rotate across the Moon: Meteor Shower, Crystal Bloom, Aurora Wave and Luma Star Parade.
- **Physical event targets** appear in the world and award stars, gems, Moon crystals, science finds and persistent event history.
- **Explorer NPCs** Nova, Gear and Moss follow schedules, move around the world, have changing dialogue and build persistent friendship.
- **Moon Base Architect** lets players spend Moon crystals + gems on a permanent Habitat, Observatory, Rover Garage and Moon Greenhouse.
- **Discovery Codex** tracks discoveries, rare events, Luma, engineering finds, base progress and NPC friendship.
- **Cinematic region cards** identify Space Center Campus, Tranquility Basin, Crystal Ridge, Luma Hollow, Moon Base Plateau and Lunar Space Station.
- **Dynamic Adventure Director** evaluates progress and changes event pacing, challenge length and recommendations across four tiers: Guided, Curious, Brave and Master.
- **Explorer Mastery** adds long-term achievements across launch, Luma, world events, base building, science, friendships, travel distance and quests.
- The HUD now surfaces Moon crystals, world-event wins, mastery %, Director tier, Codex, Base and Mastery controls.
- All new state remains local-only, sanitized, fuzzed and covered by DreamShield.

## 🚀 Migration roadmap

The next major work is to deepen the six migrated realms and move the remaining high-value legacy systems into modular engine components: local explorer profiles, richer avatars, Dream Home customization, full racing, dinosaur activities, magic, Builder Mode, Photo Safari, enterable realm interiors, and local sibling co-op.

Once those systems have parity in the unified engine, the migration-only legacy source files can be deleted entirely.

## 🧩 DPN Technology

DreamBound is part of the broader **DPN Technology** ecosystem.

**DEVELOP. PIONEER. NAVIGATE.**

> Repository presentation rule: visuals, security badges and feature claims must remain tied to real repository evidence. DreamBound should look magical for kids without overstating what the build actually does.
