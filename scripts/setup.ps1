$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
npm install --prefix backend
npm install --prefix frontend
Pop-Location
