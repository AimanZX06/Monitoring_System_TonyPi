@echo off
REM Batch script to check database connections
echo ========================================
echo Database Connection Diagnostic
echo ========================================
echo.

echo [1/4] Checking Docker services...
docker-compose ps
echo.

echo [2/4] Checking InfluxDB container...
docker-compose ps influxdb
docker-compose logs influxdb --tail=10
echo.

echo [3/4] Checking PostgreSQL container...
docker-compose ps postgres
docker-compose logs postgres --tail=10
echo.

echo [4/4] Running Python diagnostic...
python check_database_connections.py
echo.

echo ========================================
echo Diagnostic Complete
echo ========================================
pause
