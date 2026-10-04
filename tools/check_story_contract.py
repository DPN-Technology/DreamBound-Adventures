#!/usr/bin/env python3
"""Preserve DreamBound v0.6 story migration source while the unified engine absorbs it."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
game=(root/"game.js").read_text(encoding="utf-8",errors="replace")
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")
css=(root/"styles.css").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")

required_game={
    "v0.6 marker":"DreamBound v0.6.0-dev — HOME & MAGIC STORY CHAPTER",
    "story quest":"id:'home-magic'",
    "DreamPetals":"const V6_DREAM_PETALS",
    "story migration":"function v6EnsureProfile",
    "story target":"function v6StoryTarget",
    "petal collection":"function v6CheckDreamPetals",
    "avatar studio":"function openAvatarStudio",
    "tower interior":"function openMoonflowerTower",
    "star chamber":"function v6OpenStarChamber",
    "chapter finale":"function v6RestoreDreamLantern",
    "animated creature":"function v6DrawCreatureAnimated",
}
required_css={
    "story card":".story-card",
    "avatar studio":".avatar-studio-preview",
    "tower interior":".tower-interior",
    "star chamber":".star-chamber-sequence",
}
missing=[]
for name,needle in required_game.items():
    if needle not in game: missing.append(name)
for name,needle in required_css.items():
    if needle not in css: missing.append(name)
if game.count("petal-home-") < 3:
    missing.append("three DreamPetal IDs")
if 'src="game.js"' in html or 'href="styles.css"' in html:
    missing.append("legacy story runtime is player-facing")
if '"/game.js"' in server or '"/styles.css"' in server:
    missing.append("legacy story runtime is served")

if missing:
    print("::error::DreamBound legacy story migration contract failed: "+", ".join(missing))
    sys.exit(1)
print("DreamBound legacy story migration contract: PASS")
