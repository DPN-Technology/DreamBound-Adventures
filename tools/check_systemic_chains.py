#!/usr/bin/env python3
"""DreamBound v2 systemic quest-chain contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/systemic-chains.js"
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing systemic-chains.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["Systemic Quest Chains","Crystal Resonance","Moon Base Rally","Creature Crossroads","Startrail Afterglow","Persistent world consequence","systemic-chain-complete","dreambound-v2-systemic-chains-v1"]:
        if marker not in text: errors.append("chain marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie","eval(","new Function("]:
        if token in text: errors.append("forbidden capability: "+token)
if "src/vnext/engine/systemic-chains.js" not in html: errors.append("html systemic chain script")
if '"/src/vnext/engine/systemic-chains.js"' not in server: errors.append("server systemic chain allowlist")
if errors:
    print("::error::DreamBound v2 systemic quest-chain contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamBound v2 systemic quest-chain contract: PASS")
