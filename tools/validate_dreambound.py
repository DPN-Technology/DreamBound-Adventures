#!/usr/bin/env python3
"""DreamBound Adventures repository and child-safety validator."""
from __future__ import annotations
import argparse
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
RUNTIME = [ROOT / "index.html", ROOT / "styles.css", ROOT / "game.js"]
REQUIRED = [
    "index.html", "styles.css", "game.js",
    "PLAY-DREAMBOUND.bat", "PLAY-DREAMBOUND.ps1",
    "README.md", "SECURITY.md", "CONTRIBUTING.md",
    "docs/THREAT_MODEL.md", "docs/SECURITY_GATES.md",
    ".github/CODEOWNERS", ".github/dependabot.yml",
]
FORBIDDEN_RUNTIME = {
    r"https?://": "external URL in child runtime",
    r"\bfetch\s*\(": "fetch/network request",
    r"\bXMLHttpRequest\b": "XMLHttpRequest network API",
    r"\bWebSocket\b": "WebSocket network API",
    r"\bEventSource\b": "EventSource network API",
    r"\bsendBeacon\b": "telemetry/network beacon API",
    r"<iframe\b": "iframe/embed",
    r"<script[^>]+src\\s*=\\s*[\\"\']https?://": "remote script source",
}
DANGEROUS = {
    r"\beval\s*\(": "eval",
    r"\bnew\s+Function\s*\(": "dynamic Function constructor",
    r"\bdocument\.write\s*\(": "document.write",
}
SECRET_PATTERNS = {
    r"(?i)gh[pousr]_[A-Za-z0-9_]{20,}": "GitHub token-like value",
    r"(?i)AKIA[0-9A-Z]{16}": "AWS access key-like value",
    r"(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*[\"'][^\"']{12,}[\"']": "embedded credential-like value",
}
EXPECTED_TEXT = {
    "index.html": ["DreamBound"],
    "game.js": ["DreamBound", "localStorage"],
    "README.md": ["DreamShield", "DPN Technology"],
}

def fail(msg: str) -> None:
    print(f"::error::{msg}")
    raise SystemExit(1)

def read_text(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")

def check_integrity() -> None:
    missing = [p for p in REQUIRED if not (ROOT / p).is_file()]
    if missing:
        fail("Missing required files: " + ", ".join(missing))
    for rel, needles in EXPECTED_TEXT.items():
        data = read_text(ROOT / rel)
        for needle in needles:
            if needle not in data:
                fail(f"{rel}: expected marker not found: {needle}")
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts:
            continue
        if path.suffix.lower() not in {".js",".html",".css",".md",".yml",".yaml",".py",".ps1",".bat"}:
            continue
        data = read_text(path)
        if re.search(r"^(<<<<<<<|=======|>>>>>>>)", data, re.M):
            fail(f"{path.relative_to(ROOT)}: merge conflict marker detected")
    print("DreamBound integrity: PASS")

def check_child_safety() -> None:
    for path in RUNTIME:
        data = read_text(path)
        for pattern, reason in FORBIDDEN_RUNTIME.items():
            if re.search(pattern, data, re.I):
                fail(f"{path.name}: prohibited child-runtime capability detected ({reason})")
    html = read_text(ROOT / "index.html")
    if re.search(r"<a\b[^>]+href\s*=\s*[\"']https?://", html, re.I):
        fail("index.html: external child-facing link detected")
    print("DreamShield child safety: PASS")

def check_security() -> None:
    for path in RUNTIME:
        data = read_text(path)
        for pattern, reason in DANGEROUS.items():
            if re.search(pattern, data, re.I):
                fail(f"{path.name}: dangerous runtime pattern detected ({reason})")
    scan_ext = {".js",".html",".css",".md",".yml",".yaml",".py",".ps1",".bat"}
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts or path.suffix.lower() not in scan_ext:
            continue
        data = read_text(path)
        for pattern, reason in SECRET_PATTERNS.items():
            if re.search(pattern, data):
                fail(f"{path.relative_to(ROOT)}: {reason}")
    print("DreamBound security baseline: PASS")

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["all","integrity","child-safety","security"], default="all")
    args = parser.parse_args()
    if args.mode in ("all","integrity"):
        check_integrity()
    if args.mode in ("all","child-safety"):
        check_child_safety()
    if args.mode in ("all","security"):
        check_security()
    print("DPN DREAMSHIELD VALIDATION: GREEN")
    return 0

if __name__ == "__main__":
    sys.exit(main())
