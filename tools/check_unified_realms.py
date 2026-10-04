#!/usr/bin/env python3
"""DreamBound unified-realm contract."""
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/unified-realms.js"
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing unified-realms.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["DreamGate Atlas","Home Valley","Magic Grove","Racing Ridge","Dino Valley","Builder Bay","Ocean Cove","dreambound-unified-realms-v1"]:
        if marker not in text: errors.append("realm marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie","eval(","new Function("]:
        if token in text: errors.append("forbidden capability: "+token)
if "src/vnext/engine/unified-realms.js" not in html: errors.append("index unified realms script")
if "src/vnext/engine/unified-world.css" not in html: errors.append("index unified realm stylesheet")
if '"/src/vnext/engine/unified-realms.js"' not in server: errors.append("server unified realms allowlist")
if '"/src/vnext/engine/unified-world.css"' not in server: errors.append("server unified realm stylesheet allowlist")
if errors:
    print("::error::DreamBound unified-realm contract failed: "+", ".join(errors));sys.exit(1)
print("DreamBound unified-realm contract: PASS")
