# TonyPi Connection Guide - Complete Walkthrough

This guide shows you how to connect your TonyPi robot to the monitoring system and see real-time updates in the frontend.

---

## 🎯 Quick Overview

**Data Flow:**
```
TonyPi Robot → MQTT → Backend → PostgreSQL + InfluxDB → Frontend
```

**What You'll See:**
- Robot appears in Frontend automatically
- Real-time CPU, Memory, Temperature, Disk usage
- Job tracking when robot scans QR codes
- System logs in PostgreSQL
- Historical data in InfluxDB

---

## 📋 Prerequisites

✅ Docker containers running (backend, frontend, postgres, influxdb, mosquitto)
✅ TonyPi Raspberry Pi 5 on same network
✅ Python 3 installed on TonyPi

---

## 🚀 Method 1: Quick Test with Simulator (Recommended First)

### Step 1: Run the Simulator on Your PC

```bash
# Navigate to robot_client folder
cd c:\Users\aiman\Projects\Monitoring_System_TonyPi\robot_client

# Install dependencies (if not already installed)
pip install paho-mqtt psutil

# Run simulator (connects to localhost)
python simulator.py
```

**Expected Output:**
```
Connecting to MQTT broker at localhost:1883...
Connected to MQTT broker!
Robot ID: tonypi_DESKTOP-XXXXX
Publishing status...
Publishing system info...
```

### Step 2: Check Frontend Updates

1. Open browser: **http://localhost:3001**
2. Click **"Overview"** tab
3. You should see:
   - ✅ Robot Status: **Connected** (turns green)
   - ✅ Robot ID: tonypi_DESKTOP-XXXXX
   - ✅ System metrics updating every 5 seconds

4. Click **"Performance"** tab:
   - ✅ CPU Usage chart
   - ✅ Memory Usage chart
   - ✅ Temperature gauge
   - ✅ Disk Usage
   - ✅ All updating in real-time!

5. Click **"Robots"** tab:
   - ✅ Your robot appears in the grid
   - ✅ Shows online status
   - ✅ Click "Details" to see full info

### Step 3: Verify Database Storage

```bash
# Check robot was registered in PostgreSQL
curl http://localhost:8000/api/robots-db/robots

# Check real-time stats
curl http://localhost:8000/api/robots-db/stats
```

**Expected Response:**
```json
{
  "total_robots": 1,
  "online_robots": 1,
  "offline_robots": 0,
  "total_jobs": 0,
  "active_jobs": 0,
  "completed_jobs_today": 0
}
```

### Step 4: Test Job Tracking

While simulator is running:

1. In **Overview** tab, scroll to **Robot Controls**
2. Select a QR code from dropdown (e.g., "QR12345 - Widget A")
3. Click **"Trigger Scan"** button
4. Watch the **Job Summary** section update:
   - Start time appears
   - Items processed: 1/0
   - Progress updates

5. Switch to **Jobs** tab:
   - See the active job in the list
   - Shows progress percentage
   - Real-time updates

6. Trigger more scans to see items increment

7. Check PostgreSQL:
```bash
# View job in database
curl http://localhost:8000/api/robots-db/jobs/history
```

---

## 🤖 Method 2: Connect Real TonyPi Robot

### Step 1: Find Your PC's IP Address

```cmd
# On Windows
ipconfig

# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.1.12
```

### Step 2: Prepare TonyPi Robot

**Option A: Via SSH**

```bash
# From your PC, connect to TonyPi
ssh pi@192.168.1.103

# Create directory
mkdir -p ~/tonypi_monitoring
cd ~/tonypi_monitoring
```

**Option B: Via File Transfer**
- Use WinSCP or FileZilla
- Connect to TonyPi (192.168.1.103)
- Upload entire `robot_client` folder to `/home/pi/`

### Step 3: Copy Robot Client Files

From your PC:
```bash
# Copy files to TonyPi
scp -r c:\Users\aiman\Projects\Monitoring_System_TonyPi\robot_client pi@192.168.1.103:/home/pi/
```

