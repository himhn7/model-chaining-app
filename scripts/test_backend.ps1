$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
npm test --prefix backend
Pop-Location
