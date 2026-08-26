@echo off
setlocal
cd /d "%~dp0"
title Deploy Hamada LIVE Web V28.1

echo ===============================================
echo   HAMADA LIVE WEB - CLOUDFLARE DEPLOY
echo ===============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Install Node.js 20 or newer, then run this file again.
  pause
  exit /b 1
)

where docker >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker Desktop is not installed.
  echo Install Docker Desktop and make sure it is running.
  pause
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker Desktop is installed but not running.
  echo Start Docker Desktop, wait until it is ready, then retry.
  pause
  exit /b 1
)

echo [1/3] Installing project dependencies...
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed.
  pause
  exit /b 1
)

echo.
echo [2/3] Cloudflare login will open in your browser...
call npx wrangler login
if errorlevel 1 (
  echo ERROR: Cloudflare login failed.
  pause
  exit /b 1
)

echo.
echo [3/3] Deploying Worker + Container...
call npx wrangler deploy
if errorlevel 1 (
  echo ERROR: Deployment failed. Copy the error shown above.
  pause
  exit /b 1
)

echo.
echo ===============================================
echo DEPLOYMENT FINISHED.
echo Copy the workers.dev URL printed above.
echo Control panel:  https://YOUR-URL/
echo Overlay:        https://YOUR-URL/overlay
echo ===============================================
pause
