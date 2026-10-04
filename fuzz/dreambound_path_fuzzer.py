#!/usr/bin/env python3
"""Coverage-guided fuzz target for DreamBound's loopback path allowlist."""
import sys
from urllib.parse import urlsplit
import atheris

with atheris.instrument_imports():
    import serve_dreambound


def test_one_input(data: bytes) -> None:
    path = data[:4096].decode("utf-8", errors="ignore")
    handler = object.__new__(serve_dreambound.DreamBoundHandler)
    handler.path = path

    try:
        allowed = handler._allowed_path()
        normalized = urlsplit(path).path
    except (ValueError, UnicodeError):
        return

    if allowed:
        assert normalized == "/" or normalized in serve_dreambound.ALLOWED
        if normalized == "/":
            assert handler.path == "/index.html"
    elif normalized != "/":
        assert normalized not in serve_dreambound.ALLOWED


def main() -> None:
    atheris.Setup(sys.argv, test_one_input)
    atheris.Fuzz()


if __name__ == "__main__":
    main()
