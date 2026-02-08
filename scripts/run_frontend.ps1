$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
npm run dev --prefix frontend
Pop-Location
