@echo off
REM Batch script to copy robot_client.py to Raspberry Pi
REM Usage: copy_robot_client.bat <robot-ip> [username]

setlocal

if "%1"=="" (
    echo.
    echo Usage: copy_robot_client.bat ^<robot-ip^> [username]
    echo Example: copy_robot_client.bat 192.168.1.100
    echo Example: copy_robot_client.bat 192.168.1.100 pi
    echo.
    pause
    exit /b 1
)

set ROBOT_IP=%1
set USERNAME=%2
if "%USERNAME%"=="" set USERNAME=pi

echo ========================================
echo Copying Robot Client to Raspberry Pi
echo ========================================
echo.
echo Robot IP: %ROBOT_IP%
echo Username: %USERNAME%
echo.

REM Check if scp is available (PowerShell)
where scp >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Checking for PowerShell scp...
    powershell -Command "where.exe scp" >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: scp command not found!
        echo.
        echo Please use one of these methods:
        echo.
        echo METHOD 1: Use PowerShell script
        echo   powershell -ExecutionPolicy Bypass -File copy_robot_client.ps1 -RobotIP %ROBOT_IP%
        echo.
        echo METHOD 2: Install OpenSSH Client
        echo   1. Open Windows Settings
        echo   2. Go to Apps ^> Optional Features
        echo   3. Add "OpenSSH Client"
        echo   4. Restart and try again
        echo.
        echo METHOD 3: Use WinSCP (GUI tool)
        echo   Download from: https://winscp.net/
        echo.
        pause
        exit /b 1
    )
)

REM Check if source file exists
if not exist "robot_client\tonypi_client.py" (
    echo ERROR: robot_client\tonypi_client.py not found!
    echo Make sure you're running this from the project root directory.
    echo.
    pause
    exit /b 1
)

echo Creating destination directory...
ssh %USERNAME%@%ROBOT_IP% "mkdir -p /home/pi/robot_client/"

echo.
echo Copying file...
scp robot_client\tonypi_client.py %USERNAME%@%ROBOT_IP%:/home/pi/robot_client/

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! File copied successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. SSH into the robot: ssh %USERNAME%@%ROBOT_IP%
    echo 2. Navigate to: cd /home/pi/robot_client/
    echo 3. Restart the client: python3 tonypi_client.py --broker YOUR_PC_IP
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Copy failed!
    echo ========================================
    echo.
    echo Troubleshooting:
    echo - Make sure you can SSH to the robot: ssh %USERNAME%@%ROBOT_IP%
    echo - Check that the robot IP is correct
    echo - Verify OpenSSH client is installed
    echo.
)

pause



