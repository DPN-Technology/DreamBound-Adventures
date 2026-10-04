#!/usr/bin/env python3
"""DreamBound v1.4 world systems contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/world-systems.js"
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file(): errors.append("missing world-systems.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["World Systems","Moon Skimmer","stardust","crystal-glow","skimmerUnlocked","dreambound-vnext-world-systems-v1"]:
        if marker not in text: errors.append("world marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon"]:
        if token in text: errors.append("network capability: "+token)
if "src/vnext/engine/world-systems.js" not in html: errors.append("html world systems script")
if '"/src/vnext/engine/world-systems.js"' not in server: errors.append("server world systems allowlist")
if errors:
    print("::error::DreamBound v1.4 world systems contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamBound v1.4 world systems contract: PASS")
