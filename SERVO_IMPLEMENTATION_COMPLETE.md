 # Servo Data Retrieval Implementation - Complete

This document describes the complete implementation of servo data retrieval using the actual HiwonderSDK methods.

---

## ✅ What Was Implemented

### **1. Robot Client (`robot_client/tonypi_client.py`)**

**Added:**
- ✅ HiwonderSDK import: `import hiwonder.ros_robot_controller_sdk as rrc`
- ✅ Board initialization: `self.board = rrc.Board()`
- ✅ Servo ID mapping (6 servos by default)
- ✅ Comprehensive servo data retrieval using actual SDK methods:
  - `bus_servo_read_position(id)` - Position
  - `bus_servo_read_temp(id)` - Temperature
  - `bus_servo_read_vin(id)` - Voltage
  - `bus_servo_read_torque_state(id)` - Torque state
  - `bus_servo_read_angle_limit(id)` - Angle limits
  - `bus_servo_read_offset(id)` - Offset
  - `bus_servo_read_id(id)` - Servo ID verification
- ✅ Alert detection (warning/critical based on temperature)
- ✅ MQTT publishing: `tonypi/servos/{robot_id}`
- ✅ Auto-send every 5 seconds

**Key Features:**
- Automatic fallback to simulated data if SDK not available
- Error handling for each servo read operation
- Temperature threshold monitoring
- Alert generation for critical conditions

---

### **2. Backend MQTT Handler (`backend/mqtt/mqtt_client.py`)**

**Added:**
- ✅ Subscription to `tonypi/servos/+` topic
- ✅ Subscription to `tonypi/alerts/+` topic
- ✅ `handle_servo_data()` method:
  - Stores each servo's data in InfluxDB
  - Tags: robot_id, servo_id, servo_name, alert_level
  - Fields: position, temperature, voltage, torque_enabled, offset, angle_min, angle_max
- ✅ `handle_alert_data()` method:
  - Stores alerts in InfluxDB
  - Logs to PostgreSQL system_logs table

**Data Storage:**
- **InfluxDB Measurement:** `servos`
- **Tags:** robot_id, servo_id, servo_name, alert_level
- **Fields:** position, temperature, voltage, torque_enabled, offset, angle_min, angle_max

---

### **3. Backend API (`backend/routers/robot_data.py`)**

**Added:**
- ✅ `GET /api/robot-data/servos/{robot_id}` endpoint
- ✅ Returns latest servo data for all servos
- ✅ Groups data by servo name
- ✅ Returns latest values for each field
- ✅ Includes servo count and timestamp

**Response Format:**
```json
{
  "robot_id": "tonypi_raspberrypi",
  "servos": {
    "servo_1_left_front": {
      "id": 1,
      "name": "servo_1_left_front",
      "position": 45.0,
      "temperature": 52.3,
      "voltage": 5.0,
      "torque_enabled": true,
      "alert_level": "normal"
    },
    ...
  },
  "servo_count": 6,
  "timestamp": "2025-12-05T10:30:00Z"
}
```

---

### **4. Frontend API Service (`frontend/src/utils/api.ts`)**

**Added:**
- ✅ `getServoData(robotId, timeRange)` method
- ✅ Calls `/api/robot-data/servos/{robotId}` endpoint

---

### **5. Frontend Types (`frontend/src/types/index.ts`)**

**Added:**
- ✅ `ServoData` interface
- ✅ `ServoStatusResponse` interface

---

### **6. Frontend Servos Page (`frontend/src/pages/Servos.tsx`)**

**Created new page with:**
- ✅ Robot selector dropdown
- ✅ Servo grid display (cards for each servo)
- ✅ Real-time updates (every 5 seconds)
- ✅ Visual indicators:
  - Temperature with color-coded progress bars
  - Position with visual gauge
  - Voltage display
  - Torque state
  - Alert icons (normal/warning/critical)
- ✅ Alert banner for warnings/critical
- ✅ Summary statistics:
  - Total servos
  - Normal/Warning/Critical counts
- ✅ Auto-refresh every 5 seconds

**Features:**
- Color-coded borders (green/yellow/red) based on alert level
- Temperature thresholds visualization
- Position visualization
- Multi-robot support (can switch between robots)

---

### **7. Navigation (`frontend/src/TonyPiApp.tsx`)**

**Added:**
- ✅ "Servos" tab to navigation
- ✅ Servos page routing

---

## 📊 Data Flow

```
Raspberry Pi (TonyPi Robot)
    │
    │ Uses: hiwonder.ros_robot_controller_sdk
    │ Methods: bus_servo_read_*()
    │
    ▼
robot_client/tonypi_client.py
    │
    │ get_servo_status()
    │ - Reads all servos using SDK methods
    │ - Collects: position, temp, voltage, torque, etc.
    │
    ▼
send_servo_status()
    │
    │ Publishes to: tonypi/servos/{robot_id}
    │ Every: 5 seconds
    │
    ▼
MQTT Broker (Mosquitto)
    │
    │ Routes message
    │
    ▼
Backend MQTT Handler
    │
    │ handle_servo_data()
    │ - Parses servo data
    │ - Stores in InfluxDB (servos measurement)
    │ - Stores alerts in InfluxDB (robot_alerts)
    │
    ▼
InfluxDB
    │
    │ Measurement: servos
    │ Tags: robot_id, servo_id, servo_name, alert_level
    │ Fields: position, temperature, voltage, etc.
    │
    ▼
Backend API
    │
    │ GET /api/robot-data/servos/{robot_id}
    │ - Queries InfluxDB
    │ - Groups by servo
    │ - Returns latest values
    │
    ▼
Frontend (Servos Page)
    │
    │ Displays:
    │ - Servo cards with all data
    │ - Alert indicators
    │ - Real-time updates
    │
    ▼
User Browser
```

