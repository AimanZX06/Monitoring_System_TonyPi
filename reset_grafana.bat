@echo off
echo ========================================
echo Grafana Complete Reset Script
echo ========================================
echo.
echo This will reset Grafana to fresh state:
echo - Stop Grafana
echo - Remove container
echo - Delete all data (fresh start)
echo - Start with default admin/admin
echo.
echo WARNING: This will delete all Grafana data!
echo.
pause

echo.
echo Step 1: Stopping Grafana...
docker-compose stop grafana
if %errorlevel% neq 0 (
    echo Warning: Could not stop Grafana (might not be running)
)

echo.
echo Step 2: Removing Grafana container...
docker-compose rm -f grafana
if %errorlevel% neq 0 (
    echo Warning: Could not remove container
)

echo.
echo Step 3: Removing Grafana data directory...
if exist "grafana\data" (
    echo Removing grafana\data...
    rmdir /s /q "grafana\data" 2>nul
    if %errorlevel% equ 0 (
        echo Grafana data removed successfully
    ) else (
        echo Warning: Could not remove data directory (might be in use)
        echo You may need to close Grafana and try again
    )
) else (
    echo Grafana data directory doesn't exist (already clean)
)

echo.
echo Step 4: Starting Grafana fresh...
docker-compose up -d grafana
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Grafana
    pause
    exit /b 1
)

echo.
echo Step 5: Waiting for Grafana to initialize (20 seconds)...
timeout /t 20 /nobreak

echo.
echo Step 6: Checking Grafana health...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: Grafana is running
) else (
    echo Warning: Grafana might not be ready yet
    echo Wait a few more seconds and check: http://localhost:3000
)

echo.
echo ========================================
echo Reset Complete!
echo ========================================
echo.
echo Grafana has been reset to fresh state.
echo.
echo Next steps:
echo 1. Open Grafana: http://localhost:3000
echo 2. Login with:
echo    Username: admin
echo    Password: admin
echo.
echo 3. If password change is required:
echo    - Change password to: admin (or any password)
echo    - OR click "Skip" if available
echo.
echo 4. After login, import dashboard:
echo    - Run: import_dashboard.bat
echo    - OR use UI: http://localhost:3000/dashboard/import
echo.
echo Note: If you still see "Sign in" after login:
echo - Clear browser cookies for localhost:3000
echo - Try incognito/private window
echo - Hard refresh: Ctrl+Shift+R
echo.
pause



