#!/usr/bin/env python3
"""Loopback-only static server for DreamBound Adventures."""
from __future__ import annotations
import argparse
import os
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parent
ALLOWED={"/index.html","/styles.css","/game.js","/profile-sanitizer.js"}
CSP=("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
     "img-src 'self' data:; font-src 'self' data:; media-src 'self'; "
     "connect-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; "
     "worker-src 'none'; base-uri 'none'; form-action 'none'")

class DreamBoundHandler(SimpleHTTPRequestHandler):
    server_version="DreamBoundLocal/1.0"
    sys_version=""

    def _allowed_path(self):
        path=urlsplit(self.path).path
        if path=="/":
            self.path="/index.html"
            return True
        return path in ALLOWED

    def do_GET(self):
        if not self._allowed_path():
            self.send_error(404);return
        super().do_GET()

    def do_HEAD(self):
        if not self._allowed_path():
            self.send_error(404);return
        super().do_HEAD()

    def do_POST(self):
        self.send_error(405)

    def end_headers(self):
        self.send_header("Content-Security-Policy",CSP)
        self.send_header("Referrer-Policy","no-referrer")
        self.send_header("X-Content-Type-Options","nosniff")
        self.send_header("X-Frame-Options","DENY")
        self.send_header("Cross-Origin-Opener-Policy","same-origin")
        self.send_header("Cross-Origin-Resource-Policy","same-origin")
        self.send_header("Permissions-Policy","camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()")
        self.send_header("Cache-Control","no-store")
        super().end_headers()

    def log_message(self,fmt,*args):
        print("[DreamBound] "+(fmt%args))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--port",type=int,default=8040)
    parser.add_argument("--no-open",action="store_true")
    args=parser.parse_args()
    if not 1024<=args.port<=65535:
        parser.error("port must be between 1024 and 65535")
    os.chdir(ROOT)
    server=ThreadingHTTPServer(("127.0.0.1",args.port),DreamBoundHandler)
    url="http://127.0.0.1:{}/".format(args.port)
    print("DreamBound Adventures secure local server")
    print("Local only: "+url)
    print("Press Ctrl+C to stop.")
    if not args.no_open:
        threading.Timer(0.35,lambda:webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0

if __name__=="__main__":
    raise SystemExit(main())