---

## 🎯 Servo Data Retrieved

Based on the actual SDK methods available:

| Data Type | SDK Method | Status |
|-----------|------------|--------|
| **Position** | `bus_servo_read_position(id)` | ✅ Implemented |
| **Temperature** | `bus_servo_read_temp(id)` | ✅ Implemented |
| **Voltage** | `bus_servo_read_vin(id)` | ✅ Implemented |
| **Torque State** | `bus_servo_read_torque_state(id)` | ✅ Implemented |
| **Angle Limits** | `bus_servo_read_angle_limit(id)` | ✅ Implemented |
| **Offset** | `bus_servo_read_offset(id)` | ✅ Implemented |
| **Servo ID** | `bus_servo_read_id(id)` | ✅ Implemented |

---

## 🚀 How to Use

### **Step 1: Update Robot Client on Raspberry Pi**

**Copy updated `tonypi_client.py` to robot:**
```bash
scp robot_client/tonypi_client.py pi@robot-ip:/home/pi/robot_client/
```

### **Step 2: Restart Robot Client**

**On Raspberry Pi:**
```bash
# Stop current client (Ctrl+C)
# Restart
python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
```

### **Step 3: Verify Servo Data**

**Check MQTT:**
```bash
docker exec -it tonypi_mosquitto mosquitto_sub -t "tonypi/servos/#" -v
```

**Check API:**
```bash
curl http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi
```

**Check Frontend:**
1. Open: http://localhost:3001
2. Click **"Servos"** tab
3. Should see servo cards with data

---

## ✅ Verification Checklist

- [ ] Robot client updated with servo code
- [ ] SDK import works: `import hiwonder.ros_robot_controller_sdk as rrc`
- [ ] Board initialized: `board = rrc.Board()`
- [ ] Servo data being read (check robot client logs)
- [ ] MQTT messages being sent (check with mosquitto_sub)
- [ ] Backend receiving messages (check backend logs)
- [ ] Data stored in InfluxDB (check API response)
- [ ] API endpoint returns servo data
- [ ] Frontend displays servo data
- [ ] Real-time updates working (every 5 seconds)
- [ ] Alerts working (if temperature exceeds thresholds)

---

## 🔧 Configuration

### **Servo IDs**

**Update in `tonypi_client.py` if your robot has different servo configuration:**

```python
self.servo_ids = {
    1: "servo_1_left_front",    # Adjust names
    2: "servo_2_left_rear",
    3: "servo_3_right_front",
    4: "servo_4_right_rear",
    5: "servo_5_head_pan",
    6: "servo_6_head_tilt"
}
```

### **Temperature Thresholds**

**Adjust in `tonypi_client.py`:**

```python
self.servo_temp_warning = 65.0   # °C - Warning threshold
self.servo_temp_critical = 75.0  # °C - Critical threshold
```

### **Update Frequency**

**Change in `tonypi_client.py` run() method:**

```python
# Send servo status every 5 seconds (change to desired interval)
if current_time - last_servo_time >= 5:
    self.send_servo_status()
    last_servo_time = current_time
```

---

## 📋 Testing Steps

1. **Test SDK Import:**
   ```bash
   # On Raspberry Pi
   python3 -c "import hiwonder.ros_robot_controller_sdk as rrc; board = rrc.Board(); print('✅ SDK works')"
   ```

2. **Test Servo Reading:**
   ```bash
   # On Raspberry Pi
   python3 -c "
   import hiwonder.ros_robot_controller_sdk as rrc
   board = rrc.Board()
   temp = board.bus_servo_read_temp(1)
   pos = board.bus_servo_read_position(1)
   print(f'Servo 1 - Temp: {temp}°C, Position: {pos}°')
   "
   ```

3. **Test Full Client:**
   ```bash
   # On Raspberry Pi
   python3 tonypi_client.py --broker YOUR_PC_IP
   # Check logs for "Sent servo status" messages
   ```

4. **Test Backend:**
   ```bash
   # Check backend logs
   docker-compose logs backend | findstr /i "servo"
   ```

5. **Test API:**
   ```bash
   curl http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi
   ```

6. **Test Frontend:**
   - Open: http://localhost:3001
   - Click "Servos" tab
   - Verify servo cards appear with data

---

## 🎉 Summary

**Complete servo monitoring is now implemented:**

✅ **Robot Client:**
- Reads servo data using actual SDK methods
- Sends data via MQTT every 5 seconds
- Detects alerts based on temperature

✅ **Backend:**
- Receives servo data via MQTT
- Stores in InfluxDB
- Provides API endpoint

✅ **Frontend:**
- New "Servos" tab
- Real-time servo monitoring
- Visual indicators and alerts
- Multi-robot support

**All using the actual SDK methods you showed me!**

---

**Last Updated:** December 2025


