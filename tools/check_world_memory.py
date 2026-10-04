#!/usr/bin/env python3
"""DreamBound v2 world-memory contract."""
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/world-memory.js"
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing world-memory.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["World Memory","WORLD MEMORY","adaptiveHint","memory-echo","narrativeContext","dreambound-v2-world-memory-v1"]:
        if marker not in text: errors.append("memory marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie","eval(","new Function("]:
        if token in text: errors.append("forbidden capability: "+token)
if "src/vnext/engine/world-memory.js" not in html: errors.append("html world memory script")
if '"/src/vnext/engine/world-memory.js"' not in server: errors.append("server world memory allowlist")
if errors:
    print("::error::DreamBound v2 world-memory contract failed: "+", ".join(errors));sys.exit(1)
print("DreamBound v2 world-memory contract: PASS")
