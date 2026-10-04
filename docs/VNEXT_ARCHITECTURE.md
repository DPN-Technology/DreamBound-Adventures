# DreamBound vNext Architecture

> DPN Technology // DreamBound Advanced World Engine v1.0

DreamBound vNext is the modular runtime that replaces continued growth of the original monolithic `game.js`. The original Storybook World remains available while systems are migrated into this engine.

## Runtime layers

```text
vnext.html
  ├─ core.js                 bounded state, local persistence, event bus
  ├─ input.js                keyboard, touch, gamepad, rumble
  ├─ space-center.js         Space Center + Moon surface world
  ├─ ui.js                   puzzles, rewards, HUD plumbing
  ├─ lunar-guardian.js       Lunar Guardian content module
  └─ engine/
      ├─ fx.js               particles, flash, shake, transitions, lighting
      ├─ audio.js            procedural WebAudio effects
      ├─ vehicle.js          rover physics, boost, energy
      ├─ scenes.js           scene transitions + walkable station interior
      ├─ quests.js           data-driven missions and milestones
      ├─ companion.js        Luma follow AI, moods, bond progression
      ├─ world-polish.js     minimap, guidance, ambient world rendering
      └─ settings.js         accessibility and local presentation settings
          ↓
      bootstrap.js           authoritative update/render loop
```

## Design rules

1. **New gameplay goes into modules.** Do not add new vNext features to the legacy `game.js`.
2. **One authoritative owner per system.** Vehicle rendering belongs to `vehicle.js`; companion behavior belongs to `companion.js`; scene transitions belong to `scenes.js`.
3. **Local-first child runtime.** No accounts, public chat, ads, analytics, remote scripts, remote assets, fetch/XHR/WebSocket/EventSource, or child-facing external links.
4. **State is untrusted.** Persistent values are bounded/allowlisted in `core.js` before use.
5. **No network dependency.** The secure server is loopback-only and exposes an explicit file allowlist.
6. **Every module is gated.** DreamShield recursively syntax-checks and child-safety scans the modular runtime before merge and release.

## State boundary

The vNext save key is local browser storage. Current persisted state includes core progression, Moon rocks, Space Station state, rover unlock/mode, Luma rescue/bond, discoveries, completed quests, badges, distance, stars, and gems.

Malformed storage is discarded back to bounded defaults. Arrays use explicit allowlists where practical and numeric state has hard minimum/maximum bounds.

## Scene model

v1.0 introduces scene-aware bounds and positions. The surface world and Lunar Station can have different coordinate spaces without creating another game loop. New interiors should register through the scene layer rather than becoming modal-only fake rooms.

## Vehicle model

The rover uses acceleration, friction, velocity limiting, boost, battery drain/recharge, particles, and optional controller rumble. Future boats, karts, submarines, and spacecraft should implement the same engine-facing contract rather than custom movement loops.

## Quest model

Missions are data-driven definitions containing state predicates and rewards. The mission journal is rendered from those definitions. Future worlds should add quest definitions instead of hand-writing progress UI.

## Security gates

Relevant checks include:

- DreamShield child-safety runtime policy
- recursive JavaScript syntax sweep
- modular runtime contract
- v1.0 Advanced Engine contract
- save/profile sanitizer fuzzing
- runtime security contract
- workflow security contract
- DOM compatibility debt guard for the legacy game
- CodeQL
- supply-chain/Scorecard checks
- loopback runtime smoke test
- release-package validation and provenance attestation

## Migration direction

The Storybook World remains accessible while Home Valley, creature rescue, racing, building, magic, dinosaurs, ocean exploration, and sibling co-op are progressively moved into vNext modules. When feature parity is reached, the modular runtime can become the single DreamBound gameplay engine and the legacy compatibility bridge can be removed.
