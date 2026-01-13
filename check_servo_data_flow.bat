@echo off
REM Diagnostic script to check servo data flow
echo ========================================
echo Servo Data Flow Diagnostic
echo ========================================
echo.

echo [1/5] Checking if robot is connected...
curl -s http://localhost:8000/api/robot-data/status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend API not responding
    echo    Make sure backend is running: docker-compose up backend
    pause
    exit /b 1
)
echo ✅ Backend API is running
echo.

echo [2/5] Checking robot status...
curl -s http://localhost:8000/api/robot-data/status
echo.
echo.

echo [3/5] Checking servo data API...
curl -s http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi
echo.
echo.

echo [4/5] Checking MQTT messages (last 10 seconds)...
echo    (This requires mosquitto_sub - install if needed)
docker exec -it tonypi_mosquitto mosquitto_sub -t "tonypi/servos/#" -C 1 -W 10 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Could not check MQTT (mosquitto_sub not available or no messages)
) else (
    echo ✅ MQTT messages detected
)
echo.

echo [5/5] Checking backend logs for servo data...
docker-compose logs backend --tail=50 | findstr /i "servo"
echo.

echo ========================================
echo Diagnostic Complete
echo ========================================
echo.
echo Next steps:
echo 1. If no robot status: Check robot client is running
echo 2. If no servo data: Check robot client logs for "Sent servo status"
echo 3. If MQTT not receiving: Check robot client MQTT connection
echo 4. If backend not storing: Check backend logs for errors
echo.
pause











