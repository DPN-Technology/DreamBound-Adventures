#!/usr/bin/env python3
"""DreamBound v2 environmental-network contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/environment-network.js"
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing environment-network.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["Environmental Network","Dream Observatory Array","Meteor Sample Analyzer","Moon Greenhouse Lab","Weather Sensor Array","LUNAR RESONANCE SYNCHRONIZED","environment-network-complete","dreambound-v2-environment-network-v1"]:
        if marker not in text: errors.append("environment marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie","eval(","new Function("]:
        if token in text: errors.append("forbidden capability: "+token)
if "src/vnext/engine/environment-network.js" not in html: errors.append("html environmental script")
if '"/src/vnext/engine/environment-network.js"' not in server: errors.append("server environmental allowlist")
if errors:
    print("::error::DreamBound v2 environmental-network contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamBound v2 environmental-network contract: PASS")
