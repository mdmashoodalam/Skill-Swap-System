@echo off
REM Skill Swap Platform - Complete Setup Script for Windows

echo ========================================
echo Skill Swap Platform - Automated Setup
echo ========================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Java not found. Please install Java 21+
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

where mvn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Maven not found. Please ensure Maven 3.8+ is installed
    pause
    exit /b 1
)

echo ✅ All prerequisites found
echo.

REM Backend Setup
echo ^ Setting up Backend...
cd backend
echo.   Installing backend dependencies...
call mvn clean install -q
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend installation failed
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed
cd ..
echo.

REM Frontend Setup
echo ^ Setting up Frontend...
cd frontend
echo.   Installing frontend dependencies...
call npm install --legacy-peer-deps -s
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend installation failed
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed
cd ..
echo.

echo ✨ Setup Complete!
echo.
echo 📌 Next steps:
echo.   1. Start MySQL database
echo.   2. Create database: CREATE DATABASE skillswap;
echo.   3. In Terminal 1: cd backend ^& ^& mvn spring-boot:run
echo.   4. In Terminal 2: cd frontend ^& ^& npm run dev
echo.   5. Open http://localhost:5173 in your browser
echo.
echo 📚 More info: See QUICK_START.md
echo.
pause
