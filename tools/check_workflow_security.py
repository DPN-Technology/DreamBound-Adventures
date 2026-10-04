#!/usr/bin/env python3
"""DPN DreamShield contract for GitHub Actions workflow hardening."""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"

PIN_RE = re.compile(r"^\s*uses:\s*([^\s@]+)@([0-9a-f]{40})(?:\s+#\s*.+)?\s*$", re.I)
USES_RE = re.compile(r"^\s*uses:\s*([^\s@]+)@([^\s#]+)", re.I)
DANGEROUS_CONTEXT = re.compile(
    r"\$\{\{\s*github\.event\.(?:issue|pull_request|discussion|comment|review)\.(?:title|body|name)\s*\}\}",
    re.I,
)

errors: list[str] = []

for path in sorted(WORKFLOWS.glob("*.y*ml")):
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    rel = path.relative_to(ROOT)

    if "pull_request_target:" in text:
        errors.append(f"{rel}: pull_request_target is forbidden without an explicit security exception")
    if re.search(r"(?m)^permissions:\s*write-all\s*$", text):
        errors.append(f"{rel}: permissions: write-all is forbidden")
    if re.search(r"(?m)^\s*run:\s*.*(?:curl|wget).*(?:\||>)\s*(?:sh|bash)\b", text):
        errors.append(f"{rel}: download-and-execute shell pattern detected")
    if DANGEROUS_CONTEXT.search(text):
        errors.append(f"{rel}: untrusted GitHub event text is interpolated into workflow source")

    jobs_index = next((i for i,l in enumerate(lines) if l.startswith("jobs:")), len(lines))
    top = "\n".join(lines[:jobs_index])
    if re.search(r"(?m)^\s{2}[a-zA-Z0-9_-]+:\s*write\s*$", top):
        errors.append(f"{rel}: top-level write permission detected; scope writes to the minimum job")

    for i,line in enumerate(lines):
        m = USES_RE.match(line)
        if not m:
            continue
        target = m.group(1)
        if target.startswith("./"):
            continue
        if not PIN_RE.match(line):
            errors.append(f"{rel}:{i+1}: action must be pinned to a full 40-character commit SHA")

        if target.lower() == "actions/checkout":
            block = "\n".join(lines[i+1:i+9])
            if not re.search(r"(?m)^\s+persist-credentials:\s*false\s*$", block):
                errors.append(f"{rel}:{i+1}: actions/checkout must set persist-credentials: false")

if errors:
    for err in errors:
        print(f"::error::{err}")
    print(f"DreamShield workflow security: FAIL ({len(errors)} issue(s))")
    sys.exit(1)

print("DreamShield workflow security: PASS")
