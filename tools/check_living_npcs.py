#!/usr/bin/env python3
"""DreamBound v1.6 living NPC routines contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/living-npcs.js"
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing living-npcs.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["NAVIGATION SHIFT","CONSTELLATION WATCH","ROVER SERVICE","BASE INSPECTION","LUNAR BIOLOGY","CRYSTAL STUDY","contextualLine","dreambound-vnext-npc-routines-v1"]:
        if marker not in text: errors.append("npc marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie"]:
        if token in text: errors.append("network/privacy capability: "+token)
if "src/vnext/engine/living-npcs.js" not in html: errors.append("html living NPC script")
if '"/src/vnext/engine/living-npcs.js"' not in server: errors.append("server living NPC allowlist")
if errors:
    print("::error::DreamBound v1.6 living NPC contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamBound v1.6 living NPC contract: PASS")
