#!/usr/bin/env python3
"""DreamBound v1. contract."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
core=(root/"src/vnext/core.js").read_text(encoding="utf-8",errors="replace")
boot=(root/"src/vnext/bootstrap.js").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")

engine=[
  "fx.js","audio.js","vehicle.js","scenes.js","quests.js","companion.js","world-polish.js","settings.js"
]
missing=[]
for name in engine:
    path=root/"src/vnext/engine"/name
    if not path.is_file(): missing.append("engine file: "+name)
    marker=f'src/vnext/engine/{name}'
    if marker not in html: missing.append("html script: "+marker)
    if f'"/src/vnext/engine/{name}"' not in server: missing.append("server allowlist: "+name)

for marker in [
  "DreamBound v1.0 Advanced World Engine","v1.2 LIVING WORLD","vnextMinimap",
  "vnextEnergyBar","vnextJournal","vnextSettings","vnextBuddy"
]:
    if marker not in html: missing.append("v1 html marker: "+marker)

for marker in [
  "DBX.VERSION='1.","stationDiscoveries","completedQuests","lumaBond",
  "sceneVisits","totalDistance"
]:
    if marker not in core: missing.append("v1 state marker: "+marker)

for marker in [
  "DBX.vehicle?.step","DBX.fx?.update","DBX.companion?.update",
  "DBX.polish?.drawMinimap","DBX.quests?.renderJournal","DBX.settings?.open"
]:
    if marker not in boot: missing.append("bootstrap integration: "+marker)

runtime="\n".join((root/"src/vnext/engine"/name).read_text(encoding="utf-8",errors="replace") for name in engine)
if re.search(r"https?://",runtime,re.I): missing.append("external URL in engine runtime")
if re.search(r"\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b",runtime):
    missing.append("network-capable API in engine runtime")
if "eval(" in runtime or "new Function(" in runtime:
    missing.append("dynamic code execution in engine runtime")

scripts=re.findall(r'<script src="([^"]+)"',html)
try:
    if scripts.index("src/vnext/engine/scenes.js") < scripts.index("src/vnext/lunar-guardian.js"):
        missing.append("scene engine must load after lunar extension")
    if scripts.index("src/vnext/bootstrap.js") < scripts.index("src/vnext/engine/settings.js"):
        missing.append("bootstrap must load after engine modules")
except ValueError:
    pass

if missing:
    print("::error::DreamBound v1.x advanced engine contract failed: "+", ".join(missing))
    sys.exit(1)
print("DreamBound v1.x advanced engine contract: PASS")
