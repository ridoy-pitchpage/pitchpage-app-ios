@echo off
REM ===================================================================
REM  Double-click this file to run PitchPage on your PC.
REM
REM  It installs the app's dependencies the first time (a few minutes),
REM  then starts it and opens your browser. Nothing is installed outside
REM  this folder except Node.js, which you install once from nodejs.org.
REM ===================================================================
title PitchPage
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed yet.
  echo.
  echo   1. Go to  https://nodejs.org
  echo   2. Download the big green "LTS" button and install it
  echo   3. Close this window, then double-click this file again
  echo.
  pause
  exit /b 1
)

echo.
echo   Using Node:
node -v
echo.

if not exist "node_modules\" (
  echo   First run - installing the app. This takes a few minutes.
  echo   You only have to wait for this once.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   Install failed. Copy the red text above and send it to Claude.
    pause
    exit /b 1
  )
)

echo.
echo   Starting PitchPage...
echo   Your browser should open by itself. If it does not, go to:
echo.
echo       http://localhost:8081
echo.
echo   Leave this window OPEN while you use the app.
echo   Close it, or press Ctrl+C, to stop.
echo.
call npm run web
pause
