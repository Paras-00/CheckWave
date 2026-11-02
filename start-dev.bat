@echo off
echo ===================================================
echo             Starting CheckWave Services
echo ===================================================
echo.

echo [1/2] Starting CheckWave Backend on port 5000...
start "CheckWave Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo [2/2] Starting CheckWave Frontend on port 5173...
start "CheckWave Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo CheckWave is starting!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo ===================================================
echo.
pause
