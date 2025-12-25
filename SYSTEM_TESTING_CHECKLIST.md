# Complete System Testing Checklist

This checklist covers all system features and functionality verification.

---

## 📋 Checklist Overview

- [ ] **1. Check SDK Installation**
- [ ] **2. Check Servo Data Retrieval & Sending**
- [ ] **3. Check InfluxDB & PostgreSQL Data Storage**
- [ ] **4. Check PDF Export Functionality**
- [ ] **5. Check Raspberry Pi Task Manager (Performance Monitoring)**
- [ ] **6. Check Multi-Robot Simulation**
- [ ] **7. Check Grafana Frontend Integration**
- [ ] **8. Add OpenAI API for Data Analysis**

---

## ✅ 1. Check SDK Installation

### **Step 1.1: Check if HiwonderSDK is Installed**

**On Raspberry Pi (via SSH):**
```bash
ssh pi@your-robot-ip

# Check pip packages
pip3 list | grep -i hiwonder

# Test SDK import
python3 -c "from hiwonder import Board; print('✅ SDK installed')" 2>&1 || echo "❌ SDK not installed"
```

**Or use remote check script:**
```cmd
check_sdk_remote.bat
```

### **Step 1.2: Record Results**

- [ ] SDK is installed → Proceed to Step 2
- [ ] SDK is NOT installed → Install it (see Step 1.3)

### **Step 1.3: Install SDK (If Not Installed)**

**On Raspberry Pi:**
```bash
cd ~
git clone https://github.com/Hiwonder-docs/hiwonder-sdk-python.git
cd hiwonder-sdk-python
sudo pip3 install .

# Verify installation
python3 -c "from hiwonder import Board; print('✅ Installation successful')"
```

### **Step 1.4: Verify Installation**

- [ ] SDK can be imported without errors
- [ ] SDK functions are accessible
- [ ] Ready to use in robot client code

**Status:** ☐ Complete

---

## ✅ 2. Check Servo Data Retrieval & Sending

### **Step 2.1: Add Servo Monitoring Code**

**Update `robot_client/tonypi_client.py`:**

Add servo monitoring functions (I can provide the exact code based on your SDK status).

### **Step 2.2: Test Servo Data Reading**

**On Raspberry Pi, test servo reading:**
```bash
python3 -c "
import hiwonder.ros_robot_controller_sdk as rrc
try:
    board = rrc.Board()
    # Try to read servo data (method names may vary)
    try:
        temp = board.getBusServoTemp(1)
        pos = board.getBusServoPosition(1)
        print(f'Servo 1 - Temp: {temp/10.0}°C, Position: {pos}°')
        print('✅ Servo data can be read')
    except AttributeError:
        # Method names might be different - check available methods
        print('⚠️  SDK loaded but method names may differ')
        print(f'Available methods: {[m for m in dir(board) if \"servo\" in m.lower()][:5]}')
except ImportError as e:
    print(f'❌ SDK not installed: {e}')
except Exception as e:
    print(f'❌ Error: {e}')
"
```

### **Step 2.3: Verify Data Sending via MQTT**

**On your PC, subscribe to MQTT topics:**
```bash
docker exec -it tonypi_mosquitto mosquitto_sub -t "tonypi/servos/#" -v
```

**Expected:** Should see servo data messages if robot is sending

### **Step 2.4: Check Backend Receives Data**

**Check backend logs:**
```bash
docker-compose logs backend --tail 50 | findstr /i "servo"
```

**Expected:** Should see messages like "MQTT: Received message on tonypi/servos/..."

### **Step 2.5: Verify Data in Database**

**Check InfluxDB:**
```bash
curl -XPOST "http://localhost:8086/api/v2/query?org=tonypi" \
  -H "Authorization: Token my-super-secret-auth-token" \
  -H "Content-Type: application/vnd.flux" \
  -d 'from(bucket: "robot_data")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_measurement"] == "servos")
        |> limit(n: 5)'
```

**Expected:** Should return servo data if stored

### **Step 2.6: Check Frontend Display**

1. Open: http://localhost:3001
2. Go to **Monitoring** tab
3. Check if servo data appears
4. Check **Advanced Analytics** section for servo charts

### **Step 2.7: Verification Checklist**

- [ ] Servo data can be read from hardware
- [ ] Data is sent via MQTT
- [ ] Backend receives MQTT messages
- [ ] Data is stored in InfluxDB
- [ ] Data appears in frontend
- [ ] Multiple servos can be monitored

