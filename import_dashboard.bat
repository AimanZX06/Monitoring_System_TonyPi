@echo off
echo ========================================
echo Grafana Dashboard Import Script
echo ========================================
echo.

REM Configuration
set GRAFANA_URL=http://localhost:3000
set GRAFANA_USER=admin
set GRAFANA_PASSWORD=admin
set DASHBOARD_FILE=grafana\provisioning\dashboards\tonypi-dashboard.json

echo Step 1: Checking Grafana accessibility...
curl -s %GRAFANA_URL%/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to Grafana at %GRAFANA_URL%
    echo Make sure Grafana is running: docker-compose ps grafana
    pause
    exit /b 1
)
echo OK: Grafana is accessible
echo.

echo Step 2: Checking dashboard file...
if not exist "%DASHBOARD_FILE%" (
    echo ERROR: Dashboard file not found: %DASHBOARD_FILE%
    pause
    exit /b 1
)
echo OK: Dashboard file found
echo.

echo Step 3: Importing dashboard via API...
echo.
echo This will import the dashboard automatically...
echo.

REM Create base64 encoded credentials (admin:admin = YWRtaW46YWRtaW4=)
REM Using PowerShell to do the import
powershell -Command "$ErrorActionPreference='Stop'; $GRAFANA_URL='%GRAFANA_URL%'; $headers = @{'Authorization' = 'Basic YWRtaW46YWRtaW4='; 'Content-Type' = 'application/json'}; $dashboard = Get-Content '%DASHBOARD_FILE%' -Raw | ConvertFrom-Json; $payload = @{dashboard = $dashboard; overwrite = $true} | ConvertTo-Json -Depth 100; try { $result = Invoke-RestMethod -Uri \"$GRAFANA_URL/api/dashboards/db\" -Method Post -Headers $headers -Body $payload; Write-Host 'SUCCESS: Dashboard imported!' -ForegroundColor Green; Write-Host \"  UID: $($result.uid)\" -ForegroundColor Cyan; Write-Host \"  URL: $GRAFANA_URL/d/$($result.uid)\" -ForegroundColor Cyan } catch { Write-Host 'ERROR: Import failed' -ForegroundColor Red; Write-Host $_.Exception.Message -ForegroundColor Yellow; exit 1 }"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Import Complete!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Open Grafana: %GRAFANA_URL%/d/tonypi-robot-monitoring
    echo 2. Verify all 8 panels are visible
    echo 3. Test frontend: http://localhost:3001/monitoring
    echo.
) else (
    echo.
    echo ========================================
    echo Import Failed
    echo ========================================
    echo.
    echo Please check:
    echo 1. Grafana is running: docker-compose ps grafana
    echo 2. You can login to Grafana: %GRAFANA_URL%
    echo 3. Dashboard file exists: %DASHBOARD_FILE%
    echo.
)

pause














