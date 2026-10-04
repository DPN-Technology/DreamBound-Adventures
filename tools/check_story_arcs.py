#!/usr/bin/env python3
"""DreamBound v1.5 cinematic story arc contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/story-arcs.js"
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing story-arcs.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["The Startrail Mystery","Starlight Beacon","Echo Shard","Dream Observatory","Calm the Starwell","STORY COMPLETE","dreambound-vnext-story-arcs-v1"]:
        if marker not in text: errors.append("story marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie"]:
        if token in text: errors.append("network/privacy capability: "+token)
if "src/vnext/engine/story-arcs.js" not in html: errors.append("html story script")
if '"/src/vnext/engine/story-arcs.js"' not in server: errors.append("server story allowlist")
if errors:
    print("::error::DreamBound v1.5 cinematic story contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamBound v1.5 cinematic story contract: PASS")
