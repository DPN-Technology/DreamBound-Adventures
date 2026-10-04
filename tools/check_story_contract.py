#!/usr/bin/env python3
"""Static contract for DreamBound v0.6 Home & Magic chapter wiring."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
game=(root/"game.js").read_text(encoding="utf-8",errors="replace")
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")
css=(root/"styles.css").read_text(encoding="utf-8",errors="replace")

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
required_html={
    "v0.6 page version":"DreamBound Adventures v0.6.",
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
for name,needle in required_html.items():
    if needle not in html: missing.append(name)
for name,needle in required_css.items():
    if needle not in css: missing.append(name)

if game.count("petal-home-") < 3:
    missing.append("three DreamPetal IDs")

if missing:
    print("::error::DreamBound v0.6 story contract failed: "+", ".join(missing))
    sys.exit(1)

print("DreamBound v0.6 story contract: PASS")
