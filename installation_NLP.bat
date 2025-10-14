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

:: Step 1: Check and create venv if missing
echo.
echo [1] Checking for Python virtual environment...
if not exist "venv" (
    echo ⚙️  Virtual environment not found. Creating one...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment. Check your Python installation.
        pause
        exit /b
    )
) else (
    echo ✅ Virtual environment found.
)

:: Step 2: Activate the virtual environment
echo.
echo [2] Activating virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
    echo ❌ Failed to activate virtual environment.
    pause
    exit /b
)


echo.
echo [2] Installing Python dependencies...
IF EXIST requirements.txt (
    call python -m pip install --upgrade pip >nul
    call python -m pip install -r requirements.txt
) ELSE (
    echo ⚠️ requirements.txt not found! Skipping dependencies.
)

echo.
echo [3] Checking Ollama installation...
where ollama >nul 2>&1
IF ERRORLEVEL 1 (
    echo ⚠️ Ollama not found! Downloading installer...
    set TEMP_EXE=%TEMP%\OllamaSetup.exe
    powershell -Command "Try { Invoke-WebRequest '%OLLAMA_INSTALL_URL%' -OutFile '%TEMP_EXE%' -UseBasicParsing } Catch { Exit 1 }"
    if exist "%TEMP_EXE%" (
        echo 🚀 Installing Ollama silently...
        start /wait "" "%TEMP_EXE%" /SILENT
        del "%TEMP_EXE%"
    ) else (
        echo ❌ Failed to download Ollama installer.
        pause
        popd
        exit /b
    )
)

where ollama >nul 2>&1
IF ERRORLEVEL 1 (
    echo ❌ Ollama not installed correctly. Please install manually.
    pause
    popd
    exit /b
)
echo ✅ Ollama detected.

echo.
echo [4] Checking if Ollama is running...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :11434 ^| findstr LISTENING') DO (
    echo ⚙️ Ollama already running (PID %%P)
    set "OLLAMA_RUNNING=1"
)
IF NOT DEFINED OLLAMA_RUNNING (
    echo 🚀 Starting Ollama server...
    start "Ollama Server" /min cmd /c "ollama serve"
)

echo.
echo [5] Waiting for Ollama to respond...
set "ATTEMPTS=0"
:wait_ollama
set /a ATTEMPTS+=1
if %ATTEMPTS% GTR 20 (
    echo ❌ Ollama service failed to start in time.
    pause
    popd
    exit /b
)
powershell -Command "(Invoke-WebRequest -Uri http://127.0.0.1:11434/api/tags -UseBasicParsing -TimeoutSec 2) >$null 2>&1"
if %ERRORLEVEL% NEQ 0 (
    timeout /t 2 >nul
    goto wait_ollama
)
echo ✅ Ollama service is ready.

echo.
echo [6] Checking if model '%MODEL_NAME%' is available...
ollama list | find /I "%MODEL_NAME%" >nul
IF ERRORLEVEL 1 (
    echo 📦 Pulling model '%MODEL_NAME%'...
    ollama pull %MODEL_NAME%
) ELSE (
    echo ✅ Model '%MODEL_NAME%' already available.
)

echo.
echo [7] Checking for app.py...
IF NOT EXIST app.py (
    echo ❌ app.py not found!
    pause
    popd
    exit /b
)

echo.
echo [8] Starting Flask server on port 9000...
start "Charlie Tool NLP" cmd /k "set FLASK_APP=app.py && set FLASK_ENV=development && python -m flask run --host=127.0.0.1 --port=9000"

echo.
echo 🎉 All systems ready!
echo 🌐 Flask:   http://127.0.0.1:9000
echo 🤖 Ollama:  http://127.0.0.1:11434
echo ======================================================
echo 💚 Charlie Tool NLP initialized successfully!
echo ======================================================

popd
exit /b
