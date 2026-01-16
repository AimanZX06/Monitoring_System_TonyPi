# 🚀 Complete System Startup Guide

This guide shows you how to run the **entire monitoring system** and **robot** together.

---

## 📋 Prerequisites

### On Monitoring Server (Your Computer)
- ✅ Docker Desktop installed
- ✅ Docker Compose v2.0+
- ✅ Ports available: 1883, 3000, 3001, 5432, 8000, 8086, 9001
- ✅ 8GB+ RAM recommended

### On TonyPi Robot (Raspberry Pi)
- ✅ Python 3.8+
- ✅ All dependencies installed (see `tonyPi/FYP_Robot/install_piper.sh`)
- ✅ Network connectivity to monitoring server
- ✅ Camera connected and working

---

## 🔧 Environment Variables Setup

### Create a `.env` File

Create a `.env` file in the project root with the following variables:

```env
# ============================================
# Database Configuration
# ============================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=tonypi_db

# ============================================
# InfluxDB Configuration
# ============================================
INFLUXDB_TOKEN=my-super-secret-auth-token
INFLUXDB_ORG=tonypi
INFLUXDB_BUCKET=robot_data

# ============================================
# MQTT Broker Configuration
# ============================================
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883
MQTT_USERNAME=tonypi
MQTT_PASSWORD=tonypi123

# ============================================
# Grafana Configuration
# ============================================
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin
GRAFANA_BASE_URL=http://grafana:3000
GRAFANA_API_KEY=

# ============================================
# AI Analytics - Gemini API (FREE TIER)
# ============================================
# Get your FREE API key from: https://aistudio.google.com/app/apikey
# 
# Free tier limits (very generous):
# - 15 requests per minute
# - 1 million tokens per minute  
# - 1,500 requests per day
#
GEMINI_API_KEY=your-gemini-api-key-here
```

### Getting a Free Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Add it to your `.env` file as `GEMINI_API_KEY=your-key`

### Where to Put the .env File

```
Monitoring_System_TonyPi/
├── .env                    <-- Put it here
├── docker-compose.yml
├── backend/
├── frontend/
└── ...
```

The `docker-compose.yml` reads from `.env` automatically.

---

## 🎯 Step-by-Step Startup

### **STEP 1: Start the Monitoring System** (On Your Computer)

#### 1.1 Navigate to Project Directory
```bash
cd C:\Users\aiman\Projects\Monitoring_System_TonyPi
```

#### 1.2 Start All Services with Docker Compose
```bash
# Start all services (MQTT, InfluxDB, PostgreSQL, Grafana, Backend, Frontend)
docker-compose up -d

# Watch the logs to see services starting
docker-compose logs -f
```

**Expected Output:**
```
✅ tonypi_mosquitto    ... started
✅ tonypi_influxdb     ... started
✅ tonypi_postgres     ... started
✅ tonypi_grafana      ... started
✅ tonypi_backend      ... started
✅ tonypi_frontend     ... started
```

#### 1.3 Verify Services Are Running
```bash
# Check all services status
docker-compose ps

# Test backend health
curl http://localhost:8000/api/health
```

**All services should show as "healthy" or "running"**

---

### **STEP 2: Access the Frontend** (On Your Computer)

Open your web browser and navigate to:

```
http://localhost:3001
```

You should see:
- ✅ Dashboard page loading
- ✅ No robots connected yet (this is normal)
- ✅ All navigation tabs working

**Other URLs:**
- **Backend API Docs**: http://localhost:8000/docs
- **Grafana**: http://localhost:3000 (admin/admin)
- **InfluxDB**: http://localhost:8086

---

### **STEP 3: Configure Robot Connection** (On TonyPi Robot)

#### 3.1 SSH into Your TonyPi Robot
```bash
ssh pi@<tonypi-ip-address>
# Example: ssh pi@192.168.149.1
```

#### 3.2 Navigate to Robot Code
```bash
cd /path/to/tonyPi/FYP_Robot
# Or wherever you have the main.py file
```

