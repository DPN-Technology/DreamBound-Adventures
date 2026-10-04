@echo off
setlocal
cd /d "%~dp0"
title DreamBound Adventures v0.4.1
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8040
  py -m http.server 8040 --bind 127.0.0.1
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8040
  python -m http.server 8040 --bind 127.0.0.1
  exit /b
)
start "" "%~dp0index.html"
echo Python was not found, so DreamBound Adventures was opened directly in your browser.
pause
