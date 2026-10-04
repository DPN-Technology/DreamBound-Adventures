#!/usr/bin/env python3
"""DreamBound v1.7 procedural living-adventure contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/procedural-adventures.js"
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing procedural-adventures.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["Living Adventure Generator","Weather Watch","Explorer Assist","DreamCreature Day","Outpost Patrol","Trail of Wonders","Crystal Route","dreambound-vnext-procedural-adventures-v1"]:
        if marker not in text: errors.append("procedural marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie","eval(","new Function("]:
        if token in text: errors.append("network/dynamic capability: "+token)
if "src/vnext/engine/procedural-adventures.js" not in html: errors.append("html procedural script")
if '"/src/vnext/engine/procedural-adventures.js"' not in server: errors.append("server procedural allowlist")
if errors:
    print("::error::DreamBound v1.7 procedural adventure contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamBound v1.7 procedural adventure contract: PASS")
