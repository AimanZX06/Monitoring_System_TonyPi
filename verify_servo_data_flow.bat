@echo off
REM Servo Data Flow Verification Script for Windows
REM This script helps verify servo data flow from robot to frontend

echo ========================================
echo Servo Data Flow Verification
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python or add it to PATH
    pause
    exit /b 1
)

REM Run the verification script
echo Running verification script...
echo.
python verify_servo_data_flow.py

echo.
echo ========================================
echo Verification Complete
echo ========================================
echo.
echo For detailed manual checks, see: VERIFY_SERVO_DATA_FLOW.md
echo.
pause












