#!/usr/bin/env python3
"""Contract for DreamBound v0.9 modular Lunar Guardian preview."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
html=(root/"vnext.html").read_text(encoding="utf-8",errors="replace")
core=(root/"src/vnext/core.js").read_text(encoding="utf-8",errors="replace")
ui=(root/"src/vnext/ui.js").read_text(encoding="utf-8",errors="replace")
boot=(root/"src/vnext/bootstrap.js").read_text(encoding="utf-8",errors="replace")
world=(root/"src/vnext/space-center.js").read_text(encoding="utf-8",errors="replace")
lunar=(root/"src/vnext/lunar-guardian.js").read_text(encoding="utf-8",errors="replace")
server=(root/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
main=(root/"index.html").read_text(encoding="utf-8",errors="replace")

required_files=[
  "vnext.html","vnext.css","src/vnext/core.js","src/vnext/input.js",
  "src/vnext/space-center.js","src/vnext/ui.js","src/vnext/lunar-guardian.js","src/vnext/bootstrap.js"
]
missing=[p for p in required_files if not (root/p).is_file()]

for marker in [
  "DreamBound v0.9 Lunar Guardian Preview",
  "connect-src 'none'",
  'src/vnext/core.js','src/vnext/input.js','src/vnext/space-center.js','src/vnext/ui.js','src/vnext/lunar-guardian.js','src/vnext/bootstrap.js'
]:
    if marker not in html: missing.append("html marker: "+marker)

for marker in [
  "DBX.VERSION='0.9.0-dev'","sanitize(raw)","dreambound-vnext-space-v1",
  "localStorage.getItem","localStorage.setItem"
]:
    if marker not in core: missing.append("core marker: "+marker)

for marker in ["Decode the Star Signal","Restore Solar Power","Assemble the Explorer Rocket","Map the Moon Rover Route"]:
    if marker not in ui: missing.append("gameplay marker: "+marker)

for marker in ["requestAnimationFrame(loop)","DBX.world.draw","DBX.input.vector","DBX.ui.interact"]:
    if marker not in boot: missing.append("bootstrap marker: "+marker)

for marker in ["Mission Control","Solar Array","Rocket Workshop","Launch Pad","Moon Rover Console"]:
    if marker not in world: missing.append("world marker: "+marker)

for marker in ["Lunar Space Station","Moon Rover Bay","Rescue Luma","Moon Garden","Lunar Guardian"]:
    if marker not in lunar: missing.append("lunar marker: "+marker)

if 'href="vnext.html"' not in main: missing.append("main-game preview link")

allow=[
  '"/vnext.html"','"/vnext.css"','"/src/vnext/core.js"','"/src/vnext/input.js"',
  '"/src/vnext/space-center.js"','"/src/vnext/ui.js"','"/src/vnext/lunar-guardian.js"','"/src/vnext/bootstrap.js"'
]
for marker in allow:
    if marker not in server: missing.append("secure server allowlist: "+marker)

runtime_text="\n".join((root/p).read_text(encoding="utf-8",errors="replace") for p in required_files)
if re.search(r"https?://",runtime_text,re.I): missing.append("external URL in modular child runtime")
if re.search(r"\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b",runtime_text): missing.append("network-capable API in modular runtime")

if missing:
    print("::error::DreamBound v0.9 modular runtime contract failed: "+", ".join(missing))
    sys.exit(1)
print("DreamBound v0.9 modular runtime contract: PASS")
