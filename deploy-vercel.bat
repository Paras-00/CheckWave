@echo off
echo ===================================================
echo           Deploying CheckWave to Vercel
echo ===================================================
echo.
echo [1/2] Building frontend production bundle...
cd /d %~dp0frontend
call npm run build

echo.
echo [2/2] Launching Vercel deployment...
npx vercel --prod
echo.
pause
