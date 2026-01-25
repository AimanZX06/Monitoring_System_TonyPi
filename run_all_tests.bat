@echo off
REM ============================================================
REM TonyPi Monitoring System - Run All Tests
REM ============================================================

echo.
echo ============================================================
echo TonyPi Monitoring System - Complete Test Suite
echo ============================================================
echo.

REM Check if Docker is running
docker info > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    echo.
    pause
    exit /b 1
)

REM Check if containers are running
docker-compose ps | findstr "Up" > nul 2>&1
if errorlevel 1 (
    echo [INFO] Starting Docker containers...
    docker-compose up -d
    echo [INFO] Waiting for services to start (30 seconds)...
    timeout /t 30 /nobreak > nul
)

echo.
echo ============================================================
echo [1/4] Running Backend Unit Tests
echo ============================================================
cd backend
python -m pytest -v --tb=short
if errorlevel 1 (
    echo [WARN] Some backend tests failed
)
cd ..

echo.
echo ============================================================
echo [2/4] Running Frontend Tests
echo ============================================================
cd frontend
call npm test -- --watchAll=false --passWithNoTests
if errorlevel 1 (
    echo [WARN] Some frontend tests failed
)
cd ..

echo.
echo ============================================================
echo [3/4] Running Integration Tests
echo ============================================================
python tests/test_integration.py
if errorlevel 1 (
    echo [WARN] Some integration tests failed
)

echo.
echo ============================================================
echo [4/4] Running Comprehensive System Tests
echo ============================================================
python tests/comprehensive_test_suite.py
if errorlevel 1 (
    echo [WARN] Some system tests failed
)

echo.
echo ============================================================
echo All Test Suites Complete!
echo ============================================================
echo.
echo Results saved to: test_reports/
echo.
pause
