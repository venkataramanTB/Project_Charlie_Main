@echo off
setlocal ENABLEEXTENSIONS
color 0A
title Charlie Tool NLP Flask Setup

echo ================================
echo       Charlie Tool NLP Setup
echo ================================

REM ✅ Move into NLP directory
pushd NLP || (
    echo ❌ NLP directory not found!
    pause
    exit /b
)

:: -------------------------------
:: Step 0: Kill process on port 9000
:: -------------------------------
echo.
echo [0] Checking and killing process on port 9000 if exists...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :9000 ^| findstr LISTENING') DO (
    echo ⚠️ Killing PID %%P...
    taskkill /F /PID %%P >nul 2>&1
)

:: -------------------------------
:: Step 1: Activate shared virtual environment
:: -------------------------------
echo.
echo [1] Activating shared virtual environment from Server...
IF EXIST ..\Server\venv\Scripts\activate.bat (
    call ..\Server\venv\Scripts\activate.bat
) ELSE (
    echo ❌ Shared virtual environment not found in Server\venv!
    pause
    popd
    exit /b
)

:: -------------------------------
:: Step 2: Install dependencies from requirements.txt
:: -------------------------------
echo.
echo [2] Installing dependencies from requirements.txt...
IF EXIST requirements.txt (
    call python -m pip install --upgrade pip
    call python -m pip install -r requirements.txt
) ELSE (
    echo ⚠️ requirements.txt not found! Skipping dependency installation.
)

:: -------------------------------
:: Step 3: Verify app.py exists
:: -------------------------------
echo.
echo [3] Checking app.py...
IF NOT EXIST app.py (
    echo ❌ app.py not found in NLP directory!
    pause
    popd
    exit /b
)

:: -------------------------------
:: Step 4: Start Flask server on port 9000
:: -------------------------------
echo.
echo [4] Starting NLP Flask server on port 9000...
start "Charlie Tool NLP" /b cmd /k "set FLASK_APP=app.py && set FLASK_ENV=development && python -m flask run --host=127.0.0.1 --port=9000"

echo.
echo 🎉 NLP Flask server launched at http://127.0.0.1:9000
echo Keep this window open to keep the server running.

popd
exit /b
