@echo off
title CareerAI - System Launcher
color 0A
echo ======================================================================
echo          Starting CareerAI Platform (Backend + Frontend)
echo ======================================================================
echo.

:: 1. Launch Flask Backend
echo [1/2] Launching Python Flask Backend on http://localhost:5000 ...
start "CareerAI Backend (Port 5000)" cmd /k "cd backend && call venv\Scripts\activate && python app.py"

:: Small delay to let backend bind port
timeout /t 2 /nobreak >nul

:: 2. Launch Vite React Frontend
echo [2/2] Launching React Vite Frontend on http://localhost:5173 ...
start "CareerAI Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ======================================================================
echo   CareerAI is now running locally!
echo.
echo   * Web Portal: http://localhost:5173
echo   * Backend API: http://localhost:5000/api/health
echo.
echo   Demo Login:
echo   - Email:    pallakananireddy@gmail.com
echo   - Password: password123
echo   - Master Demo OTP: 123456
echo ======================================================================
echo.
echo Keep both opened terminal windows running while using the app.
echo.
pause
