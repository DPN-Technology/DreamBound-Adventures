#!/usr/bin/env python3
"""DreamBound autonomous DreamCreature ecology contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/living-ecology.js"
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file(): errors.append("missing living-ecology.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["Cloud Fox","Moon Rockhopper","Lunar Moth","Star Sprite","CREATURE BOND","followUntil","dreambound-vnext-ecology-v1"]:
        if marker not in text: errors.append("ecology marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon"]:
        if token in text: errors.append("network capability: "+token)
if "src/vnext/engine/living-ecology.js" not in html: errors.append("html ecology script")
if '"/src/vnext/engine/living-ecology.js"' not in server: errors.append("server ecology allowlist")
if errors:
    print("::error::DreamCreature ecology contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamCreature autonomous ecology contract: PASS")
