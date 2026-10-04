#!/usr/bin/env python3
"""DreamBound v2 traversal-progression contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/traversal-progression.js"
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing traversal-progression.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["Traversal Command","Moon Rover","Moon Skimmer","Star Glider","TRAVERSAL RANK","traversal-discovery","vehicleStats","dreambound-v2-traversal-progression-v1"]:
        if marker not in text: errors.append("traversal marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie","eval(","new Function("]:
        if token in text: errors.append("forbidden capability: "+token)
if "src/vnext/engine/traversal-progression.js" not in html: errors.append("html traversal script")
if '"/src/vnext/engine/traversal-progression.js"' not in server: errors.append("server traversal allowlist")
if errors:
    print("::error::DreamBound v2 traversal-progression contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamBound v2 traversal-progression contract: PASS")
