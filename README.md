# DreamBound Adventures v0.4.1 — Storybook World Build

DreamBound Adventures is a local-first children's exploration game designed for ages **4–8**. It combines open exploration, collecting, building, age-adaptive learning activities, racing, fossils, magic, creature rescue, DreamBuddy friendship, and child-safe progression without ads or public online features.

## DreamBound rebrand

The project formerly known as **WonderWorld Adventures** is now **DreamBound Adventures**. The new title, launcher, in-game labels, companion terminology, collection terminology, and save namespace have been updated while preserving compatibility with previous player profiles.

**Tagline:** *Every Adventure Starts With Imagination.*

## The v0.4 visual leap

v0.4 replaces much of the earlier flat-zone presentation with a new procedural **Storybook World renderer**. The game now draws a richer environment directly in the browser canvas, including layered terrain, biome-specific scenery, roads, boardwalks, race-track geometry, animated water, trees, shrubs, rocks, ferns, crystals, mushrooms, coral, shoreline details, landmark buildings, dynamic shadows, day/night lighting, and a soft cinematic vignette.

The explorer character now has a more complete drawn body, walking animation, facial direction, moving arms and legs, improved shadowing, and a custom-drawn scooter with a moving trail. NPCs, creatures, collectibles, and WonderBuddies are integrated into the richer environment with updated presentation and depth.

## New in v0.4.1

- **Storybook World rendering engine** with richer procedural terrain and scenery
- Distinct visual treatment for all six lands
- Animated Ocean Cove wave shimmer and shoreline details
- Full **Rainbow Speedway** track presentation
- Builder Bay boardwalk and construction scenery
- Dino Valley trails, fossils, ferns, rock formations, and Fossil Hall
- Magic Grove crystals, mushrooms, magical trees, and Moonflower Tower
- Home Valley upgraded house and environment
- New drawn landmark buildings instead of relying only on large emoji markers
- Improved animated explorer character
- Custom-drawn Explorer Scooter and travel trail
- Improved NPC, DreamCreature, DreamBuddy, building, and collectible presentation
- Dynamic sunlight/moonlight treatment and cinematic screen vignette
- **Landmark Legend** progression system
- Six discoverable signature landmarks, one in each land
- New Landmark collection tab
- Landmark status on the Story Map
- **14 total main adventures**
- New Landmark Legend sticker and achievement path
- Upgraded **Dream Home** interior
- Four room themes: Sunny Sky, Forest Hideout, Star Cabin, and Ocean Room
- Home furniture remains persistent between sessions
- Dream Home Dance Party, Dream Time, and Buddy Play interactions
- Better title-screen scenery and Storybook World branding
- Improved HUD depth, quest tracker, level bar, world-event presentation, and modal styling
- Automatic migration of older WonderWorld profile data into DreamBound v0.4.1

## Main game systems

- Three local child profiles
- Ages 4–8 with adaptive challenge scaling
- Six connected regions: Home Valley, Magic Grove, Racing Ridge, Dino Valley, Builder Bay, and Ocean Cove
- Explorer Levels + XP
- Dream Stars and Gems
- 14 main adventures
- Guided Adventure Tracker and off-screen quest compass
- 6 rescueable DreamCreatures
- Six-land Landmark Hunt
- Dream Collection: creatures, stickers, photos, landmarks, and treasures
- DreamBuddy friendship system
- Photo Safari
- Builder Mode
- Customizable Dream Home
- Ridge Raceway
- Dino fossil digging
- Dino Egg Memory
- Brain Sparks adaptive math
- Magic lessons and unlockable spells
- Ocean shell-sequence challenge
- Rainbow Lighthouse challenge
- Rainbow Portal and map fast travel
- Wishing Well
- DreamCreature Sanctuary
- Surprise falling-star world events
- Explorer Scooter
- Dynamic day/night cycle
- Optional rain and sparkle weather
- Spoken narration
- Keyboard, touch, and basic gamepad controls
- Automatic local saves
- Parent-configurable play-break reminders

## Start on Windows

1. Extract the ZIP to a normal folder.
2. Double-click **PLAY-DREAMBOUND.bat**.
3. The launcher starts a small local web server and opens DreamBound in the default browser.

Internet access is not required for gameplay. If Python is not installed, the launcher falls back to opening `index.html` directly.

## Controls

- **Move:** WASD / arrow keys / touch D-pad / gamepad left stick
- **Interact:** E / Space / Enter / sparkle button / gamepad A
- **Adventure Board:** 🧭
- **DreamBuddy:** 💖
- **Photo Safari:** 📸
- **Explorer Scooter:** 🛴
- **Collection:** 🎒
- **Journal:** 📖
- **Magic Wand:** 🪄 after learning magic
- **Builder Mode:** 🧱
- **Map / Fast Travel:** 🗺️
- **Settings:** ⚙️ / Esc

## Save data and migration

Progress is stored with browser `localStorage` on the current device/browser profile. Existing WonderWorld v0.1–v0.4 profiles are automatically imported into the DreamBound save namespace the first time they are loaded. The original WonderWorld browser saves are left untouched as a fallback. DreamBound v0.4.1 preserves landmark progress, Dream Home theme data, quests, collections, and other existing progress.

## Child-safety design

This build contains:

- No ads
- No in-app purchases
- No analytics
- No public chat
- No online accounts
- No strangers or public multiplayer
- No external links presented to children
- No damage/health/combat system
- Parent-controlled optional break reminders

## Verification performed for v0.4.1

- JavaScript syntax validation with Node.js
- Chromium runtime launch using the actual game files
- Fresh child-profile creation through the UI
- Game-screen / HUD / Adventure Tracker startup validation
- Player movement and Landmark discovery validation
- Landmark Collection tab validation
- Dream Home / Tinker interaction validation
- Dream Home room-theme and activity UI validation
- v0.3-style save migration test into the new 14-adventure format
- Runtime exception monitoring during the above tests: **0 exceptions observed**
- ZIP integrity validation during packaging

## Next major directions

The strongest next steps are true animated sprite/asset packs, deeper avatar customization, enterable museum/shop/activity interiors, creature feeding and habitats, additional vehicles, a Space Center and Moon biome, underwater submarine exploration, cinematic story chapters, and real local sibling co-op.
