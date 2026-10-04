#!/usr/bin/env python3
"""DreamBound v2 emergent-ecology contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/emergent-ecology.js"
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing emergent-ecology.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["Emergent Ecology","RELATIONSHIP MEMORY","zoneEcology","emergent-ecology-event","Crystal Gathering","Hollow Playdate","Moon Base Workshop","Stardust Watch","dreambound-v2-emergent-ecology-v1"]:
        if marker not in text: errors.append("ecology marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie","eval(","new Function("]:
        if token in text: errors.append("forbidden capability: "+token)
if "src/vnext/engine/emergent-ecology.js" not in html: errors.append("html emergent ecology script")
if '"/src/vnext/engine/emergent-ecology.js"' not in server: errors.append("server emergent ecology allowlist")
if errors:
    print("::error::DreamBound v2 emergent-ecology contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamBound v2 emergent-ecology contract: PASS")