Or manually copy these files to TonyPi:
- `tonypi_client.py`
- `requirements.txt`
- `README.md`

### Step 4: Install Dependencies on TonyPi

```bash
# SSH into TonyPi
ssh pi@192.168.1.103

# Navigate to folder
cd ~/robot_client

# Install Python packages
pip3 install -r requirements.txt

# Or install individually
pip3 install paho-mqtt psutil
```

### Step 5: Run TonyPi Client

```bash
# Replace 192.168.1.12 with YOUR PC's IP address
python3 tonypi_client.py --broker 192.168.1.12 --port 1883
```

**Expected Output:**
```
Connecting to MQTT broker at 192.168.1.12:1883...
Connected to MQTT broker!
Robot ID: tonypi_raspberrypi
Publishing status...
Publishing system info...
  CPU: 15.2%
  Memory: 34.5%
  Disk: 42.1%
  Temperature: 45.3°C
```

### Step 6: Verify Frontend Updates

1. Open: **http://localhost:3001**
2. **Overview Tab**:
   - Robot Status: **Connected** ✅
   - Robot ID: **tonypi_raspberrypi** ✅
   - Real-time metrics updating

3. **Performance Tab**:
   - Task Manager showing Pi's actual CPU/Memory/Temp
   - Charts updating every 5 seconds

4. **Robots Tab**:
   - Robot card shows **online**
   - Location, last seen timestamp
   - Click "Details" for full info

---

## 📊 What Data is Being Captured

### Every 5 Seconds (Automatic)

**To InfluxDB:**
- `robot_status` measurement:
  - system_cpu_percent
  - system_memory_percent
  - system_disk_usage
  - system_temperature
  - system_uptime

**To PostgreSQL:**
- Robot record updated:
  - last_seen timestamp
  - status = 'online'

### On Job Events (QR Scans)

**To PostgreSQL `jobs` table:**
- Job created with start_time
- Items processed count
- Progress percentage
- Last item scanned
- Completion status

**To Frontend:**
- Real-time job progress updates
- Active job display
- Job history in Jobs tab

---

## 🔍 Verification Checklist

### Frontend Verification

- [ ] Open http://localhost:3001
- [ ] Overview tab shows "Connected" status
- [ ] Performance tab shows real-time charts
- [ ] Robots tab lists your robot
- [ ] Job tracking works (trigger scan test)

### Backend API Verification

```bash
# Check robot status
curl http://localhost:8000/api/robot-data/status

# Check robots in database
curl http://localhost:8000/api/robots-db/robots

# Check database stats
curl http://localhost:8000/api/robots-db/stats

# Check system logs
curl http://localhost:8000/api/robots-db/logs?limit=10
```

### Database Verification

```bash
# PostgreSQL - Check robot record
docker exec tonypi_postgres psql -U postgres -d tonypi_db -c "SELECT robot_id, status, last_seen FROM robots;"

# PostgreSQL - Check job records
docker exec tonypi_postgres psql -U postgres -d tonypi_db -c "SELECT robot_id, status, items_done, percent_complete FROM jobs ORDER BY start_time DESC LIMIT 5;"

# InfluxDB - Check recent data
curl -XPOST "http://localhost:8086/api/v2/query?org=tonypi" \
  -H "Authorization: Token my-super-secret-auth-token" \
  -H "Content-Type: application/vnd.flux" \
  -d 'from(bucket: "robot_data")
        |> range(start: -5m)
        |> filter(fn: (r) => r["_measurement"] == "robot_status")
        |> limit(n: 5)'
```

---

## 🎮 Interactive Testing

### Test 1: CPU Load Monitoring

On TonyPi, create CPU load:
```bash
# Generate CPU load
yes > /dev/null &

# Watch frontend Performance tab - CPU should spike
# Stop load: killall yes
```

### Test 2: Job Tracking

