#!/usr/bin/env python3
"""Guard DreamBound's legacy single-selector collection compatibility surface."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
game=(root/"game.js").read_text(encoding="utf-8",errors="replace")
bridge=(root/"dom-collection-bridge.js").read_text(encoding="utf-8",errors="replace")
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")

legacy=re.findall(r"(?<!\$)\$\([^\n]*?\)\.(forEach|map|filter|some|every|reduce)\(",game)
missing=[]
if len(legacy)>9:
    missing.append(f"legacy selector debt grew from 9 to {len(legacy)} sites")
if any(method!="forEach" for method in legacy):
    missing.append("new collection method introduced through single-element $()")
for marker in [
    "const selectorFor = new WeakMap()",
    "Document.prototype.querySelector",
    "nativeQuerySelectorAll",
    "Object.defineProperty(Element.prototype",
]:
    if marker not in bridge:
        missing.append("bridge marker: "+marker)
if 'src="dom-collection-bridge.js"' not in html:
    missing.append("bridge script tag")
if html.find('src="dom-collection-bridge.js"') > html.find('src="game.js"'):
    missing.append("bridge must load before game.js")
if '"/dom-collection-bridge.js"' not in server:
    missing.append("secure server allowlist entry")
if missing:
    print("::error::DreamBound DOM collection bridge contract failed: "+", ".join(missing))
    sys.exit(1)
print(f"DreamBound DOM collection bridge contract: PASS ({len(legacy)} legacy sites, cap 9)")
