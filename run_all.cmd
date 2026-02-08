@echo off
setlocal

set ROOT=%~dp0

start "Backend" cmd /k "cd /d "%ROOT%" && npm run dev --prefix backend"
start "Frontend" cmd /k "cd /d "%ROOT%" && npm run dev --prefix frontend"

echo Started backend and frontend in separate windows.
endlocal
