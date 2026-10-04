#!/usr/bin/env python3
"""DreamBound v1.3 Odyssey Network Adventure Director and Mastery contract."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
core=(root/"src/vnext/core.js").read_text(encoding="utf-8",errors="replace")
boot=(root/"src/vnext/bootstrap.js").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
director=(root/"src/vnext/engine/adventure-director.js").read_text(encoding="utf-8",errors="replace")
ach=(root/"src/vnext/engine/achievements.js").read_text(encoding="utf-8",errors="replace")

missing=[]
for name in ["adventure-director.js","achievements.js"]:
    if not (root/"src/vnext/engine"/name).is_file(): missing.append("module file: "+name)
    if f'src/vnext/engine/{name}' not in html: missing.append("html script: "+name)
    if f'"/src/vnext/engine/{name}"' not in server: missing.append("server allowlist: "+name)

for marker in [
    "DreamBound v1.3 Odyssey Network","vnextDirector","vnextDirectorBtn",
    "vnextMastery","vnextMasteryValue","vnextDirectorHint"
]:
    if marker not in html: missing.append("html marker: "+marker)

for marker in [
    "DBX.VERSION='1.3.0-dev'","masteryAchievements","moonCrystals",
    "baseModules","codexEntries","npcFriendship","eventWins"
]:
    if marker not in core: missing.append("state marker: "+marker)

for marker in [
    "DBX.director?.update(dt)","DBX.achievements?.tick()","DBX.director?.open()",
    "DBX.achievements?.open()"
]:
    if marker not in boot: missing.append("bootstrap integration: "+marker)

for marker in [
    "Adventure Director","challengeLength","eventCadence","recommendation","GUIDED","MASTER"
]:
    if marker not in director: missing.append("director marker: "+marker)

for marker in [
    "Explorer Mastery","DreamBound Master","Moon Architect","World Scholar",
    "masteryAchievements","mastery()"
]:
    if marker not in ach: missing.append("achievement marker: "+marker)

runtime=director+"\n"+ach
if re.search(r"https?://",runtime,re.I): missing.append("external URL in director/mastery runtime")
if re.search(r"\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b",runtime):
    missing.append("network-capable API in director/mastery runtime")
if "eval(" in runtime or "new Function(" in runtime:
    missing.append("dynamic code execution in director/mastery runtime")

scripts=re.findall(r'<script src="([^"]+)"',html)
try:
    if scripts.index("src/vnext/engine/adventure-director.js") < scripts.index("src/vnext/engine/world-events.js"):
        missing.append("director must load after world-events")
    if scripts.index("src/vnext/bootstrap.js") < scripts.index("src/vnext/engine/achievements.js"):
        missing.append("bootstrap must load after mastery systems")
except ValueError:
    pass

if missing:
    print("::error::DreamBound v1.3 Director/Mastery contract failed: "+", ".join(missing))
    sys.exit(1)
print("DreamBound v1.3 Director/Mastery contract: PASS")
