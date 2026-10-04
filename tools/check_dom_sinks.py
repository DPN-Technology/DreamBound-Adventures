#!/usr/bin/env python3
"""Reject raw DOM HTML sinks outside the reviewed safe renderer."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
targets=[root/"game.js",root/"src"/"vnext"]
tokens=("innerHTML","outerHTML","insertAdjacentHTML")
errors=[]
for target in targets:
    files=[target] if target.is_file() else list(target.rglob("*.js"))
    for path in files:
        text=path.read_text(encoding="utf-8",errors="replace")
        for token in tokens:
            if token in text:
                errors.append(f"{path.relative_to(root)} contains forbidden raw DOM sink {token}")
if errors:
    for err in errors: print("::error::"+err)
    sys.exit(1)
print("DreamBound DOM sink guard: PASS")
