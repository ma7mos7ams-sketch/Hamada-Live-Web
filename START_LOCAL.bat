@echo off
setlocal
cd /d "%~dp0"
title Hamada LIVE Web
where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js غير مثبت على هذا الجهاز.
  echo ثبّت Node.js 20 أو أحدث ثم شغّل الملف مرة ثانية.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing required components...
  call npm install
  if errorlevel 1 pause & exit /b 1
)
start "" "http://127.0.0.1:8799/"
call npm start
