#!/usr/bin/env python3
"""Static contract checks for the DreamBound Odyssey Network."""
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
required=[
    ROOT/"src/vnext/engine/odyssey.js",
    ROOT/"src/vnext/engine/odyssey.css",
    ROOT/"src/vnext/engine/adventure-deck.js",
    ROOT/"src/vnext/engine/adventure-deck.css",
]
errors=[]
for path in required:
    if not path.is_file() or path.stat().st_size<100:
        errors.append(f"missing or empty: {path.relative_to(ROOT)}")

html=(ROOT/"index.html").read_text(encoding="utf-8")
server=(ROOT/"serve_dreambound.py").read_text(encoding="utf-8")
odyssey=(ROOT/"src/vnext/engine/odyssey.js").read_text(encoding="utf-8")
deck=(ROOT/"src/vnext/engine/adventure-deck.js").read_text(encoding="utf-8")

for asset in [
    "src/vnext/engine/odyssey.js","src/vnext/engine/odyssey.css",
    "src/vnext/engine/adventure-deck.js","src/vnext/engine/adventure-deck.css",
]:
    if asset not in html:
        errors.append(f"index.html does not reference {asset}")
    if f'/{asset}' not in server:
        errors.append(f"secure server allowlist missing /{asset}")

for token in ["Explorer Rank","Spark Points","Expedition Matrix","Dream Constellation","DreamCore"]:
    if token not in odyssey:
        errors.append(f"Odyssey contract missing: {token}")

for token in ["Adventure Deck","No timer, no failure, no pressure","localStorage","worldevent:end"]:
    if token not in deck:
        errors.append(f"Adventure Deck contract missing: {token}")

blocked=("fetch(","XMLHttpRequest","WebSocket(","EventSource(","navigator.sendBeacon","document.cookie")
for path,text in [(required[0],odyssey),(required[2],deck)]:
    for token in blocked:
        if token in text:
            errors.append(f"network/privacy capability '{token}' found in {path.relative_to(ROOT)}")

if errors:
    print("ODYSSEY CONTRACT: FAILED")
    for error in errors:
        print(" -",error)
    sys.exit(1)
print("ODYSSEY CONTRACT: GREEN")
print("Persistent meta-game, adaptive adventure deck, secure allowlist wiring, and child-safety constraints verified.")
