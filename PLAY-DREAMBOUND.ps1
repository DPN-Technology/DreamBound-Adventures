$ErrorActionPreference = 'SilentlyContinue'
Set-Location $PSScriptRoot
Start-Process 'http://localhost:8040'
if (Get-Command py) { py -m http.server 8040 --bind 127.0.0.1 }
elseif (Get-Command python) { python -m http.server 8040 --bind 127.0.0.1 }
else { Start-Process (Join-Path $PSScriptRoot 'index.html') }