#### 3.3 Set Environment Variables (Optional)
```bash
# Set MQTT broker IP (your monitoring server IP)
export MQTT_BROKER=192.168.149.100  # Replace with your server IP
export MQTT_PORT=1883
export ROBOT_ID=tonypi_fyp
export CAMERA_PORT=8080

# Or edit main.py directly to change defaults
```

**Find Your Monitoring Server IP:**
- Windows: `ipconfig` → Look for IPv4 Address
- Linux/Mac: `ifconfig` or `ip addr`

---

### **STEP 4: Start the Robot** (On TonyPi Robot)

#### 4.1 Run the Main Robot Script
```bash
python3 main.py
```

**Expected Output:**
```
==================================================
   TONYPI ROBOT: COMPLETE MONITORING SYSTEM
==================================================
   Robot ID: tonypi_fyp
   MQTT Broker: 192.168.149.100:1883
   Camera Stream Port: 8080
==================================================

📡 Connecting to monitoring system...
✅ MQTT Telemetry enabled

📷 Starting camera stream server...
📷 Camera stream server started on port 8080
   Stream URL: http://192.168.149.1:8080/?action=stream

🔧 Initializing hardware...
✅ Voice module initialized
✅ Vision module initialized
✅ Light sensor initialized

📷 Opening Hiwonder Camera...
✅ Camera opened successfully
✅ AI Vision thread started
✅ Telemetry worker started

==================================================
✅ SYSTEM READY - All monitoring active!
==================================================
📷 Camera Stream: http://192.168.149.1:8080/?action=stream
Press 'q' in the camera window to quit
==================================================
```

#### 4.2 Verify Robot is Connected
- ✅ You should see "Connected to MQTT broker" message
- ✅ Camera window should open showing live feed
- ✅ No errors in the terminal

---

### **STEP 5: Verify Everything is Working** (On Your Computer)

#### 5.1 Check Frontend Dashboard
Go to http://localhost:3001 and check:

1. **Dashboard Tab**:
   - ✅ Should show 1 robot online
   - ✅ Battery level displayed
   - ✅ Status shows "online"

2. **Robots Tab**:
   - ✅ Your robot appears in the list
   - ✅ Camera feed should auto-load
   - ✅ Terminal output showing activity

3. **Sensors Tab**:
   - ✅ Sensor data appearing (IMU, light, etc.)
   - ✅ Charts updating in real-time

4. **Servos Tab**:
   - ✅ Servo data showing (position, temperature, voltage)
   - ✅ All 6 servos displayed

5. **Monitoring Tab** (Task Manager):
   - ✅ CPU, Memory, Disk usage
   - ✅ CPU Temperature
   - ✅ System Uptime

6. **Logs Tab**:
   - ✅ Robot logs appearing
   - ✅ Real-time log streaming

---

## 🔄 Complete Startup Sequence

Here's the **complete order** to start everything:

```bash
# ============================================
# ON MONITORING SERVER (Your Computer)
# ============================================

# 1. Start all monitoring services
cd C:\Users\aiman\Projects\Monitoring_System_TonyPi
docker-compose up -d

# 2. Wait for all services to be healthy (30-60 seconds)
docker-compose ps

# 3. Open frontend in browser
# http://localhost:3001

# ============================================
# ON TONYPI ROBOT (Raspberry Pi)
# ============================================

# 4. SSH into robot
ssh pi@<robot-ip>

# 5. Navigate to code
cd /path/to/tonyPi/FYP_Robot

# 6. Set MQTT broker IP (if needed)
export MQTT_BROKER=192.168.149.100

# 7. Start robot
python3 main.py

# ============================================
# VERIFY CONNECTION
# ============================================

# 8. Check frontend - robot should appear
# 9. Check camera feed - should auto-load
# 10. Check sensors - data should be streaming
```

---

## 🛠️ Troubleshooting

### ❌ Robot Not Appearing in Frontend

**Check:**
1. MQTT broker is running: `docker-compose ps mosquitto`
2. Robot can reach MQTT broker: `ping 192.168.149.100`
3. Firewall allows port 1883
4. MQTT broker IP is correct in robot code

