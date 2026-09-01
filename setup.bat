@echo off
title CareerAI - Automated Setup
color 0B
echo ======================================================================
echo          CareerAI: Automated Environment Setup & Dependency Installer
echo ======================================================================
echo.

echo [1/3] Checking Prerequisites...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not added to PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not added to PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Python and Node.js detected!
echo.

echo [2/3] Setting up Python Flask Backend...
cd backend
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing Python dependencies from requirements.txt...
pip install -r requirements.txt --quiet
cd ..
echo [OK] Backend setup complete!
echo.

echo [3/3] Setting up React Frontend...
cd frontend
echo Installing Node modules from package.json...
call npm install --silent
cd ..
echo [OK] Frontend setup complete!
echo.

echo ======================================================================
echo   SUCCESS! All dependencies installed.
echo   You can now double-click "start.bat" to launch the platform!
echo ======================================================================
echo.
pause
