@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION
color 0A
title Charlie Tool Backend

:: ======================================================================
::  CHARLIE TOOL BACKEND  v4.0
::  All packages live inside Server\.venv -- zero system-Python pollution.
::  Fast path: healthy venv -> launch immediately (no install overhead).
::  Handles: pandas build failures, SSL/proxy, port conflicts.
:: ======================================================================

set "ROOT=%~dp0"
set "SERVER=%ROOT%Server"
set "VENV=%SERVER%\.venv"
set "PY=%VENV%\Scripts\python.exe"
set "LOG=%ROOT%backend_install.log"
set "PANDAS_OK=0"
set "WARN_COUNT=0"
set "EXIT_CODE=0"

echo. > "%LOG%"
echo ================================================ >> "%LOG%"
echo  Charlie Backend v4.0  [%DATE% %TIME%] >> "%LOG%"
echo ================================================ >> "%LOG%"

echo.
echo ================================================
echo   Charlie Tool Backend  -  Production Setup
echo ================================================
echo.

:: ---- Navigate to Server folder -----------------------------------------------
IF NOT EXIST "%SERVER%" (
    echo [FAIL] Server folder not found: %SERVER%
    echo [FAIL] Server folder missing >> "%LOG%"
    goto :ABORT
)
cd /d "%SERVER%"
echo [INFO] Working directory: %CD%
echo [INFO] Working directory: %CD% >> "%LOG%"
echo.

:: ---- Release port 8000 (two passes) ------------------------------------------
echo [INIT] Clearing port 8000...
FOR /F "tokens=5" %%P IN ('netstat -aon 2^>nul ^| findstr /L ":8000 " ^| findstr "LISTENING"') DO (
    taskkill /F /T /PID %%P >nul 2>&1
)
FOR /F "tokens=5" %%P IN ('netstat -aon 2^>nul ^| findstr /L ":8000 " ^| findstr "LISTENING"') DO (
    taskkill /F /T /PID %%P >nul 2>&1
)
echo.

:: ==============================================================================
::  FAST PATH: venv is healthy -> skip all setup and go straight to launch
:: ==============================================================================
IF EXIST "%PY%" (
    "%PY%" -c "import fastapi, uvicorn, pydantic, pydantic_core, pandas" >nul 2>&1
    IF !ERRORLEVEL! EQU 0 (
        echo [OK]   venv is healthy -- skipping setup
        echo [FAST] venv healthy -- skipping setup >> "%LOG%"
        goto :LAUNCH
    )
    echo [INFO] venv exists but needs repair -- reinstalling packages...
    echo [INFO] venv repair needed >> "%LOG%"
)

:: ==============================================================================
::  STEP 1/5 -- DETECT SYSTEM PYTHON  (used only to create the venv)
:: ==============================================================================
echo [1/5] Locating Python 3...
set "SYS_PY="

for %%E in (py python python3) do (
    if not defined SYS_PY (
        where %%E >nul 2>&1
        if !ERRORLEVEL! EQU 0 (
            for /F "tokens=*" %%V in ('%%E --version 2^>^&1') do (
                echo %%V | findstr /C:"Python 3" >nul
                if !ERRORLEVEL! EQU 0 set "SYS_PY=%%E"
            )
        )
    )
)

IF NOT DEFINED SYS_PY (
    echo [FAIL] Python 3 not found in PATH.
    echo        Install Python 3.10-3.13 from https://www.python.org/downloads/
    echo        Enable "Add python.exe to PATH" during setup.
    echo [FAIL] Python 3 not found >> "%LOG%"
    goto :ABORT
)

FOR /F "tokens=*" %%V IN ('%SYS_PY% --version 2^>^&1') DO (
    echo [OK]   %%V  ^(used only to create .venv^)
    echo [OK]   %%V >> "%LOG%"
)

:: -- Reject Python 3.14+ (no binary wheels for compiled extensions yet) ---------
FOR /F "tokens=*" %%M IN ('%SYS_PY% -c "import sys; print(sys.version_info.major)" 2^>^&1') DO SET "PY_MAJ=%%M"
FOR /F "tokens=*" %%M IN ('%SYS_PY% -c "import sys; print(sys.version_info.minor)" 2^>^&1') DO SET "PY_MIN=%%M"
IF %PY_MAJ% EQU 3 IF %PY_MIN% GEQ 14 (
    echo [FAIL] Python 3.%PY_MIN% is not supported.
    echo        Binary wheels for pydantic-core, polars, pyarrow, fastexcel are not
    echo        available for Python 3.14+. Please install Python 3.10 - 3.13.
    echo        https://www.python.org/downloads/release/python-3130/
    echo [FAIL] Python 3.%PY_MIN% unsupported ^(need 3.10-3.13^) >> "%LOG%"
    goto :ABORT
)
echo.

