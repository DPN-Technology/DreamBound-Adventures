#!/usr/bin/env python3
"""Preserve DreamBound v0.7 expansion migration source without exposing it as a second game."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
game=(root/"game.js").read_text(encoding="utf-8",errors="replace")
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")
css=(root/"styles.css").read_text(encoding="utf-8",errors="replace")
san=(root/"profile-sanitizer.js").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")

required={
  "v0.7 marker":"DreamBound v0.7.0-dev — THREE WORLDS EXPANSION",
  "new quest":"id:'deep-worlds'",
  "fossil hall":"function openFossilHall",
  "fossil scanner":"function v7OpenFossilScanner",
  "maker workshop":"function openMakerWorkshopV7",
  "gear builder":"function v7OpenGearBuilder",
  "ocean center":"function openOceanDiscoveryCenter",
  "submarine":"function v7OpenSubmarineExpedition",
  "story finale":"function v7FinishSubmarineExpedition",
  "interior tracking":"function v7VisitInterior",
  "world structures":"function v7DrawStructures",
}
missing=[name for name,needle in required.items() if needle not in game]
for needle in [".v7-interior",".v7-sub-window",".v7-blueprint"]:
    if needle not in css: missing.append("style "+needle)
for needle in ["storyV7:{","interiorVisits:","submarineUnlocked:"]:
    if needle not in san: missing.append("sanitizer "+needle)
if re.search(r"(?<!\$)\$\('\.studio-choice\[data-(?:hair|accessory)\]'\)\.forEach",game):
    missing.append("Avatar Studio single-selector regression")
if 'src="game.js"' in html or 'href="styles.css"' in html or 'src="profile-sanitizer.js"' in html:
    missing.append("legacy expansion runtime is player-facing")
for marker in ['"/game.js"','"/styles.css"','"/profile-sanitizer.js"']:
    if marker in server: missing.append("legacy expansion asset served: "+marker)

if missing:
    print("::error::DreamBound legacy expansion migration contract failed: "+", ".join(missing))
    sys.exit(1)
print("DreamBound legacy expansion migration contract: PASS")
