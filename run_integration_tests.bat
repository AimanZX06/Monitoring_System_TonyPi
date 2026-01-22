@echo off
REM TonyPi Integration Test Runner
REM Run this after starting Docker services and connecting your robot

echo.
echo ===============================================
echo   TonyPi Integration Tests
echo ===============================================
echo.
echo Options:
echo   1. Run tests only
echo   2. Run tests + Export HTML report (for documentation)
echo   3. Run tests + Export ALL formats (JSON, TXT, HTML)
echo   4. Quick test (shorter wait times)
echo   5. Quick test + Export HTML
echo.

set /p choice="Select option (1-5): "

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check for required packages
echo.
echo Checking dependencies...
pip show requests >nul 2>&1
if errorlevel 1 (
    echo Installing requests...
    pip install requests
)

pip show paho-mqtt >nul 2>&1
if errorlevel 1 (
    echo Installing paho-mqtt...
    pip install paho-mqtt
)

echo.
echo Starting integration tests...
echo.

REM Create reports directory
if not exist "test_reports" mkdir test_reports

if "%choice%"=="1" (
    python tests/test_integration.py
) else if "%choice%"=="2" (
    python tests/test_integration.py --export html --output-dir test_reports
) else if "%choice%"=="3" (
    python tests/test_integration.py --export all --output-dir test_reports
) else if "%choice%"=="4" (
    python tests/test_integration.py --quick
) else if "%choice%"=="5" (
    python tests/test_integration.py --quick --export html --output-dir test_reports
) else (
    echo Invalid option. Running default tests...
    python tests/test_integration.py
)

echo.
echo ===============================================
echo   Test Complete!
echo ===============================================

if exist "test_reports\*.html" (
    echo.
    echo Reports saved in: test_reports\
    echo Open the HTML file in a browser to view the report.
)

echo.
pause