:: ==============================================================================
::  STEP 2/5 -- CREATE ISOLATED VENV
:: ==============================================================================
echo [2/5] Preparing isolated environment...
IF NOT EXIST "%VENV%" (
    echo        Creating .venv ...
    %SYS_PY% -m venv "%VENV%" 2>>"%LOG%"
    IF !ERRORLEVEL! NEQ 0 (
        echo [FAIL] venv creation failed -- check %LOG%
        echo [FAIL] venv creation failed >> "%LOG%"
        goto :ABORT
    )
    echo [OK]   .venv created.
) ELSE (
    echo [OK]   .venv already exists.
)
echo [INFO] Venv Python: %PY% >> "%LOG%"
echo.

:: ==============================================================================
::  STEP 3/5 -- UPGRADE PIP  (inside venv only)
:: ==============================================================================
echo [3/5] Upgrading pip...
"%PY%" -m pip install --upgrade pip --quiet --no-warn-script-location 2>>"%LOG%"
IF %ERRORLEVEL% NEQ 0 (
    echo [WARN] pip upgrade failed -- continuing with installed version.
    echo [WARN] pip upgrade failed >> "%LOG%"
) ELSE (
    FOR /F "tokens=*" %%V IN ('"%PY%" -m pip --version 2^>^&1') DO echo [OK]   %%V
)
echo.

:: ==============================================================================
::  STEP 4/5 -- INSTALL DEPENDENCIES  (inside venv)
:: ==============================================================================
echo [4/5] Installing dependencies...

"%PY%" -c "lines=[l for l in open('Requirements.txt') if not l.strip().lower().startswith('pandas')]; open('_req_base.txt','w').writelines(lines)" 2>>"%LOG%"
IF %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Cannot read Requirements.txt
    echo [FAIL] Requirements.txt unreadable >> "%LOG%"
    goto :ABORT
)

:: Attempt A: binary wheels only (fastest -- no compiler required)
echo        [A] Binary-only install...
"%PY%" -m pip install -r _req_base.txt --only-binary=:all: --upgrade --retries 3 --timeout 90 -q 2>>"%LOG%"
set "BASE_OK=%ERRORLEVEL%"

:: Attempt B: allow source builds
IF %BASE_OK% NEQ 0 (
    echo        [B] Allowing source builds...
    "%PY%" -m pip install -r _req_base.txt --upgrade --retries 3 --timeout 90 -q 2>>"%LOG%"
    set "BASE_OK=!ERRORLEVEL!"
)

:: Attempt C: SSL bypass for corporate proxies
IF %BASE_OK% NEQ 0 (
    echo        [C] SSL-bypass mode...
    "%PY%" -m pip install -r _req_base.txt --upgrade --retries 3 --timeout 90 -q ^
        --trusted-host pypi.org --trusted-host files.pythonhosted.org ^
        --trusted-host pypi.python.org 2>>"%LOG%"
    set "BASE_OK=!ERRORLEVEL!"
)

del "_req_base.txt" >nul 2>&1

IF %BASE_OK% NEQ 0 (
    echo [FAIL] Base dependencies failed after 3 attempts.
    echo [FAIL] Base dependency install failed >> "%LOG%"
    echo   Check %LOG% for details.
    goto :ABORT
)
echo [OK]   Base packages installed.

:: -- pandas fallback waterfall --------------------------------------------------
"%PY%" -c "import pandas" >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    FOR /F "tokens=*" %%V IN ('"%PY%" -c "import pandas; print(pandas.__version__)" 2^>^&1') DO echo [OK]   pandas %%V
    SET PANDAS_OK=1
)

IF %PANDAS_OK% EQU 0 (
    echo        [pandas 1/4] Latest binary wheel...
    "%PY%" -m pip install "pandas>=2.1.0" --only-binary=:all: --retries 3 --timeout 90 -q 2>>"%LOG%"
    "%PY%" -c "import pandas" >nul 2>&1
    IF !ERRORLEVEL! EQU 0 SET PANDAS_OK=1
)

IF %PANDAS_OK% EQU 0 (
    echo        [pandas 2/4] pandas 2.2.x binary...
    "%PY%" -m pip install "pandas>=2.2.0,<2.3.0" --only-binary=:all: --retries 3 --timeout 90 -q 2>>"%LOG%"
    "%PY%" -c "import pandas" >nul 2>&1
    IF !ERRORLEVEL! EQU 0 SET PANDAS_OK=1
)

