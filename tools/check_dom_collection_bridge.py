#!/usr/bin/env python3
"""Guard migration-only legacy selector debt while keeping it out of the shipped runtime."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
game=(root/"game.js").read_text(encoding="utf-8",errors="replace")
bridge=(root/"dom-collection-bridge.js").read_text(encoding="utf-8",errors="replace")
html=(root/"index.html").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")

legacy=re.findall(r"(?<!\$)\$\([^\)\n]*\)\.(forEach|map|filter|some|every|reduce)\(",game)
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
        missing.append("legacy bridge source marker: "+marker)
if 'src="dom-collection-bridge.js"' in html:
    missing.append("legacy bridge must not load in unified index")
if '"/dom-collection-bridge.js"' in server:
    missing.append("legacy bridge must not be served by unified runtime")
if 'src="game.js"' in html:
    missing.append("legacy game must not load in unified index")
if '"/game.js"' in server:
    missing.append("legacy game must not be served by unified runtime")
if missing:
    print("::error::DreamBound migration-debt guard failed: "+", ".join(missing))
    sys.exit(1)
print(f"DreamBound migration-debt guard: PASS ({len(legacy)} legacy selector sites, cap 9; runtime exposure 0)")