**Status:** ☐ Complete

---

## ✅ 3. Check InfluxDB & PostgreSQL Data Storage

### **Step 3.1: Check InfluxDB is Running**

```bash
# Check container status
docker-compose ps influxdb

# Check health
curl http://localhost:8086/api/health
```

**Expected:** Container running, health check returns OK

### **Step 3.2: Verify InfluxDB Data Storage**

**Check if data is being stored:**
```bash
# Query recent robot status data
curl -XPOST "http://localhost:8086/api/v2/query?org=tonypi" \
  -H "Authorization: Token my-super-secret-auth-token" \
  -H "Content-Type: application/vnd.flux" \
  -d 'from(bucket: "robot_data")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_measurement"] == "robot_status")
        |> limit(n: 10)'
```

**Expected:** Should return time-series data

### **Step 3.3: Check PostgreSQL is Running**

```bash
# Check container status
docker-compose ps postgres

# Check connection
docker exec tonypi_postgres pg_isready
```

**Expected:** Container running, connection ready

### **Step 3.4: Verify PostgreSQL Data Storage**

**Check tables exist:**
```bash
docker exec tonypi_postgres psql -U postgres -d tonypi_db -c "\dt"
```

**Expected:** Should show tables: `jobs`, `robots`, `reports`, `system_logs`

### **Step 3.5: Check Data in PostgreSQL**

**Check robots table:**
```bash
docker exec tonypi_postgres psql -U postgres -d tonypi_db -c "SELECT * FROM robots;"
```

**Check jobs table:**
```bash
docker exec tonypi_postgres psql -U postgres -d tonypi_db -c "SELECT * FROM jobs ORDER BY created_at DESC LIMIT 5;"
```

**Check reports table:**
```bash
docker exec tonypi_postgres psql -U postgres -d tonypi_db -c "SELECT id, title, report_type, created_at FROM reports ORDER BY created_at DESC LIMIT 5;"
```

**Expected:** Should show data if robots are connected and jobs/reports exist

### **Step 3.6: Test Data Persistence**

1. **Create a job** (trigger QR scan in frontend)
2. **Stop backend:** `docker-compose stop backend`
3. **Start backend:** `docker-compose start backend`
4. **Check if job still exists:**
   ```bash
   curl http://localhost:8000/api/robots-db/jobs/history
   ```

**Expected:** Job data should persist after restart

### **Step 3.7: Verification Checklist**

- [ ] InfluxDB is running and healthy
- [ ] Time-series data is being stored in InfluxDB
- [ ] PostgreSQL is running and healthy
- [ ] Tables exist in PostgreSQL
- [ ] Robot data is stored in PostgreSQL
- [ ] Job data is stored in PostgreSQL
- [ ] Report data is stored in PostgreSQL
- [ ] Data persists after service restart

**Status:** ☐ Complete

---

## ✅ 4. Check PDF Export Functionality

### **Step 4.1: Verify PDF Library is Installed**

**Check backend requirements:**
```bash
docker-compose exec backend pip list | grep -i reportlab
```

**Expected:** Should show `reportlab` package

**If not installed:**
```bash
docker-compose exec backend pip install reportlab
```

### **Step 4.2: Create a Test Report**

**Via API:**
```bash
curl -X POST "http://localhost:8000/api/reports/generate?report_type=performance&time_range=1h" \
  -H "Content-Type: application/json"
```

**Expected:** Should return report JSON with ID

### **Step 4.3: Download PDF Report**

**Get report ID from Step 4.2, then:**
```bash
curl "http://localhost:8000/api/reports/1/pdf" -o test_report.pdf
```

**Or replace `1` with actual report ID**

**Expected:** PDF file should be downloaded

### **Step 4.4: Verify PDF Content**

1. Open `test_report.pdf`
2. Check:
   - [ ] PDF opens correctly
   - [ ] Contains report title
   - [ ] Contains data tables
   - [ ] Contains timestamps
   - [ ] Professional formatting

### **Step 4.5: Test Different Report Types**

**Performance Report:**
```bash
curl -X POST "http://localhost:8000/api/reports/generate?report_type=performance&time_range=24h" \
  -H "Content-Type: application/json"
```

**Job Report:**
```bash
curl -X POST "http://localhost:8000/api/reports/generate?report_type=job&robot_id=tonypi_raspberrypi&time_range=24h" \
  -H "Content-Type: application/json"
```

