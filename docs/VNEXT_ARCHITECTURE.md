# DreamBound Unified Runtime Architecture

> DPN Technology // DreamBound Adventures // Single Player-Facing Runtime

DreamBound now has one canonical gameplay runtime: `index.html` plus the modular code under `src/vnext/`. The old monolithic Storybook implementation is retained in Git only as migration source; it is not loaded by the game, served by the secure local server, or included in release packages.

## Runtime topology

```text
index.html
  ├─ safe-dom.js                 constrained HTML rendering helpers
  ├─ vnext.css                   base runtime presentation
  ├─ engine/*.css                modular UI systems
  ├─ core.js                     bounded local state + persistence + event bus
  ├─ input.js                    keyboard, touch and controller input
  ├─ space-center.js             Space Center + Moon surface renderer
  ├─ ui.js                       interaction puzzles, rewards and HUD
  ├─ lunar-guardian.js           Lunar Guardian progression
  └─ engine/
      ├─ scenes.js               extensible scene registry and transitions
      ├─ unified-realms.js       six migrated DreamBound realm scenes + DreamGate Atlas
      ├─ unified-world.css       modern visual design layer
      ├─ fx.js / audio.js        local effects and procedural audio
      ├─ vehicle.js              rover physics
      ├─ traversal-progression.js vehicle classes and traversal mastery
      ├─ quests.js               data-driven missions
      ├─ companion.js            Luma companion behavior
      ├─ world-polish.js         scene-aware minimap and interaction polish
      ├─ world-systems.js        weather and surface traversal systems
      ├─ simulation-kernel.js    shared deterministic world state
      ├─ autonomous-world.js     actor goals and evolving zones
      ├─ living-npcs.js          persistent NPC routines
      ├─ living-ecology.js       DreamCreature ecology
      ├─ emergent-ecology.js     relationship memory and emergent events
      ├─ systemic-chains.js      multi-step systemic quest chains
      ├─ environment-network.js  connected science/environment stations
      ├─ world-memory.js         persistent narrative callbacks
      ├─ story-arcs.js           cinematic story progression
      ├─ adventure-director.js   adaptive guidance
      ├─ adventure-deck.js       local adaptive goals
      ├─ procedural-adventures.js deterministic living quests
      ├─ codex.js                discoveries
      ├─ achievements.js         mastery
      ├─ accessibility-performance.js accessibility + adaptive performance
      └─ settings.js             local presentation settings
          ↓
      bootstrap.js               authoritative update/render loop
```

`vnext.html` is only a compatibility redirect to `index.html`; it is not a second game.

## Scene model

`DBX.scene` owns the active coordinate space and exposes a registry:

- `register(id, config)`
- `enter(id, spawn)`
- `exit()`
- `config(id)`
- `nearest()`
- `draw(ctx, t)`
- `clamp(player)`
- `handleInteraction(object)`

The surface, Lunar Station, Home Valley, Magic Grove, Racing Ridge, Dino Valley, Builder Bay, and Ocean Cove all use this same scene layer. Scene exit restores the previous surface position, so DreamGate and station travel return to the correct point.

## Unified realms

The DreamGate Atlas connects six migrated former Storybook lands:

- Home Valley
- Magic Grove
- Racing Ridge
- Dino Valley
- Builder Bay
- Ocean Cove

They share the same HUD, local state boundary, Odyssey progression, cinematic system, event bus, accessibility settings and DreamShield security model. No realm starts a second application or second game loop.

## State boundary

All shipped persistent state is local browser storage and sanitized/bounded before use. The core save contains primary progression; specialized modules keep small allowlisted local state for their own systems. Runtime modules do not require cloud accounts or remote data.

## Rendering and system ownership

1. `bootstrap.js` is the only authoritative frame/update loop.
2. `scenes.js` owns scene selection and coordinate bounds.
3. Surface-only weather/vehicle overlays are gated to the surface scene.
4. `world-polish.js` is scene-aware and renders a generic local minimap outside the surface.
5. Realm modules register content; they do not create independent loops.
6. New content should register providers/scenes/modules rather than override the application entry point.

## Child-safety and network boundary

The shipped runtime is intentionally narrow:

- no ads
- no in-app purchases
- no analytics
- no public chat
- no online accounts
- no strangers
- no remote scripts/assets
- no fetch/XHR/WebSocket/EventSource/sendBeacon
- no child-facing external links
- loopback-only local HTTP server
- CSP with `connect-src 'none'`

The server uses an explicit allowlist and intentionally returns 404 for the old `game.js`, `styles.css`, `profile-sanitizer.js`, and `dom-collection-bridge.js`.

## Legacy migration source

The following remain in Git temporarily:

- `game.js`
- `styles.css`
- `profile-sanitizer.js`
- `dom-collection-bridge.js`

They are migration/reference source only. CI continues to analyze them so old debt cannot silently grow, but official runtime smoke tests and release packages exclude them.

## Security and quality gates

Required evidence includes:

- DreamShield child-safety validation
- unified runtime integrity contract
- recursive modular JavaScript syntax checks
- CodeQL
- zero-tolerance security-and-quality SARIF audit
- supply-chain checks
- loopback smoke test
- unified realm contract
- vNext state fuzzing
- release provenance attestation

No gate should be weakened to make the unified runtime pass.

## Migration direction

Remaining high-value legacy systems should be migrated into modules one system at a time: local profiles, avatar customization, deeper realm interiors, full racing, dinosaur activities, magic, building, Photo Safari and sibling co-op. When parity is reached, delete the migration-only legacy source and its debt guards.
