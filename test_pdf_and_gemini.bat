@echo off
echo ========================================
echo Testing PDF Export and Gemini API
echo ========================================
echo.

echo [1/4] Checking if services are running...
docker compose ps | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo ERROR: Docker services are not running!
    echo Please run: docker compose up -d
    pause
    exit /b 1
)
echo ✓ Services are running
echo.

echo [2/4] Checking AI Status...
curl -s http://localhost:8000/api/reports/ai-status
echo.
echo.

echo [3/4] Generating test report...
curl -s -X POST "http://localhost:8000/api/reports/generate?report_type=performance&time_range=1h" > temp_report.json
echo.
echo Report generated! Check temp_report.json for the report ID.
echo.

echo [4/4] To download PDF, use the report ID from temp_report.json:
echo curl -X GET "http://localhost:8000/api/reports/{REPORT_ID}/pdf?include_ai=true" --output report_test.pdf
echo.
echo Or manually download from: http://localhost:8000/api/reports/{REPORT_ID}/pdf?include_ai=true
if exist report_test.pdf (
    echo ✓ PDF downloaded successfully: report_test.pdf
) else (
    echo ✗ PDF download failed
)
echo.

echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open report_test.pdf to see the PDF export
echo 2. Check if AI analysis is included (if Gemini API key is set)
echo 3. Start simulator: python robot_client\simulator.py
echo.
pause