**Test MQTT Connection:**
```bash
# On robot, test MQTT connection
mosquitto_pub -h 192.168.149.100 -p 1883 -t "test/topic" -m "test"
```

### ❌ Camera Feed Not Loading

**Check:**
1. Camera is connected: `ls /dev/video*`
2. Camera server started: Look for "Camera stream server started" in robot logs
3. Port 8080 is accessible from monitoring server
4. Camera URL is correct in frontend

**Test Camera Stream:**
```bash
# On monitoring server, test camera URL
curl http://<robot-ip>:8080/?action=snapshot
```

### ❌ No Sensor Data

**Check:**
1. Telemetry worker started: Look for "Telemetry worker started" in robot logs
2. Sensors are being read: Check robot terminal for sensor errors
3. MQTT messages are being sent: Check backend logs

**View Backend Logs:**
```bash
docker-compose logs backend -f
```

### ❌ Services Not Starting

**Check:**
1. Docker is running: `docker ps`
2. Ports are available: `netstat -an | grep :8000`
3. Docker Compose version: `docker-compose --version`

**Restart Services:**
```bash
docker-compose down
docker-compose up -d
```

---

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              MONITORING SERVER (Your PC)                │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Frontend │  │ Backend  │  │ Grafana  │             │
│  │ :3001    │  │ :8000    │  │ :3000    │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │             │                    │
│       └─────────────┼─────────────┘                    │
│                     │                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  MQTT    │  │ InfluxDB │  │PostgreSQL│            │
│  │ :1883    │  │ :8086    │  │ :5432    │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │                   │
└───────┼─────────────┼─────────────┼───────────────────┘
        │             │             │
        │  MQTT       │  Data       │  Metadata
        │  Messages   │  Storage    │  Storage
        │             │             │
┌───────┴─────────────┴─────────────┴───────────────────┐
│              TONYPI ROBOT (Raspberry Pi)              │
│                                                         │
│  ┌──────────────────────────────────────────┐         │
│  │         main.py (Robot Controller)       │         │
│  │  • MQTT Client (sends data)              │         │
│  │  • Camera Stream Server (:8080)          │         │
│  │  • Telemetry Worker                      │         │
│  │  • Vision AI                             │         │
│  └──────────────────────────────────────────┘         │
│                                                         │
│  Hardware: Camera, Servos, Sensors, IMU               │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Quick Verification Checklist

After starting everything, verify:

- [ ] All Docker services are running (`docker-compose ps`)
- [ ] Frontend loads at http://localhost:3001
- [ ] Robot connects to MQTT (see "Connected to MQTT broker" in robot logs)
- [ ] Robot appears in frontend Dashboard
- [ ] Camera feed loads in Robots tab
- [ ] Sensor data appears in Sensors tab
- [ ] Servo data appears in Servos tab
- [ ] System metrics appear in Monitoring tab
- [ ] Logs appear in Logs tab

---

## 🎉 You're All Set!

Once everything is running:

1. **Monitor robots** in real-time via the frontend
2. **View sensor data** with live charts
3. **Control robots** via the Robots page
4. **View camera feeds** automatically
5. **Check system health** in Monitoring tab
6. **Review logs** in Logs tab

**The system will automatically:**
- ✅ Collect all telemetry data
- ✅ Store data in databases
- ✅ Update frontend in real-time
- ✅ Stream camera feeds
- ✅ Track robot status

---

## 🛑 Stopping the System

### Stop Robot
```bash
# On robot terminal, press Ctrl+C
# Or close the terminal
```

### Stop Monitoring System
```bash
# On monitoring server
docker-compose down

# Or stop specific service
docker-compose stop backend
```

---

## 📝 Notes

- **First startup** may take 1-2 minutes for all services to initialize
- **Robot must be on same network** as monitoring server
- **Camera stream** requires robot IP to be accessible from monitoring server
- **MQTT broker** must be accessible from robot (check firewall)

---

**Need Help?** Check the troubleshooting section or view service logs:
```bash
docker-compose logs [service-name] -f
```
