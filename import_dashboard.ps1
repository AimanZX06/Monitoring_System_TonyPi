# PowerShell script to import Grafana dashboard via API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Grafana Dashboard Import Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$GRAFANA_URL = "http://localhost:3000"
$GRAFANA_USER = "admin"
$GRAFANA_PASSWORD = "admin"
$DASHBOARD_FILE = "grafana\provisioning\dashboards\tonypi-dashboard.json"
$DASHBOARD_UID = "tonypi-robot-monitoring"

# Check if Grafana is accessible
Write-Host "Step 1: Checking Grafana accessibility..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$GRAFANA_URL/api/health" -Method Get -ErrorAction Stop
    Write-Host "✓ Grafana is accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ Cannot connect to Grafana at $GRAFANA_URL" -ForegroundColor Red
    Write-Host "  Make sure Grafana is running: docker-compose ps grafana" -ForegroundColor Yellow
    exit 1
}

# Check if dashboard file exists
Write-Host ""
Write-Host "Step 2: Checking dashboard file..." -ForegroundColor Yellow
if (Test-Path $DASHBOARD_FILE) {
    Write-Host "✓ Dashboard file found: $DASHBOARD_FILE" -ForegroundColor Green
} else {
    Write-Host "✗ Dashboard file not found: $DASHBOARD_FILE" -ForegroundColor Red
    Write-Host "  Please check the file path" -ForegroundColor Yellow
    exit 1
}

# Read dashboard JSON
Write-Host ""
Write-Host "Step 3: Reading dashboard JSON..." -ForegroundColor Yellow
try {
    $dashboardJson = Get-Content $DASHBOARD_FILE -Raw | ConvertFrom-Json
    Write-Host "✓ Dashboard JSON is valid" -ForegroundColor Green
} catch {
    Write-Host "✗ Invalid JSON in dashboard file" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Yellow
    exit 1
}

# Create credentials for API
$credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${GRAFANA_USER}:${GRAFANA_PASSWORD}"))
$headers = @{
    "Authorization" = "Basic $credentials"
    "Content-Type" = "application/json"
}

# Check if dashboard already exists
Write-Host ""
Write-Host "Step 4: Checking if dashboard already exists..." -ForegroundColor Yellow
try {
    $existing = Invoke-RestMethod -Uri "$GRAFANA_URL/api/dashboards/uid/$DASHBOARD_UID" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "⚠ Dashboard already exists with UID: $DASHBOARD_UID" -ForegroundColor Yellow
    Write-Host "  Current version: $($existing.dashboard.version)" -ForegroundColor Yellow
    $response = Read-Host "  Do you want to update it? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "  Import cancelled" -ForegroundColor Yellow
        exit 0
    }
} catch {
    Write-Host "✓ Dashboard does not exist, will create new" -ForegroundColor Green
}

# Prepare dashboard payload
Write-Host ""
Write-Host "Step 5: Preparing dashboard payload..." -ForegroundColor Yellow
$dashboardPayload = @{
    dashboard = $dashboardJson
    overwrite = $true
    folderId = $null
    folderUid = ""
} | ConvertTo-Json -Depth 100

# Import dashboard
Write-Host ""
Write-Host "Step 6: Importing dashboard..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$GRAFANA_URL/api/dashboards/db" -Method Post -Headers $headers -Body $dashboardPayload -ErrorAction Stop
    Write-Host "✓ Dashboard imported successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Dashboard UID: $($result.uid)" -ForegroundColor Cyan
    Write-Host "  Dashboard URL: $GRAFANA_URL/d/$($result.uid)" -ForegroundColor Cyan
    Write-Host "  Version: $($result.version)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Failed to import dashboard" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Yellow
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response: $responseBody" -ForegroundColor Yellow
    }
    exit 1
}

# Verify dashboard
Write-Host ""
Write-Host "Step 7: Verifying dashboard..." -ForegroundColor Yellow
try {
    $verify = Invoke-RestMethod -Uri "$GRAFANA_URL/api/dashboards/uid/$DASHBOARD_UID" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "✓ Dashboard verified successfully!" -ForegroundColor Green
    Write-Host "  Title: $($verify.dashboard.title)" -ForegroundColor Cyan
    Write-Host "  Panels: $($verify.dashboard.panels.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "⚠ Could not verify dashboard (but import may have succeeded)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Import Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open Grafana: $GRAFANA_URL/d/$DASHBOARD_UID" -ForegroundColor White
Write-Host "2. Verify all 8 panels are visible" -ForegroundColor White
Write-Host "3. Test frontend: http://localhost:3001/monitoring" -ForegroundColor White
Write-Host ""



