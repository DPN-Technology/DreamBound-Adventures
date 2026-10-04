$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (Get-Command py -ErrorAction SilentlyContinue) { py serve_dreambound.py --port 8040 }
elseif (Get-Command python -ErrorAction SilentlyContinue) { python serve_dreambound.py --port 8040 }
else { Start-Process (Join-Path $PSScriptRoot 'index.html') }
