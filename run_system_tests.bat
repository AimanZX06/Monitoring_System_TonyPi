@echo off
echo ========================================
echo Complete System Testing Script
echo ========================================
echo.
echo This script will test all system features
echo.
pause

echo.
echo ========================================
echo [1/8] Checking SDK Installation
echo ========================================
echo.
call check_sdk_remote.bat
echo.
pause

echo.
echo ========================================
echo [2/8] Checking Servo Data Retrieval
echo ========================================
echo.
echo Checking if servo data is being sent via MQTT...
echo (Make sure robot is connected)
echo.
docker exec -it tonypi_mosquitto mosquitto_sub -t "tonypi/servos/#" -v -C 5
echo.
echo If you saw servo data above, servo data is working!
echo.
pause

echo.
echo ========================================
echo [3/8] Checking Database Storage
echo ========================================
echo.
echo Checking InfluxDB...
curl -s http://localhost:8086/api/health
if %errorlevel% equ 0 (
    echo ✅ InfluxDB is running
) else (
    echo ❌ InfluxDB is not accessible
)
echo.

echo Checking PostgreSQL...
docker exec tonypi_postgres pg_isready
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL is running
) else (
    echo ❌ PostgreSQL is not accessible
)
echo.

echo Checking data in PostgreSQL...
docker exec tonypi_postgres psql -U postgres -d tonypi_db -c "SELECT COUNT(*) as robot_count FROM robots;" 2>nul
docker exec tonypi_postgres psql -U postgres -d tonypi_db -c "SELECT COUNT(*) as job_count FROM jobs;" 2>nul
echo.
pause

echo.
echo ========================================
echo [4/8] Testing PDF Export
echo ========================================
echo.
echo Generating test report...
curl -s -X POST "http://localhost:8000/api/reports/generate?report_type=performance&time_range=1h" -H "Content-Type: application/json" > test_report.json
if %errorlevel% equ 0 (
    echo ✅ Report generated
    echo.
    echo Downloading PDF...
    for /f "tokens=2 delims=:," %%a in ('type test_report.json ^| findstr "id"') do set REPORT_ID=%%a
    set REPORT_ID=%REPORT_ID: =%
    curl -s "http://localhost:8000/api/reports/%REPORT_ID%/pdf" -o test_report.pdf
    if exist test_report.pdf (
        echo ✅ PDF downloaded: test_report.pdf
    ) else (
        echo ❌ PDF download failed
    )
) else (
    echo ❌ Report generation failed
)
echo.
pause

echo.
echo ========================================
echo [5/8] Testing Task Manager
echo ========================================
echo.
echo Checking performance API...
curl -s "http://localhost:8000/api/pi/perf/tonypi_raspberrypi" | findstr "cpu_percent"
if %errorlevel% equ 0 (
    echo ✅ Performance API is working
    echo.
    echo Open http://localhost:3001/monitoring to see Task Manager
) else (
    echo ❌ Performance API not working
)
echo.
pause

echo.
echo ========================================
echo [6/8] Testing Multi-Robot Simulation
echo ========================================
echo.
echo To test multi-robot:
echo 1. Open Terminal 1: python robot_client\simulator.py --robot-id robot1
echo 2. Open Terminal 2: python robot_client\simulator.py --robot-id robot2
echo 3. Check http://localhost:3001/robots (should show 2 robots)
echo.
echo Checking current robots...
curl -s http://localhost:8000/api/robot-data/status
echo.
pause

echo.
echo ========================================
echo [7/8] Testing Grafana Integration
echo ========================================
echo.
echo Checking Grafana health...
curl -s http://localhost:3000/api/health
if %errorlevel% equ 0 (
    echo ✅ Grafana is running
) else (
    echo ❌ Grafana is not accessible
)
echo.

echo Checking dashboard...
curl -s -u admin:admin http://localhost:3000/api/dashboards/uid/tonypi-robot-monitoring >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Dashboard exists
) else (
    echo ❌ Dashboard not found - run: import_dashboard.bat
)
echo.

echo Open http://localhost:3001/monitoring and scroll to "Advanced Analytics"
echo Check if Grafana panels load without errors
echo.
pause

echo.
echo ========================================
echo [8/8] Testing OpenAI Integration
echo ========================================
echo.
echo Checking if OpenAI is configured...
docker-compose exec backend env | findstr OPENAI_API_KEY >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ OpenAI API key is configured
    echo.
    echo Testing analysis...
    curl -s -X POST "http://localhost:8000/api/analytics/analyze-sensors?robot_id=test&time_range=1h" -H "Content-Type: application/json"
) else (
    echo ⚠️  OpenAI API key not configured
    echo.
    echo To set it up:
    echo 1. Get API key from https://platform.openai.com/api-keys
    echo 2. Add to .env: OPENAI_API_KEY=sk-your-key
    echo 3. Restart backend: docker-compose restart backend
)
echo.
pause

echo.
echo ========================================
echo Testing Complete!
echo ========================================
echo.
echo Summary:
echo - Check results above for each test
echo - See SYSTEM_TESTING_CHECKLIST.md for detailed steps
echo - Fix any issues found
echo.
pause





