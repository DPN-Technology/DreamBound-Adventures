#!/usr/bin/env python3
"""DreamBound v2 simulation-kernel contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/simulation-kernel.js"
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing simulation-kernel.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["DreamBound World Simulation","simulation:snapshot","zoneHeat","actorMood","worldPressure","zone-shift","dreambound-v2-simulation-kernel-v1"]:
        if marker not in text: errors.append("kernel marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie","eval(","new Function("]:
        if token in text: errors.append("forbidden capability: "+token)
if "src/vnext/engine/simulation-kernel.js" not in html: errors.append("html simulation script")
if '"/src/vnext/engine/simulation-kernel.js"' not in server: errors.append("server simulation allowlist")
if errors:
    print("::error::DreamBound v2 simulation kernel contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamBound v2 simulation kernel contract: PASS")
