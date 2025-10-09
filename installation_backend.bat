@echo off
setlocal ENABLEEXTENSIONS
color 0A
title Charlie Tool Backend Setup

echo ================================
echo    Charlie Tool Backend Setup
echo ================================

REM ✅ Move into Server directory
pushd Server

:: Step 0: Kill process on port 8000
echo.
echo [0] Checking and killing process on port 8000 if exists...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') DO (
    echo ⚠️ Killing PID %%P...
    taskkill /F /PID %%P >nul 2>&1
)

:: Step 1: Cleanup previous venv & __pycache__
echo.
echo [1] Cleaning up previous virtual environment and __pycache__ folders...

IF EXIST "venv" (
    echo 🧹 Removing existing venv...
    rmdir /S /Q venv
) ELSE (
    echo ✅ No existing venv found.
)

echo 🔍 Scanning for __pycache__ folders...
FOR /D /R %%d IN (__pycache__) DO (
    echo 🧹 Removing %%d...
    rmdir /S /Q "%%d"
)

:: Step 2: Check Python
echo.
echo [2] Checking Python...
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found. Installing Python 3.11...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe' -OutFile 'python-installer.exe'"
    echo 🔄 Launching Python installer...
    start /wait python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    del python-installer.exe

    echo 🔁 Re-checking Python after install...
    python --version >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        echo ❌ Python installation failed or not in PATH.
        pause
        popd
        exit /b
    )
)

:: Step 3: Create virtual environment
echo.
echo [3] Creating new virtual environment...
python -m venv venv
IF NOT EXIST "venv" (
    echo ❌ Failed to create virtual environment.
    pause
    popd
    exit /b
)

:: Step 4: Activate virtual environment
echo.
echo [4] Activating virtual environment...
call venv\Scripts\activate.bat
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to activate virtual environment.
    pause
    popd
    exit /b
)

:: Step 5: Install dependencies
echo.
echo [5] Installing dependencies...
IF EXIST requirements.txt (
    echo ✅ Found requirements.txt
    venv\Scripts\python.exe -m pip install -r requirements.txt
) ELSE IF EXIST Requirements.txt (
    echo ✅ Found Requirements.txt
    venv\Scripts\python.exe -m pip install -r Requirements.txt
) ELSE (
    echo ❌ No requirements file found.
    pause
    popd
    exit /b
)

:: Step 6: Verify Main.py exists
echo.
echo [6] Checking Main.py...
IF NOT EXIST Main.py (
    echo ❌ Main.py not found in Server directory!
    pause
    popd
    exit /b
)

:: Step 7: Run server
echo.
echo [7] Starting FastAPI server with Uvicorn...
venv\Scripts\python.exe -m pip show uvicorn >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Uvicorn not installed, installing now...
    venv\Scripts\python.exe -m pip install uvicorn
)

start "Charlie Tool Backend" /b cmd /k "venv\Scripts\python.exe -m uvicorn Main:app --reload --port 8000"

echo.
echo 🎉 Server launch initiated. You can now access it at http://127.0.0.1:8000
echo Keep this window open to keep the server running.


:: Step 8: Cleanup port 8000 before exit (optional)
echo.
echo [8] Checking again for cleanup on port 8000...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') DO (
    echo Terminating PID %%P...
    taskkill /F /PID %%P >nul 2>&1
)

popd
exit /b
