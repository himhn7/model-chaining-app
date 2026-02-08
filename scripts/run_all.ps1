$ErrorActionPreference = 'Stop'
$root = Join-Path $PSScriptRoot '..'

Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$root'; npm run dev --prefix backend"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$root'; npm run dev --prefix frontend"
Write-Host 'Started backend and frontend in separate PowerShell windows.'
