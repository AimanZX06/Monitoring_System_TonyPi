@echo off
echo ========================================
echo Grafana Update Script
echo ========================================
echo.
echo Current version: Grafana 10.0.0
echo Updating to: Grafana 11.0.0
echo.
echo WARNING: This will update Grafana!
echo.
pause

echo.
echo Step 1: Backing up Grafana data...
if exist "grafana\data" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set mydate=%%c%%a%%b
    set BACKUP_DIR=grafana\data_backup_%mydate%
    echo Creating backup: %BACKUP_DIR%
    xcopy grafana\data %BACKUP_DIR% /E /I /Y /Q
    if %errorlevel% equ 0 (
        echo Backup created successfully
    ) else (
        echo Warning: Backup might have failed
    )
) else (
    echo No data to backup
)

echo.
echo Step 2: Stopping Grafana...
docker-compose stop grafana
if %errorlevel% neq 0 (
    echo Warning: Could not stop Grafana (might not be running)
)

echo.
echo Step 3: Pulling new Grafana image (11.0.0)...
docker-compose pull grafana
if %errorlevel% neq 0 (
    echo ERROR: Failed to pull new image
    echo Check your internet connection
    pause
    exit /b 1
)
echo OK: New image downloaded

echo.
echo Step 4: Removing old container...
docker-compose rm -f grafana
if %errorlevel% neq 0 (
    echo Warning: Could not remove container
)

echo.
echo Step 5: Starting Grafana with new version...
docker-compose up -d grafana
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Grafana
    pause
    exit /b 1
)
echo OK: Grafana started

echo.
echo Step 6: Waiting for Grafana to initialize (20 seconds)...
timeout /t 20 /nobreak

echo.
echo Step 7: Checking Grafana health...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: Grafana is healthy
) else (
    echo Warning: Grafana might need more time to start
    echo Wait a few more seconds and check: http://localhost:3000
)

echo.
echo Step 8: Checking Grafana version...
docker-compose exec grafana grafana-server -v 2>nul
if %errorlevel% neq 0 (
    echo Note: Version check failed (Grafana might still be starting)
)

echo.
echo ========================================
echo Update Complete!
echo ========================================
echo.
echo Grafana has been updated to version 11.0.0
echo.
echo Next steps:
echo 1. Open Grafana: http://localhost:3000
echo 2. Login: admin / admin
echo 3. If password change is required, change it
echo 4. Go to Configuration -^> Users and access -^> Settings
echo 5. Enable "Anonymous access" -^> Save
echo 6. Import dashboard: import_dashboard.bat
echo.
echo Backup location: %BACKUP_DIR%
echo.
echo If you have issues, check UPDATE_GRAFANA.md for rollback instructions
echo.
pause