**Then download PDFs for each**

### **Step 4.6: Test via Frontend (If Available)**

1. Open: http://localhost:3001
2. Navigate to Reports section (if exists)
3. Generate report
4. Download PDF
5. Verify PDF opens and contains data

### **Step 4.7: Verification Checklist**

- [ ] ReportLab library is installed
- [ ] Reports can be generated via API
- [ ] PDF can be downloaded via API
- [ ] PDF opens correctly
- [ ] PDF contains correct data
- [ ] PDF has professional formatting
- [ ] Multiple report types work
- [ ] PDFs can be generated for different time ranges

**Status:** ☐ Complete

---

## ✅ 5. Check Raspberry Pi Task Manager (Performance Monitoring)

### **Step 5.1: Connect Robot**

**On Raspberry Pi:**
```bash
cd ~/robot_client
python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
```

**Expected:** Robot connects and starts sending data

### **Step 5.2: Check Performance Data in Frontend**

1. Open: http://localhost:3001
2. Go to **Performance** tab (or **Monitoring** tab)
3. Verify:
   - [ ] CPU Usage chart is visible
   - [ ] Memory Usage chart is visible
   - [ ] Disk Usage is visible
   - [ ] Temperature gauge is visible
   - [ ] All metrics updating every 5 seconds

### **Step 5.3: Verify Real-Time Updates**

1. **Watch the charts for 30 seconds**
2. **Verify:**
   - [ ] Charts update automatically
   - [ ] Values change over time
   - [ ] No errors in browser console (F12)

### **Step 5.4: Test Task Manager Features**

**Check each metric:**
- [ ] **CPU Usage:** Shows percentage, updates in real-time
- [ ] **Memory Usage:** Shows percentage, updates in real-time
- [ ] **Disk Usage:** Shows percentage, updates in real-time
- [ ] **Temperature:** Shows temperature in °C, color-coded
- [ ] **Uptime:** Shows system uptime

### **Step 5.5: Verify Historical Data**

