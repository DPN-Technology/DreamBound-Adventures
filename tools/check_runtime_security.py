#!/usr/bin/env python3
"""Security contract for DreamBound's single browser runtime and loopback server."""
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/"index.html").read_text(encoding="utf-8",errors="replace")
alias=(ROOT/"vnext.html").read_text(encoding="utf-8",errors="replace")
server=(ROOT/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
bat=(ROOT/"PLAY-DREAMBOUND.bat").read_text(encoding="utf-8",errors="replace")
ps1=(ROOT/"PLAY-DREAMBOUND.ps1").read_text(encoding="utf-8",errors="replace")

required_html=[
    "Content-Security-Policy","connect-src 'none'","object-src 'none'",
    "frame-src 'none'","base-uri 'none'","safe-dom.js",
    "src/vnext/core.js","src/vnext/engine/unified-realms.js","src/vnext/bootstrap.js",
]
required_server=[
    '("127.0.0.1",args.port)','"X-Content-Type-Options","nosniff"',
    '"X-Frame-Options","DENY"','"Referrer-Policy","no-referrer"',
    '"Permissions-Policy"','ALLOWED={','"/safe-dom.js"',
    '"/src/vnext/core.js"','"/src/vnext/bootstrap.js"',
]
legacy_runtime=['"/game.js"','"/styles.css"','"/profile-sanitizer.js"','"/dom-collection-bridge.js"']
legacy_index=['src="game.js"','href="styles.css"','src="profile-sanitizer.js"','src="dom-collection-bridge.js"']

missing=[x for x in required_html if x not in html]
missing += [x for x in required_server if x not in server]
if "serve_dreambound.py" not in bat or "serve_dreambound.py" not in ps1:
    missing.append("secure launcher server")
if "url=index.html" not in alias:
    missing.append("vnext compatibility alias")
if re.search(r'<script[^>]+src=["\']https?://',html,re.I):
    missing.append("remote script in index")
for marker in legacy_index:
    if marker in html:
        missing.append("legacy runtime loaded by index: "+marker)
for marker in legacy_runtime:
    if marker in server:
        missing.append("legacy runtime exposed by secure server: "+marker)

if missing:
    print("::error::DreamBound unified runtime security contract failed: "+", ".join(missing))
    sys.exit(1)
print("DreamBound unified runtime security contract: PASS")
