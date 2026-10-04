#!/usr/bin/env python3
"""DreamBound v2 autonomous-world contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/autonomous-world.js"
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing autonomous-world.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["Autonomous World","goalScores","actorIntent","zoneStage","actor-intent","WORLD AI","dreambound-v2-autonomous-world-v1"]:
        if marker not in text: errors.append("autonomy marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie","eval(","new Function("]:
        if token in text: errors.append("forbidden capability: "+token)
if "src/vnext/engine/autonomous-world.js" not in html: errors.append("html autonomous script")
if '"/src/vnext/engine/autonomous-world.js"' not in server: errors.append("server autonomous allowlist")
if errors:
    print("::error::DreamBound v2 autonomous-world contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamBound v2 autonomous-world contract: PASS")
