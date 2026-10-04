#!/usr/bin/env python3
"""DreamBound v1.8 accessibility and performance contract."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
module=root/"src/vnext/engine/accessibility-performance.js"
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
errors=[]
if not module.is_file():
    errors.append("missing accessibility-performance.js")
else:
    text=module.read_text(encoding="utf-8",errors="replace")
    for marker in ["Explorer Accessibility+","Focus Assist","Calm Effects","World Labels","PERFORMANCE","particleBudget","interactionRadius","dreambound-vnext-accessibility-v1"]:
        if marker not in text: errors.append("accessibility marker: "+marker)
    for token in ["fetch(","XMLHttpRequest","WebSocket(","EventSource(","sendBeacon","document.cookie"]:
        if token in text: errors.append("network/privacy capability: "+token)
if "src/vnext/engine/accessibility-performance.js" not in html: errors.append("html accessibility script")
if '"/src/vnext/engine/accessibility-performance.js"' not in server: errors.append("server accessibility allowlist")
if errors:
    print("::error::DreamBound v1.8 accessibility/performance contract failed: "+", ".join(errors))
    sys.exit(1)
print("DreamBound v1.8 accessibility/performance contract: PASS")
