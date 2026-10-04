@echo off
setlocal
cd /d "%~dp0"
title DreamBound Adventures v0.6.1-dev
where py >nul 2>nul
if %errorlevel%==0 (
  py serve_dreambound.py --port 8040
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  python serve_dreambound.py --port 8040
  exit /b
)
start "" "%~dp0index.html"
echo Python was not found, so DreamBound Adventures opened directly with its in-page security policy.
pause
