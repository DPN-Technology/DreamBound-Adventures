#!/usr/bin/env python3
"""Static DreamBound co-op wiring contract used by CI."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
game=(root/"game.js").read_text(encoding="utf-8",errors="replace")
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")

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
    "co-op HUD":"id=\"coopStatus\"",
}
missing=[]
for name,needle in required.items():
    haystack=html if name=="co-op HUD" else game
    if needle not in haystack: missing.append(name)

gate_ids=["home-link","builder-link","ocean-link"]
for gate in gate_ids:
    if gate not in game: missing.append("gate:"+gate)

if re.search(r"(?<!\$)\$\('\.coop-profile-card'\)\.forEach", game):
    missing.append("selector regression: single-element $ used for co-op profile list")

if missing:
    print("::error::DreamBound co-op contract failed: "+", ".join(missing))
    sys.exit(1)

print("DreamBound co-op contract: PASS")
