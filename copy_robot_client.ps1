# PowerShell script to copy robot_client.py to Raspberry Pi
# Usage: .\copy_robot_client.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$RobotIP,
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "pi",
    
    [Parameter(Mandatory=$false)]
    [string]$SourceFile = "robot_client\tonypi_client.py",
    
    [Parameter(Mandatory=$false)]
    [string]$DestinationPath = "/home/pi/robot_client/"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Copying Robot Client to Raspberry Pi" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if source file exists
if (-not (Test-Path $SourceFile)) {
    Write-Host "❌ Error: Source file not found: $SourceFile" -ForegroundColor Red
    Write-Host "   Make sure you're running this from the project root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "Source: $SourceFile" -ForegroundColor Green
Write-Host "Destination: ${Username}@${RobotIP}:${DestinationPath}" -ForegroundColor Green
Write-Host ""

# Create destination directory if it doesn't exist
Write-Host "Creating destination directory..." -ForegroundColor Yellow
ssh "${Username}@${RobotIP}" "mkdir -p ${DestinationPath}"

# Copy file using scp
Write-Host "Copying file..." -ForegroundColor Yellow
scp $SourceFile "${Username}@${RobotIP}:${DestinationPath}"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ File copied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. SSH into the robot: ssh ${Username}@${RobotIP}" -ForegroundColor White
    Write-Host "2. Navigate to: cd ${DestinationPath}" -ForegroundColor White
    Write-Host "3. Restart the client: python3 tonypi_client.py --broker YOUR_PC_IP" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Copy failed!" -ForegroundColor Red
    Write-Host "   Make sure:" -ForegroundColor Yellow
    Write-Host "   - OpenSSH client is installed (Windows Settings > Apps > Optional Features)" -ForegroundColor Yellow
    Write-Host "   - You can SSH to the robot: ssh ${Username}@${RobotIP}" -ForegroundColor Yellow
    Write-Host "   - The robot IP is correct" -ForegroundColor Yellow
}
