@echo off
setlocal ENABLEEXTENSIONS
color 0A
title Charlie Tool FastAPI Launcher

set PORT=3000
set MODULE=main:app

echo ============================================
echo 🔥 Starting Charlie Tool FastAPI Frontend Server
echo ============================================
echo Time: %DATE% %TIME%
echo Port: %PORT%
echo --------------------------------------------

:: Step 0: Check Python
echo 🐍 Checking for Python installation...
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found.
    echo 👉 Downloading Python 3.11 installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe' -OutFile 'python-installer.exe'"
    echo 🚀 Launching Python installer...
    start /wait python-installer.exe /quiet InstallAllUsers=1 PrependPath=1
    del python-installer.exe
)

:: Step 1: Check Node.js
echo 🧠 Checking for Node.js installation...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found.
    echo 👉 Downloading Node.js LTS installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.18.2/node-v18.18.2-x64.msi' -OutFile 'node-installer.msi'"
    echo 🚀 Launching Node.js installer...
    start /wait msiexec /i node-installer.msi /quiet
    del node-installer.msi
)

:: Step 2: Check Uvicorn (safe way)
echo 🧩 Ensuring Uvicorn + FastAPI installed...
python -m pip show uvicorn >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo 📦 Installing uvicorn + fastapi...
    python -m pip install --user uvicorn fastapi
)

:: Step 3: Kill process on port if running
echo 🔍 Checking for process on port %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do (
    echo ⚠️ Port %PORT% is used by PID %%a. Killing it...
    taskkill /F /PID %%a >nul 2>&1
    if %ERRORLEVEL%==0 (
        echo ✅ Successfully killed PID %%a
    ) else (
        echo ❌ Failed to kill PID %%a
    )
)

:: Step 4: Launch FastAPI
echo 🚀 Starting FastAPI server on http://localhost:%PORT%
start "" http://localhost:%PORT%
python -m uvicorn %MODULE% --port %PORT%
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to launch FastAPI server. Check module path: %MODULE%
    goto END
)
echo Keep this window open to keep the frontend running.
:END
pause >nul
