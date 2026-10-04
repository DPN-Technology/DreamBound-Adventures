#!/usr/bin/env python3
"""Security contract for DreamBound's browser and local server boundary."""
from pathlib import Path
import re
import sys
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/"index.html").read_text(encoding="utf-8",errors="replace")
game=(ROOT/"game.js").read_text(encoding="utf-8",errors="replace")
server=(ROOT/"serve_dreambound.py").read_text(encoding="utf-8",errors="replace")
bat=(ROOT/"PLAY-DREAMBOUND.bat").read_text(encoding="utf-8",errors="replace")
ps1=(ROOT/"PLAY-DREAMBOUND.ps1").read_text(encoding="utf-8",errors="replace")
required_html=["Content-Security-Policy","connect-src 'none'","object-src 'none'","frame-src 'none'","base-uri 'none'","profile-sanitizer.js"]
required_server=['("127.0.0.1",args.port)','"X-Content-Type-Options","nosniff"','"X-Frame-Options","DENY"','"Referrer-Policy","no-referrer"','"Permissions-Policy"','ALLOWED={']
missing=[x for x in required_html if x not in html]
missing += [x for x in required_server if x not in server]
if "serve_dreambound.py" not in bat or "serve_dreambound.py" not in ps1: missing.append("secure launcher server")
if "DreamBoundSanitizer.sanitizeProfile" not in game: missing.append("profile sanitization hook")
section=game[game.find("function readStoredProfile"):game.find("function loadProfiles")]
if "try{" not in section: missing.append("malformed-save recovery")
if re.search(r'<script[^>]+src=["\']https?://',html,re.I): missing.append("remote script in index")
if missing:
    print("::error::DreamBound runtime security contract failed: "+", ".join(missing))
    sys.exit(1)
print("DreamBound runtime security contract: PASS")
