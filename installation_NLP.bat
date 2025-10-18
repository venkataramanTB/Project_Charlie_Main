@echo off
setlocal ENABLEEXTENSIONS
color 0A
title Charlie Tool NLP Flask Setup

echo ======================================================
echo            CHARLIE TOOL NLP - AUTO SETUP
echo ======================================================

set MODEL_NAME=mistral
set OLLAMA_INSTALL_URL=https://ollama.ai/download/OllamaSetup.exe
set OLLAMA_EXE=%LocalAppData%\Programs\Ollama\ollama.exe
set LOGFILE=setup_log.txt

echo Starting setup at %date% %time% > %LOGFILE%

REM --- Move into NLP directory ---
pushd NLP || (
    echo ❌ NLP directory not found!
    pause
    exit /b
)

echo.
echo [0] Checking and killing process on port 9000 if exists...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :9000 ^| findstr LISTENING') DO (
    echo ⚠️ Killing PID %%P...
    taskkill /F /PID %%P >nul 2>&1
)

:: Step 0.5: Check Python installation
echo.
echo [0.5] Checking Python installation...
where python >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.10+ and add it to PATH.
    pause
    popd
    exit /b
)
echo ✅ Python detected.

:: Step 1: Check and create venv if missing
echo.
echo [1] Checking for Python virtual environment...
if not exist "venv" (
    echo ⚙️  Virtual environment not found. Creating one...
    python -m venv venv >> %LOGFILE% 2>&1
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment. Check your Python installation.
        pause
        popd
        exit /b
    )
) else (
    echo ✅ Virtual environment found.
)

:: Step 2: Activate the virtual environment
echo.
echo [2] Activating virtual environment...
if exist "venv\Scripts\activate" (
    call venv\Scripts\activate
) else (
    echo ❌ venv activation script not found!
    pause
    popd
    exit /b
)
echo ✅ Virtual environment activated.

:: Step 3: Install dependencies
echo.
echo [3] Installing Python dependencies...
IF EXIST requirements.txt (
    call python -m pip install --upgrade pip >> %LOGFILE% 2>&1
    call python -m pip install -r requirements.txt >> %LOGFILE% 2>&1
) ELSE (
    echo ⚠️ requirements.txt not found! Installing minimal dependencies...
    call pip install flask >> %LOGFILE% 2>&1
)

echo ✅ Dependencies installation complete.

:: Step 8: Start Flask app
echo.
echo [8] Checking for app.py...
IF NOT EXIST app.py (
    echo ❌ app.py not found!
    pause
    popd
    exit /b
)

echo.
echo [9] Starting Flask server on port 9000...
start "Charlie Tool NLP" cmd /k "set FLASK_APP=app.py && set FLASK_ENV=development && python -m flask run --host=127.0.0.1 --port=9000"

echo.
echo 🎉 All systems ready!
echo 🌐 Flask:   http://127.0.0.1:9000
echo 🤖 Ollama:  http://127.0.0.1:11434
echo ======================================================
echo 💚 Charlie Tool NLP initialized successfully!
echo 📜 Log file: %CD%\%LOGFILE%
echo ======================================================

popd
exit /b