1. **Let robot run for 5 minutes**
2. **Check charts show historical trend**
3. **Verify:**
   - [ ] Charts show multiple data points
   - [ ] Historical trend is visible
   - [ ] Data persists (doesn't disappear)

### **Step 5.6: Test API Endpoint**

```bash
# Get performance data
curl "http://localhost:8000/api/pi/perf/tonypi_raspberrypi"
```

**Expected:** Should return JSON with CPU, memory, disk, temperature, uptime

### **Step 5.7: Verify Data in InfluxDB**

```bash
curl -XPOST "http://localhost:8086/api/v2/query?org=tonypi" \
  -H "Authorization: Token my-super-secret-auth-token" \
  -H "Content-Type: application/vnd.flux" \
  -d 'from(bucket: "robot_data")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_measurement"] == "robot_status")
        |> filter(fn: (r) => r["_field"] == "system_cpu_percent")
        |> limit(n: 10)'
```

**Expected:** Should return CPU data points

### **Step 5.8: Verification Checklist**

- [ ] Robot connects successfully
- [ ] Performance tab displays all metrics
- [ ] Charts update in real-time (every 5 seconds)
- [ ] CPU, Memory, Disk, Temperature all visible
- [ ] Historical data is shown
- [ ] API endpoint returns correct data
- [ ] Data is stored in InfluxDB
- [ ] Task Manager UI works like Windows Task Manager

**Status:** ☐ Complete

---

## ✅ 6. Check Multi-Robot Simulation

### **Step 6.1: Start First Robot Simulator**

**Terminal 1:**
```bash
cd robot_client
python simulator.py --robot-id tonypi_robot_1
```

**Expected:** Simulator connects and starts sending data

### **Step 6.2: Start Second Robot Simulator**

**Terminal 2:**
```bash
cd robot_client
python simulator.py --robot-id tonypi_robot_2
```

**Expected:** Second simulator connects

### **Step 6.3: Verify Both Robots in Frontend**

1. Open: http://localhost:3001
2. Go to **Robots** tab
3. Verify:
   - [ ] Both robots appear in grid
   - [ ] Each has unique robot ID
   - [ ] Both show "online" status
   - [ ] Both have different data

### **Step 6.4: Check Multi-Robot Data**

**Check API:**
```bash
curl http://localhost:8000/api/robot-data/status
```

**Expected:** Should return array with both robots

### **Step 6.5: Verify Individual Robot Data**

**Check Robot 1:**
```bash
curl "http://localhost:8000/api/robot-data/latest/tonypi_robot_1"
```

**Check Robot 2:**
```bash
curl "http://localhost:8000/api/robot-data/latest/tonypi_robot_2"
```

**Expected:** Each should return different data

### **Step 6.6: Test Performance Tab with Multiple Robots**

1. Go to **Performance** tab
2. Check if you can switch between robots
3. Verify:
   - [ ] Can select different robots
   - [ ] Data changes when switching robots
   - [ ] Each robot's data is unique

### **Step 6.7: Verify Database Storage**

**Check PostgreSQL:**
```bash
docker exec tonypi_postgres psql -U postgres -d tonypi_db -c "SELECT robot_id, status, last_seen FROM robots;"
```

**Expected:** Should show both robots

**Check InfluxDB:**
```bash
curl -XPOST "http://localhost:8086/api/v2/query?org=tonypi" \
  -H "Authorization: Token my-super-secret-auth-token" \
  -H "Content-Type: application/vnd.flux" \
  -d 'from(bucket: "robot_data")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_measurement"] == "robot_status")
        |> group(columns: ["robot_id"])
        |> limit(n: 10)'
```

**Expected:** Should show data from both robots

### **Step 6.8: Test with Real Robot + Simulator**

1. **Connect real robot** (if available)
2. **Run simulator** on PC
3. **Verify:**
   - [ ] Both appear in frontend
   - [ ] Can distinguish between real and simulated
   - [ ] Both send data correctly

### **Step 6.9: Verification Checklist**

- [ ] Can run multiple simulators simultaneously
- [ ] Multiple robots appear in frontend
- [ ] Each robot has unique ID
- [ ] Can view individual robot data
- [ ] Can switch between robots in UI
- [ ] Data is stored separately in databases
- [ ] System handles multiple robots without conflicts
- [ ] Real robot + simulator can run together

**Status:** ☐ Complete

---

## ✅ 7. Check Grafana Frontend Integration

### **Step 7.1: Verify Grafana is Running**

```bash
# Check container
docker-compose ps grafana

# Check health
curl http://localhost:3000/api/health
```

**Expected:** Container running, health OK

### **Step 7.2: Verify Dashboard Exists**

**Check if dashboard is imported:**
```bash
curl -u admin:admin http://localhost:3000/api/dashboards/uid/tonypi-robot-monitoring
```

**If 404, import it:**
```cmd
import_dashboard.bat
```

### **Step 7.3: Test Grafana Access**

1. Open: http://localhost:3000
2. Login: `admin` / `admin`
3. Navigate to dashboard: http://localhost:3000/d/tonypi-robot-monitoring
4. Verify:
   - [ ] Dashboard loads
   - [ ] All 8 panels are visible
   - [ ] Panels show data (if robot is connected)

### **Step 7.4: Check Frontend Integration**

1. Open: http://localhost:3001
2. Go to **Monitoring** tab
3. Scroll to **"Advanced Analytics (Grafana)"** section
4. Verify:
   - [ ] Section is visible
   - [ ] Grafana panels are embedded
   - [ ] No "Panel not found" errors
   - [ ] No "Unauthorized" errors
   - [ ] Panels load and display data

### **Step 7.5: Test Individual Panels**

**Check each panel:**
- [ ] Panel 1 (CPU & Memory) loads
- [ ] Panel 2 (CPU Temperature) loads
- [ ] Panel 3 (Battery) loads
- [ ] Panel 4 (Accelerometer) loads
- [ ] Panel 5 (Gyroscope) loads
- [ ] Panel 6 (Distance) loads
- [ ] Panel 7 (Light Level) loads
- [ ] Panel 8 (Servo Angle) loads

### **Step 7.6: Test Anonymous Access**

1. Open incognito/private window
2. Go to: http://localhost:3000
3. Verify:
   - [ ] Can access without login
   - [ ] Can view dashboards
   - [ ] Panels load correctly

### **Step 7.7: Check Browser Console**

1. Open frontend: http://localhost:3001
2. Press `F12` → **Console** tab
3. Go to **Monitoring** tab
4. Check for errors:
   - [ ] No CORS errors
   - [ ] No iframe errors
   - [ ] No authentication errors

### **Step 7.8: Verification Checklist**

- [ ] Grafana is running and accessible
- [ ] Dashboard exists and is imported
- [ ] Can access Grafana directly
- [ ] Frontend embeds Grafana panels
- [ ] All 8 panels load without errors
- [ ] No "Panel not found" errors
- [ ] No "Unauthorized" errors
- [ ] Panels display data (if available)
- [ ] Anonymous access works
- [ ] Panels auto-refresh

**Status:** ☐ Complete

---

## ✅ 8. Add OpenAI API for Data Analysis

### **Step 8.1: Get OpenAI API Key**

1. Go to: https://platform.openai.com/api-keys
2. Create account (if needed)
3. Create new API key
4. **Copy the key** (save it securely)

### **Step 8.2: Add API Key to Environment**

**Create/Update `.env` file:**
```env
OPENAI_API_KEY=sk-your-api-key-here
```

### **Step 8.3: Install OpenAI SDK**

**Update `backend/requirements.txt`:**
```txt
openai>=1.0.0
```

**Install:**
```bash
docker-compose exec backend pip install openai
```

**Or rebuild backend:**
```bash
docker-compose build backend
docker-compose up -d backend
```

### **Step 8.4: Create Analytics Service**

**Create `backend/services/analytics.py`:**

```python
import os
from typing import Dict, List, Any
import openai
from datetime import datetime

class SensorAnalytics:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in environment")
        self.client = openai.OpenAI(api_key=api_key)
    
    def analyze_sensors(self, sensor_data: List[Dict], robot_id: str) -> Dict[str, Any]:
        """Analyze sensor data using OpenAI"""
        try:
            # Prepare data summary
            summary = self._prepare_summary(sensor_data)
            
            # Create prompt
            prompt = f"""
            Analyze the following sensor data from robot {robot_id}:
            
            {summary}
            
            Provide:
            1. Overall health assessment
            2. Any anomalies or concerns
            3. Maintenance recommendations
            4. Performance insights
            
            Format as JSON with keys: health_status, anomalies, maintenance_recommendations, insights
            """
            
            # Call OpenAI
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # or "gpt-3.5-turbo" for cheaper
                messages=[
                    {"role": "system", "content": "You are a robotics maintenance expert. Analyze sensor data and provide actionable insights."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            # Parse response
            analysis = response.choices[0].message.content
            
            return {
                "robot_id": robot_id,
                "analysis": analysis,
                "timestamp": datetime.now().isoformat(),
                "model": "gpt-4o-mini"
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "robot_id": robot_id
            }
    
    def predict_maintenance(self, robot_id: str, historical_data: List[Dict]) -> Dict[str, Any]:
        """Predict maintenance needs based on historical data"""
        # Similar implementation
        pass
    
    def _prepare_summary(self, sensor_data: List[Dict]) -> str:
        """Prepare sensor data summary for analysis"""
        # Aggregate and format data
        summary = "Sensor Data Summary:\n"
        # ... format data
        return summary
```

### **Step 8.5: Create Analytics Router**

**Create `backend/routers/analytics.py`:**

```python
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from services.analytics import SensorAnalytics
from database.influx_client import influx_client

router = APIRouter()
analytics = SensorAnalytics()

@router.post("/analytics/analyze-sensors")
async def analyze_sensors(
    robot_id: str,
    time_range: str = "24h"
):
    """Analyze sensor data using OpenAI"""
    try:
        # Get sensor data from InfluxDB
        sensor_data = influx_client.query_recent_data("sensors", time_range)
        filtered_data = [d for d in sensor_data if d.get('robot_id') == robot_id]
        
        if not filtered_data:
            raise HTTPException(status_code=404, detail="No sensor data found")
        
        # Analyze with OpenAI
        analysis = analytics.analyze_sensors(filtered_data, robot_id)
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analytics/predict-maintenance")
async def predict_maintenance(robot_id: str):
    """Predict maintenance needs using OpenAI"""
    # Implementation
    pass
```

### **Step 8.6: Integrate with Reports**

**Update `backend/routers/reports.py`:**

Add OpenAI analysis to PDF generation:

```python
from services.analytics import SensorAnalytics

@router.post("/reports/generate-with-analysis")
async def generate_report_with_analysis(
    robot_id: str,
    report_type: str = "performance",
    time_range: str = "24h"
):
    """Generate report with OpenAI analysis"""
    # Generate report
    report = await generate_and_store_report(robot_id, report_type, time_range)
    
    # Get sensor data
    sensor_data = influx_client.query_recent_data("sensors", time_range)
    
    # Analyze with OpenAI
    analytics = SensorAnalytics()
    analysis = analytics.analyze_sensors(sensor_data, robot_id)
    
    # Add analysis to report
    report.data["ai_analysis"] = analysis
    
    # Generate PDF with analysis
    pdf_content = generate_pdf_report(report.data, report_type, robot_id)
    
    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_with_analysis_{robot_id}.pdf"}
    )
```

### **Step 8.7: Update PDF Generation to Include Analysis**

**Update `generate_pdf_report()` function:**

Add AI analysis section to PDF:

```python
def generate_pdf_report(report_data: dict, report_type: str, robot_id: Optional[str] = None) -> bytes:
    # ... existing code ...
    
    # Add AI Analysis section if available
    if "ai_analysis" in report_data:
        story.append(Paragraph("AI Analysis", heading_style))
        analysis = report_data["ai_analysis"]
        
        if "analysis" in analysis:
            story.append(Paragraph(analysis["analysis"], styles['Normal']))
        
        if "maintenance_recommendations" in analysis:
            story.append(Paragraph("Maintenance Recommendations:", styles['Heading3']))
            for rec in analysis["maintenance_recommendations"]:
                story.append(Paragraph(f"• {rec}", styles['Normal']))
    
    # ... rest of PDF generation ...
```

### **Step 8.8: Test OpenAI Integration**

**Test API endpoint:**
```bash
curl -X POST "http://localhost:8000/api/analytics/analyze-sensors?robot_id=tonypi_raspberrypi&time_range=24h" \
  -H "Content-Type: application/json"
```

**Expected:** Should return AI analysis JSON

### **Step 8.9: Test PDF with Analysis**

**Generate report with analysis:**
```bash
curl -X POST "http://localhost:8000/api/reports/generate-with-analysis?robot_id=tonypi_raspberrypi&time_range=24h" \
  -H "Content-Type: application/json" \
  -o report_with_ai.pdf
```

**Verify PDF:**
- [ ] PDF opens correctly
- [ ] Contains AI analysis section
- [ ] Contains maintenance recommendations
- [ ] Contains insights

### **Step 8.10: Add to Frontend (Optional)**

**Create Analytics tab or section:**
- Display AI analysis
- Show maintenance recommendations
- Display insights

### **Step 8.11: Verification Checklist**

- [ ] OpenAI API key is configured
- [ ] OpenAI SDK is installed
- [ ] Analytics service is created
- [ ] API endpoint works
- [ ] Analysis is generated correctly
- [ ] Analysis is included in PDF reports
- [ ] PDF contains AI insights
- [ ] Maintenance recommendations are provided
- [ ] Error handling works (if API fails)

**Status:** ☐ Complete

---

## 📊 Overall Testing Summary

### **Quick Test Script**

Create `run_all_tests.bat`:

```batch
@echo off
echo ========================================
echo Complete System Testing
echo ========================================
echo.

echo [1/8] Checking SDK...
call check_sdk_remote.bat
pause

echo.
echo [2/8] Testing Servo Data...
echo Connect robot and check MQTT messages
pause

echo.
echo [3/8] Testing Databases...
docker-compose ps influxdb postgres
curl http://localhost:8086/api/health
docker exec tonypi_postgres pg_isready
pause

echo.
echo [4/8] Testing PDF Export...
curl -X POST "http://localhost:8000/api/reports/generate?report_type=performance" -H "Content-Type: application/json"
pause

echo.
echo [5/8] Testing Task Manager...
echo Open http://localhost:3001/monitoring
pause

echo.
echo [6/8] Testing Multi-Robot...
echo Run multiple simulators
pause

echo.
echo [7/8] Testing Grafana...
curl http://localhost:3000/api/health
echo Open http://localhost:3001/monitoring
pause

echo.
echo [8/8] Testing OpenAI...
curl -X POST "http://localhost:8000/api/analytics/analyze-sensors?robot_id=test&time_range=1h"
pause

echo.
echo ========================================
echo All Tests Complete
echo ========================================
```

---

## ✅ Final Verification

After completing all checks:

- [ ] All 8 sections completed
- [ ] All features working
- [ ] No critical errors
- [ ] Documentation updated
- [ ] System ready for use

---

**Last Updated:** December 2025





