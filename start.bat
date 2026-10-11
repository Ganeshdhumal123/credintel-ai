@echo off
setlocal EnableDelayedExpansion
title CredIntel AI - Project Launcher
color 0A

echo.
echo  =====================================================
echo    CredIntel AI - Starting Project
echo  =====================================================
echo.

REM -------------------------------------------------------
REM  ABSOLUTE HARDCODED PATHS  (no dependency on CWD)
REM -------------------------------------------------------
set "ROOT=c:\Users\ganes\Downloads\AI project\credintel-ai"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"
set "VENV_PYTHON=%BACKEND%\venv\Scripts\python.exe"

echo  Project root : %ROOT%
echo  Backend      : %BACKEND%
echo  Frontend     : %FRONTEND%
echo.

REM -------------------------------------------------------
REM  Sanity checks
REM -------------------------------------------------------
if not exist "%ROOT%" (
    echo  [ERROR] Project folder not found:
    echo          %ROOT%
    pause & exit /b 1
)

if not exist "%VENV_PYTHON%" (
    echo  [ERROR] Python venv not found:
    echo          %VENV_PYTHON%
    pause & exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] npm not found. Install Node.js from https://nodejs.org
    pause & exit /b 1
)

REM -------------------------------------------------------
REM  npm install (fetch @tailwindcss/vite + postcss)
REM -------------------------------------------------------
echo  [1/4] Running npm install in frontend...
cd /d "%FRONTEND%"
if errorlevel 1 (
    echo  [ERROR] Could not cd into: %FRONTEND%
    pause & exit /b 1
)
npm install
if errorlevel 1 (
    echo  [ERROR] npm install failed.
    pause & exit /b 1
)
echo  npm install done.
echo.

REM -------------------------------------------------------
REM  Free ports
REM -------------------------------------------------------
echo  [2/4] Freeing ports 8000 and 5173 ...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr " :8000 "') do (
    taskkill /PID %%p /F >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr " :5173 "') do (
    taskkill /PID %%p /F >nul 2>&1
)

REM -------------------------------------------------------
REM  Write helper bat for BACKEND
REM -------------------------------------------------------
set "BHELPER=%TEMP%\credintel_backend.bat"
(
    echo @echo off
    echo title CredIntel Backend ^| http://127.0.0.1:8000
    echo cd /d "c:\Users\ganes\Downloads\AI project\credintel-ai\backend"
    echo echo.
    echo echo  FastAPI backend starting...
    echo echo  API  : http://127.0.0.1:8000
    echo echo  Docs : http://127.0.0.1:8000/docs
    echo echo.
    echo "c:\Users\ganes\Downloads\AI project\credintel-ai\backend\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
    echo pause
) > "%BHELPER%"

REM -------------------------------------------------------
REM  Write helper bat for FRONTEND
REM -------------------------------------------------------
set "FHELPER=%TEMP%\credintel_frontend.bat"
(
    echo @echo off
    echo title CredIntel Frontend ^| http://localhost:5173
    echo cd /d "c:\Users\ganes\Downloads\AI project\credintel-ai\frontend"
    echo echo.
    echo echo  Vite frontend starting...
    echo echo  App : http://localhost:5173
    echo echo.
    echo npm run dev
    echo pause
) > "%FHELPER%"

REM -------------------------------------------------------
REM  Launch windows
REM -------------------------------------------------------
echo  [3/4] Launching Backend  (http://127.0.0.1:8000) ...
start "CredIntel Backend"  cmd /k "%BHELPER%"
timeout /t 3 /nobreak >nul

echo  [4/4] Launching Frontend (http://localhost:5173) ...
start "CredIntel Frontend" cmd /k "%FHELPER%"

REM -------------------------------------------------------
REM  Done
REM -------------------------------------------------------
echo.
echo  =====================================================
echo    Both servers are booting up!
echo  =====================================================
echo.
echo    Backend  API :  http://127.0.0.1:8000
echo    API Docs     :  http://127.0.0.1:8000/docs
echo    Frontend App :  http://localhost:5173
echo.
echo  Close the two terminal windows to stop the servers.
echo  =====================================================
echo.
pause
