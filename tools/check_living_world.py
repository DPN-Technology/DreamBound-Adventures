#!/usr/bin/env python3
"""DreamBound v1.3 Odyssey Network contract."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
core=(root/"src/vnext/core.js").read_text(encoding="utf-8",errors="replace")
boot=(root/"src/vnext/bootstrap.js").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
quests=(root/"src/vnext/engine/quests.js").read_text(encoding="utf-8",errors="replace")

modules=["world-events.js","npcs.js","base-builder.js","codex.js","cinematic.js"]
missing=[]
for name in modules:
    path=root/"src/vnext/engine"/name
    if not path.is_file():
        missing.append("module file: "+name)
    if f'src/vnext/engine/{name}' not in html:
        missing.append("html script: "+name)
    if f'"/src/vnext/engine/{name}"' not in server:
        missing.append("server allowlist: "+name)

for marker in [
    "DreamBound v1.3 Odyssey Network","v1.3 ODYSSEY NETWORK","vnextWorldEvent",
    "vnextCinematic","vnextCodex","vnextBase","vnextCrystals","vnextEventWins"
]:
    if marker not in html:
        missing.append("html marker: "+marker)

for marker in [
    "DBX.VERSION='1.3.0-dev'","moonCrystals","baseModules","codexEntries",
    "completedWorldEvents","npcFriendship","meteorSamples","auroraSeen","eventWins"
]:
    if marker not in core:
        missing.append("state marker: "+marker)

for marker in [
    "DBX.worldEvents?.update(dt)","DBX.cinematic?.update(dt)",
    "DBX.codex?.open()","DBX.baseBuilder?.open()"
]:
    if marker not in boot:
        missing.append("bootstrap integration: "+marker)

runtime="\n".join((root/"src/vnext/engine"/name).read_text(encoding="utf-8",errors="replace") for name in modules)
for marker in [
    "Meteor Shower","Crystal Bloom","Aurora Wave","Luma Star Parade",
    "Nova","Gear","Moss","Moon Base Architect","Discovery Codex"
]:
    if marker not in runtime:
        missing.append("living system marker: "+marker)

for marker in ["living-moon","moon-architect","world-scholar","Living Moon Explorer","Moon Architect","World Scholar"]:
    if marker not in quests:
        missing.append("quest integration: "+marker)

if re.search(r"https?://",runtime,re.I):
    missing.append("external URL in Living Moon runtime")
if re.search(r"\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b",runtime):
    missing.append("network-capable API in Living Moon runtime")
if "eval(" in runtime or "new Function(" in runtime:
    missing.append("dynamic code execution in Living Moon runtime")

scripts=re.findall(r'<script src="([^"]+)"',html)
try:
    if scripts.index("src/vnext/engine/world-events.js") < scripts.index("src/vnext/engine/scenes.js"):
        missing.append("living-world extensions must load after scene engine")
    if scripts.index("src/vnext/bootstrap.js") < scripts.index("src/vnext/engine/cinematic.js"):
        missing.append("bootstrap must load after Living Moon modules")
except ValueError:
    pass

if missing:
    print("::error::DreamBound v1.3 Odyssey Network contract failed: "+", ".join(missing))
    sys.exit(1)

print("DreamBound v1.3 Odyssey Network contract: PASS")
