@echo off
REM OPD Token Allocation System - Startup Script for Windows
REM This script starts both backend and frontend servers

echo ================================================
echo    OPD Token Allocation System - Full Stack
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js v14 or higher from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version
echo.

REM Install backend dependencies if needed
if not exist "backend\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo [OK] Backend dependencies installed
    echo.
)

REM Start backend server
echo [INFO] Starting backend server on port 3000...
cd backend
start "OPD Backend" cmd /k "node src/api/server.js"
cd ..
timeout /t 3 /nobreak >nul
echo [OK] Backend server started
echo.

REM Start frontend server
echo [INFO] Starting frontend server on port 8080...
cd frontend

REM Try Python first
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    Using Python...
    start "OPD Frontend" cmd /k "python -m http.server 8080"
    goto :started
)

REM Try http-server
where http-server >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    Using http-server...
    start "OPD Frontend" cmd /k "http-server -p 8080"
    goto :started
)

REM No server found
echo [WARNING] No suitable HTTP server found.
echo Please install one of the following:
echo   - Python: https://www.python.org/downloads/
echo   - http-server: npm install -g http-server
echo.
echo Then manually run:
echo   cd frontend
echo   python -m http.server 8080
cd ..
pause
exit /b 1

:started
cd ..
echo [OK] Frontend server started
echo.

echo ================================================
echo    System is running!
echo ================================================
echo.
echo Backend API:  http://localhost:3000
echo Frontend UI:  http://localhost:8080
echo.
echo Open http://localhost:8080 in your browser
echo.
echo Press any key to stop servers...
pause >nul

REM Stop servers
taskkill /FI "WindowTitle eq OPD Backend*" /T /F >nul 2>nul
taskkill /FI "WindowTitle eq OPD Frontend*" /T /F >nul 2>nul
echo Servers stopped.
