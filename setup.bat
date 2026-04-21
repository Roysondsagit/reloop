@echo off
setlocal
cls

echo ============================================================
echo          RELOOP ENGINE: ENVIRONMENT SETUP (WINDOWS)
echo ============================================================

:: --- 1. SYSTEM DIAGNOSTICS ---
echo.
echo [STEP] Running System Diagnostics...
echo OS Version:
ver
echo.
echo Architecture:
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (echo 64-bit) else (echo 32-bit)
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.10+ and add to PATH.
    pause
    exit /b 1
)
echo Python Found:
python --version

:: --- 2. VIRTUAL ENVIRONMENT ---
echo.
echo [STEP] Creating Virtual Environment (venv)...
if exist venv (
    echo Existing venv found. Skipping creation.
) else (
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create venv.
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created.
)

:: Activate
call venv\Scripts\activate

:: --- 3. DEPENDENCIES ---
echo.
echo [STEP] Installing Dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed.

:: --- 4. DIRECTORY STRUCTURE ---
echo.
echo [STEP] Verifying Directory Structure...
if not exist "temp_uploads\crops" mkdir "temp_uploads\crops"
if not exist "data\processed" mkdir "data\processed"
if not exist "data\factory_pdfs" mkdir "data\factory_pdfs"
if not exist "qdrant_db" mkdir "qdrant_db"
echo [SUCCESS] Runtime directories ready.

:: --- 5. MODEL CHECK ---
echo.
echo [STEP] Checking AI Models...
if exist "yolo11m.pt" (
    echo Found: yolo11m.pt
) else (
    echo Note: yolo11m.pt will be downloaded automatically on first run.
)

echo.
echo ============================================================
echo    SETUP COMPLETE!
echo    To start the engine, run:
echo    venv\Scripts\activate
echo    python main.py
echo ============================================================
pause