1. Frontend → Overview → Robot Controls
2. Select QR code from dropdown
3. Click "Trigger Scan" multiple times
4. Watch:
   - Job Summary updates
   - Items processed increments
   - Jobs tab shows active job
   - PostgreSQL stores the data

### Test 3: Multi-Robot

Run simulator on PC AND TonyPi simultaneously:

**On PC:**
```bash
python simulator.py
```

**On TonyPi:**
```bash
python3 tonypi_client.py --broker YOUR_PC_IP
```

**Result:**
- Frontend shows 2 robots
- Robots tab displays both
- Each tracks separately
- Both stored in PostgreSQL

---

## 🐛 Troubleshooting

### Robot Won't Connect

**Check MQTT Broker:**
```bash
docker compose logs mosquitto --tail 20
```

**Check Network:**
```bash
# From TonyPi, test connection
ping YOUR_PC_IP

# Test MQTT port
telnet YOUR_PC_IP 1883
```

**Check Firewall:**
```bash
# Windows Firewall might block port 1883
# Add inbound rule for port 1883 TCP
```

### Frontend Not Updating

**Check Backend:**
```bash
docker compose logs backend --tail 30
# Should see: "MQTT: Received message on tonypi/status/..."
```

**Check MQTT Messages:**
```bash
# Subscribe to MQTT topics to see messages
docker exec -it tonypi_mosquitto mosquitto_sub -t "tonypi/#" -v
```

**Refresh Frontend:**
- Hard refresh: Ctrl+Shift+R
- Check browser console for errors (F12)

### PostgreSQL Not Storing Data

**Check Backend Logs:**
```bash
docker compose logs backend | findstr "ERROR"
```

**Check Database Connection:**
```bash
curl http://localhost:8000/api/health
# Should show postgres: healthy
```

**Verify Tables:**
```bash
docker exec tonypi_postgres psql -U postgres -d tonypi_db -c "\dt"
```

---

## 📸 Expected Screenshots

### 1. Overview Tab - Connected Robot
- Green "Connected" status
- Robot ID displayed
- System Status card filled
- Real-time current time updating

### 2. Performance Tab - Live Metrics
- CPU line chart showing percentage
- Memory line chart showing usage
- Temperature gauge (color changes with temp)
- Disk usage bar
- All updating every 5 seconds

### 3. Robots Tab - Robot Card
- Green online indicator
- Robot name/ID
- Battery level (if available)
- Last seen: "a few seconds ago"
- Location info
- Detail and Settings buttons

### 4. Jobs Tab - Active Job
- Job card with progress bar
- Start time displayed
- Items: "5/10" (example)
- Progress: "50%"
- Status: "Active"

---

## 🎯 Success Indicators

✅ Robot shows "Connected" in Overview
✅ Real-time charts updating in Performance tab
✅ Robot appears in Robots tab
✅ Database stats show 1 online robot
✅ Job tracking creates records in PostgreSQL
✅ InfluxDB storing time-series data
✅ System logs recording events

---

## 🚀 Next Steps After Connection

1. **Monitor Performance**: Watch the Task Manager-style Performance tab
2. **Track Jobs**: Use QR scan triggers to test job tracking
3. **View History**: Check Jobs tab for completed jobs
4. **Explore API**: Try the API endpoints to query data
5. **Setup Grafana**: Create dashboards for advanced visualization
6. **Add More Robots**: Connect multiple TonyPi robots

---

## 📞 Quick Reference

| Item | Value |
|------|-------|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Grafana | http://localhost:3000 |
| Your PC IP | Run `ipconfig` to find |
| TonyPi IP | 192.168.1.103 (your setup) |
| MQTT Port | 1883 |
| Robot ID Format | tonypi_{hostname} |

---

## 🎉 You're Ready!

Your monitoring system is now fully operational with PostgreSQL persistence. Every robot that connects will:
1. Auto-register in PostgreSQL
2. Stream real-time data to InfluxDB
3. Display in Frontend
4. Track jobs persistently
5. Log all system events

**Start with the simulator first** to see it working, then connect your real TonyPi!
