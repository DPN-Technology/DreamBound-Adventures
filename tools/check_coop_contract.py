#!/usr/bin/env python3
"""Preserve DreamBound's legacy co-op migration source without shipping a second runtime."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
game=(root/"game.js").read_text(encoding="utf-8",errors="replace")
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")

required={
    "co-op button hook":"$('#coopBtn').onclick=openCoopCenter",
    "multi-profile selector":"$$('.coop-profile-card').forEach",
    "guest save":"localStorage.setItem(profileKey(state.coop.slot)",
    "second keyboard left":"state.keys.j",
    "second keyboard right":"state.keys.l",
    "second gamepad":"navigator.getGamepads?.()[1]",
    "DreamLink gates":"const DREAMLINK_GATES",
    "team race":"function openCoopRaceGame",
    "team rescue":"Team Creature Rescue!",
    "team magic":"function openCoopMagicLesson",
    "team repair":"function openTeamRepair",
    "Sibling Stars quest":"id:'teamplay'",
    "co-op HUD integration":"#coopStatus",
}
missing=[name for name,needle in required.items() if needle not in game]

for gate in ["home-link","builder-link","ocean-link"]:
    if gate not in game: missing.append("gate:"+gate)

if re.search(r"(?<!\$)\$\('\.coop-profile-card'\)\.forEach",game):
    missing.append("selector regression: single-element $ used for co-op profile list")
if 'src="game.js"' in html:
    missing.append("legacy co-op runtime must not load in unified index")
if '"/game.js"' in server:
    missing.append("legacy co-op runtime must not be served")

if missing:
    print("::error::DreamBound legacy co-op migration contract failed: "+", ".join(missing))
    sys.exit(1)
print("DreamBound legacy co-op migration contract: PASS")