IF %PANDAS_OK% EQU 0 (
    echo        [pandas 3/4] SSL-bypass binary...
    "%PY%" -m pip install "pandas>=2.1.0" --only-binary=:all: -q ^
        --trusted-host pypi.org --trusted-host files.pythonhosted.org ^
        --trusted-host pypi.python.org 2>>"%LOG%"
    "%PY%" -c "import pandas" >nul 2>&1
    IF !ERRORLEVEL! EQU 0 (
        SET PANDAS_OK=1
        echo [INFO] SSL bypass required for pandas >> "%LOG%"
    )
)

IF %PANDAS_OK% EQU 0 (
    where conda >nul 2>&1
    IF !ERRORLEVEL! EQU 0 (
        echo        [pandas 4/4] conda fallback...
        conda install pandas --yes -q 2>>"%LOG%"
        "%PY%" -c "import pandas" >nul 2>&1
        IF !ERRORLEVEL! EQU 0 (
            SET PANDAS_OK=1
            echo [INFO] pandas installed via conda >> "%LOG%"
        )
    ) ELSE (
        echo        [pandas 4/4] conda not available -- skipping.
    )
)

IF %PANDAS_OK% EQU 0 (
    echo.
    echo [FAIL] pandas could not be installed.
    echo [FAIL] All pandas strategies exhausted >> "%LOG%"
    echo.
    echo   SOLUTIONS:
    echo   [1] Use Python 3.12 or 3.13: https://www.python.org/downloads/
    echo   [2] Install Anaconda/Miniconda: https://www.anaconda.com/download
    echo   [3] Install VS C++ Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo.
    goto :ABORT
)
echo.

:: ==============================================================================
::  STEP 5/5 -- IMPORT VERIFICATION  (venv Python)
:: ==============================================================================
echo [5/5] Verifying packages...
set "WARN_COUNT=0"

for %%M in (fastapi uvicorn pydantic pydantic_core pandas numpy openpyxl xlsxwriter requests httpx psutil polars pyarrow duckdb dateutil dotenv multipart) do (
    "%PY%" -c "import %%M" >nul 2>&1
    IF !ERRORLEVEL! EQU 0 (
        echo [OK]   %%M
    ) ELSE (
        echo [WARN] %%M  -- import failed
        echo [WARN] %%M import failed >> "%LOG%"
        set /a WARN_COUNT+=1
    )
)

IF %WARN_COUNT% GTR 0 (
    echo.
    echo [WARN] %WARN_COUNT% package^(s^) failed import -- check %LOG%
    echo        Server will attempt to start; some features may be limited.
) ELSE (
    echo.
    echo [OK]   All packages verified.
)
echo.

IF NOT EXIST Main.py (
    echo [FAIL] Main.py not found in %CD%
    echo [FAIL] Main.py missing >> "%LOG%"
    goto :ABORT
)

:: ==============================================================================
:LAUNCH
:: ==============================================================================
echo [START] Launching FastAPI server via venv...
echo.
echo ================================================
echo   URL:   http://127.0.0.1:8000
echo   Docs:  http://127.0.0.1:8000/docs
echo   Stop:  CTRL+C
echo ================================================
echo.
echo [INFO] Server launched at %TIME% >> "%LOG%"

"%PY%" -m uvicorn Main:app --reload --port 8000 --host 127.0.0.1

set "UVICORN_EXIT=%ERRORLEVEL%"
echo.
IF %UVICORN_EXIT% NEQ 0 (
    echo [FAIL] Server exited with code %UVICORN_EXIT%
    echo [FAIL] uvicorn exited with code %UVICORN_EXIT% >> "%LOG%"
    echo.
    echo   Possible causes:
    echo     - Import error in Main.py ^(see console output above^)
    echo     - Port 8000 still in use
    echo     - Missing file referenced by Main.py
    echo.
    echo   Full log: %LOG%
) ELSE (
    echo [INFO] Server stopped cleanly.
    echo [INFO] Server stopped cleanly >> "%LOG%"
)
goto :END

:: ==============================================================================
:ABORT
echo.
echo ================================================
echo   Setup failed. Full log:
echo   %LOG%
echo ================================================
set "EXIT_CODE=1"
echo [FAIL] Aborted at %TIME% >> "%LOG%"

:END
echo.
echo Press any key to close...
pause >nul
exit /b %EXIT_CODE%