@echo off
echo ========================================
echo Grafana Setup Fix Script
echo ========================================
echo.

echo Step 1: Stopping Grafana container...
docker-compose stop grafana

echo.
echo Step 2: Removing Grafana container (to clear cache)...
docker-compose rm -f grafana

echo.
echo Step 3: Starting Grafana with updated configuration...
docker-compose up -d grafana

echo.
echo Step 4: Waiting for Grafana to start (10 seconds)...
timeout /t 10 /nobreak

echo.
echo Step 5: Checking Grafana health...
curl -s http://localhost:3000/api/health
echo.

echo.
echo Step 6: Checking Grafana logs...
docker-compose logs grafana --tail 20

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open Grafana: http://localhost:3000
echo 2. Login with admin/admin
echo 3. Verify dashboard exists: Dashboards -^> Browse
echo 4. Check if you can access without login (incognito window)
echo 5. Test frontend: http://localhost:3001 -^> Monitoring tab
echo.
echo If issues persist, check GRAFANA_SETUP_FIX.md for detailed troubleshooting
echo.
pause














