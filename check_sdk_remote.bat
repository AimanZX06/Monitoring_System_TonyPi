@echo off
echo ========================================
echo Check SDK Installation on Raspberry Pi
echo ========================================
echo.
echo This script will check if HiwonderSDK is installed
echo on your TonyPi robot.
echo.
set /p ROBOT_IP="Enter your robot's IP address (e.g., 192.168.1.103): "

echo.
echo Checking SDK installation...
echo.

echo Method 1: Checking pip packages...
ssh pi@%ROBOT_IP% "pip3 list | grep -i hiwonder"
if %errorlevel% equ 0 (
    echo.
    echo ✅ HiwonderSDK appears to be installed!
) else (
    echo.
    echo ❌ HiwonderSDK not found in pip packages
)

echo.
echo Method 2: Testing SDK import...
ssh pi@%ROBOT_IP% "python3 -c 'from hiwonder import Board; print(\"✅ SDK is installed and working!\")'" 2>nul
if %errorlevel% equ 0 (
    echo ✅ SDK import successful!
) else (
    echo ❌ SDK import failed - SDK not installed or not working
)

echo.
echo Method 3: Checking for other servo libraries...
ssh pi@%ROBOT_IP% "pip3 list | grep -E 'servo|motor|lx16a|dynamixel|pyserial'"
if %errorlevel% equ 0 (
    echo.
    echo ✅ Found other servo-related libraries
) else (
    echo.
    echo ❌ No other servo libraries found
)

echo.
echo ========================================
echo Check Complete
echo ========================================
echo.
echo If SDK is installed:
echo   - You can use it directly in your code
echo   - No installation needed
echo.
echo If SDK is NOT installed:
echo   - Install it: ssh pi@%ROBOT_IP% "cd ~ && git clone https://github.com/Hiwonder-docs/hiwonder-sdk-python.git && cd hiwonder-sdk-python && sudo pip3 install ."
echo   - OR use alternative methods (see SERVO_DATA_RETRIEVAL_OPTIONS.md)
echo.
pause





