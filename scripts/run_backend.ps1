$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
npm run dev --prefix backend
Pop-Location
