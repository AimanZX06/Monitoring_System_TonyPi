# How to Start Simulator and Test PDF Export & Gemini API

## Quick Start Guide

### Step 1: Ensure Docker Services Are Running

All services should already be running. Verify with:
```bash
docker compose ps
```

You should see all 6 services running:
- ✅ tonypi_backend (port 8000)
- ✅ tonypi_frontend (port 3001)
- ✅ tonypi_mosquitto (ports 1883, 9001)
- ✅ tonypi_influxdb (port 8086)
- ✅ tonypi_postgres (port 5432)
- ✅ tonypi_grafana (port 3000)

### Step 2: Configure Gemini API Key (Optional but Recommended)

The Gemini API key is optional - PDF export works without it, but AI analysis won't be available.

**To enable Gemini AI:**

1. Get a free API key from Google AI Studio: https://makersuite.google.com/app/apikey

2. Set the environment variable for the backend container:
```bash
# Windows (PowerShell)
docker compose exec backend powershell -Command "[Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'YOUR_API_KEY_HERE', 'Process')"

# Or restart the backend with the environment variable
# Edit docker-compose.yml and add GEMINI_API_KEY under backend environment section
```

**Or update docker-compose.yml:**
```yaml
backend:
  environment:
    - GEMINI_API_KEY=your-api-key-here
```

Then restart:
```bash
docker compose restart backend
```

**Check if Gemini is available:**
```bash
curl http://localhost:8000/api/reports/ai-status
```

### Step 3: Install Simulator Dependencies

```bash
cd robot_client
pip install -r requirements.txt
```

### Step 4: Start the Simulator

Open a **new terminal window** and run:

```bash
cd robot_client
python simulator.py
```

Or if running from project root:
```bash
python robot_client/simulator.py
```

**Expected output:**
```
🤖 TonyPi Robot Simulator Starting...
📡 MQTT Broker: localhost:1883
🎯 Realistic Sensors: True
🌊 Movement Drift: True
Press Ctrl+C to stop the simulator
✅ Connected to MQTT broker at localhost:1883
✅ Successfully connected to MQTT broker
```

The simulator will start sending data automatically!

### Step 5: Verify Data is Flowing

**Check backend logs:**
```bash
docker compose logs backend --tail 50 | findstr /i "mqtt"
```

You should see messages like:
- "Received sensor data from robot_id: tonypi_..."
- "Stored data in InfluxDB"

**Check frontend:**
- Open http://localhost:3001
- Navigate to "Monitoring" tab
- You should see real-time charts updating

### Step 6: Generate a Report and Test PDF Export

**Option A: Using the API directly**

1. **Generate a performance report:**
```bash
curl -X POST "http://localhost:8000/api/reports/generate?report_type=performance&time_range=1h"
```

This will return a report ID (e.g., `{"id": 1, ...}`)

2. **Download PDF with AI analysis:**
```bash
# Replace {report_id} with the ID from step 1
curl -X GET "http://localhost:8000/api/reports/{report_id}/pdf?include_ai=true" --output report.pdf
```

**Option B: Using the Frontend**

1. Open http://localhost:3001
2. Navigate to the Reports section (if available in UI)
3. Generate a report
4. Click "Download PDF"

### Step 7: Test Gemini API Status

**Check if Gemini is configured:**
```bash
curl http://localhost:8000/api/reports/ai-status
```

**Expected response (with API key):**
```json
{
  "gemini_available": true,
  "pdf_available": true,
  "message": "Gemini AI is ready for analysis"
}
```

**Expected response (without API key):**
```json
{
  "gemini_available": false,
  "pdf_available": true,
  "message": "Set GEMINI_API_KEY in environment to enable AI analysis"
}
```

## Testing PDF Export Features

### Test 1: PDF Export Without AI
```bash
# Generate report
REPORT_ID=$(curl -s -X POST "http://localhost:8000/api/reports/generate?report_type=performance&time_range=1h" | python -c "import sys, json; print(json.load(sys.stdin)['id'])")

# Download PDF without AI
curl -X GET "http://localhost:8000/api/reports/$REPORT_ID/pdf?include_ai=false" --output report_no_ai.pdf
```

### Test 2: PDF Export With AI (if Gemini API key is set)
```bash
# Download PDF with AI analysis
curl -X GET "http://localhost:8000/api/reports/$REPORT_ID/pdf?include_ai=true" --output report_with_ai.pdf
```

### Test 3: Create Custom Report
```bash
curl -X POST http://localhost:8000/api/reports \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Report\",
    \"description\": \"Testing PDF export\",
    \"report_type\": \"performance\",
    \"data\": {
      \"avg_cpu_percent\": 45.5,
      \"avg_memory_percent\": 60.2,
      \"avg_temperature\": 55.3,
      \"data_points\": 100,
      \"period\": \"1h\"
    }
  }"
```

Then download the PDF using the returned report ID.

## Troubleshooting

### Simulator Not Connecting
- Check if MQTT broker is running: `docker compose ps mosquitto`
- Check MQTT logs: `docker compose logs mosquitto`
- Try connecting to `localhost:1883` explicitly

### PDF Export Not Working
- Check backend logs: `docker compose logs backend`
- Verify reportlab is installed in backend container
- Check if report exists: `curl http://localhost:8000/api/reports/{id}`

### Gemini API Not Working
- Verify API key is set: `curl http://localhost:8000/api/reports/ai-status`
- Check backend logs for Gemini initialization messages
- Ensure `google-generativeai` package is installed in backend
- Test API key validity at https://makersuite.google.com/app/apikey

### No Data in Reports
- Ensure simulator is running and sending data
- Wait a few minutes for data to accumulate
- Check InfluxDB: `curl http://localhost:8086/api/v2/query`

## Quick Test Script

Save this as `test_pdf_and_gemini.bat` (Windows):

```batch
@echo off
echo Testing PDF Export and Gemini API...

echo.
echo 1. Checking AI Status...
curl http://localhost:8000/api/reports/ai-status

echo.
echo 2. Generating test report...
curl -X POST "http://localhost:8000/api/reports/generate?report_type=performance&time_range=1h"

echo.
echo 3. Done! Check the response above for the report ID.
echo    Then download PDF with: curl -X GET "http://localhost:8000/api/reports/{ID}/pdf?include_ai=true" --output report.pdf
pause
```

## Summary

✅ **To see PDF export:** Generate a report and download it via API or frontend  
✅ **To see Gemini API:** Set `GEMINI_API_KEY` environment variable and restart backend  
✅ **To generate test data:** Run `python robot_client/simulator.py`  

The PDF will include AI analysis sections if Gemini API key is configured!




