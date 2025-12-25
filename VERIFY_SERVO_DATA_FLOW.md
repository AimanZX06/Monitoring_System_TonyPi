# Servo Data Flow Verification Guide

This guide helps you verify that servo data is flowing correctly from the robot through MQTT, database, API, and to the frontend.

---

## 📊 Data Flow Overview

```
Robot Client
    │
    ├─→ tonypi/sensors/{robot_id} (servo_angle as sensor)
    │       │
    │       └─→ handle_sensor_data()
    │               │
    │               └─→ InfluxDB: "sensors" measurement
    │
    └─→ tonypi/servos/{robot_id} (full servo data)
            │
            └─→ handle_servo_data()
                    │
                    └─→ InfluxDB: "servos" measurement
                            │
                            └─→ API: GET /api/robot-data/servos/{robot_id}
                                    │
                                    └─→ Frontend: Servos.tsx
```

---

## 🔍 Quick Verification Script

**Run the automated verification:**

```cmd
python verify_servo_data_flow.py
```

This script checks:
1. ✅ API health
2. ✅ MQTT message routing (manual check instructions)
3. ✅ Sensor data in database (servo_angle)
4. ✅ Servo data in database (full servo data)
5. ✅ API endpoint response
6. ✅ Frontend data flow simulation

---

## 📋 Manual Verification Steps

### **Step 1: Check Robot is Sending Data**

**On Raspberry Pi:**
```bash
ssh pi@YOUR_PI_IP
# Check if robot client is running
ps aux | grep tonypi_client.py

# Check robot client logs
# Should see every 5 seconds:
# "Sent servo status: 6 servos to tonypi/servos/tonypi_raspberrypi"
```

**If not running:**
```bash
cd /home/pi/robot_client
python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
```

---

### **Step 2: Check MQTT Messages**

**Check MQTT broker for servo messages:**

```cmd
# Check servos topic (full servo data)
docker exec tonypi_mosquitto mosquitto_sub -t "tonypi/servos/#" -C 5 -W 10

# Check sensors topic (servo_angle)
docker exec tonypi_mosquitto mosquitto_sub -t "tonypi/sensors/#" -C 5 -W 10
```

**Expected output for servos topic:**
```json
{
  "robot_id": "tonypi_raspberrypi",
  "timestamp": "2025-12-22T02:18:00.000000",
  "servos": {
    "head_servo": {
      "id": 1,
      "position": 45.0,
      "temperature": 55.2,
      "voltage": 5.1,
      ...
    },
    ...
  }
}
```

**Expected output for sensors topic:**
```json
{
  "robot_id": "tonypi_raspberrypi",
  "sensor_type": "servo_angle",
  "value": -6.83,
  "timestamp": "2025-12-22T02:17:58.227644",
  "unit": "°"
}
```

---

### **Step 3: Check Backend is Receiving Messages**

**Check backend logs:**
```cmd
docker-compose logs backend --tail=50 | findstr /i "servos"
```

**Should see:**
```
MQTT: Received message on tonypi/servos/tonypi_raspberrypi: {...}
MQTT: Stored servo data for 6 servos from tonypi_raspberrypi
```

**If you see sensor data but NOT servo data:**
- Robot client is sending `servo_angle` as sensor data
- But NOT sending full servo data on `tonypi/servos/` topic
- **Solution:** Update robot client code to include `send_servo_status()`

---

### **Step 4: Check Database Storage**

#### **Check InfluxDB via API:**

**Check servo data (full servo data):**
```cmd
curl "http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi"
```

**Check sensor data (servo_angle):**
```cmd
curl "http://localhost:8000/api/robot-data/sensors?measurement=sensors&time_range=10m&robot_id=tonypi_raspberrypi"
```

#### **Check InfluxDB via Web UI:**

1. Open: http://localhost:8086
2. Login with token from `.env` file
3. Go to **Data Explorer**
4. Select bucket: `robot_data`
5. Check measurements:
   - `servos` - Should have servo data with tags: robot_id, servo_id, servo_name
   - `sensors` - Should have servo_angle data with tag: sensor_type=servo_angle

---

### **Step 5: Check API Endpoint**

**Test the servo API endpoint:**
```cmd
curl "http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi"
```

**Expected response:**
```json
{
  "robot_id": "tonypi_raspberrypi",
  "servos": {
    "head_servo": {
      "id": 1,
      "name": "head_servo",
      "robot_id": "tonypi_raspberrypi",
      "position": 45.0,
      "temperature": 55.2,
      "voltage": 5.1,
      "torque_enabled": 1,
      ...
    },
    ...
  },
  "servo_count": 6,
  "timestamp": "2025-12-22T02:20:00.000000"
}
```

**If empty:**
```json
{
  "robot_id": "tonypi_raspberrypi",
  "servos": {},
  "message": "No servo data found"
}
```

---

### **Step 6: Check Frontend**

**Open browser:**
1. Navigate to: http://localhost:3000 (or your frontend URL)
2. Go to **Servos** page
3. Select robot: `tonypi_raspberrypi`

**Expected:**
- ✅ Servo cards displayed with data
- ✅ Position, temperature, voltage shown
- ✅ Real-time updates every 5 seconds

**If empty:**
- ❌ "No servo data" message
- ❌ Empty servo cards

**Check browser console (F12):**
```javascript
// Should see logs like:
Servo data received: {robot_id: "tonypi_raspberrypi", servos: {...}}
```

**Check Network tab:**
- Request: `GET /api/robot-data/servos/tonypi_raspberrypi`
- Status: `200 OK`
- Response: Should contain servo data

---

## 🐛 Troubleshooting

### **Problem: No MQTT Messages**

**Symptoms:**
- No messages on `tonypi/servos/` topic
- Backend logs show no servo data

**Solutions:**
1. Check robot client is running
2. Check robot client has `send_servo_status()` function
3. Check MQTT broker is accessible from robot
4. Check robot client logs for errors

---

### **Problem: MQTT Messages but No Database Data**

**Symptoms:**
- MQTT messages visible
- Backend logs show "Received message"
- But no data in InfluxDB

**Solutions:**
1. Check InfluxDB connection:
   ```cmd
   docker-compose logs backend | findstr /i "influxdb"
   ```
2. Check InfluxDB credentials in `.env`
3. Check backend logs for InfluxDB write errors

---

### **Problem: Database Data but API Returns Empty**

**Symptoms:**
- Data in InfluxDB (via web UI)
- But API returns empty servos

**Solutions:**
1. Check API query logic in `backend/routers/robot_data.py`
2. Check time_range parameter (default is 5m)
3. Check robot_id matches exactly
4. Check API logs for errors

---

### **Problem: API Returns Data but Frontend Shows Empty**

**Symptoms:**
- API returns servo data
- But frontend shows "No servo data"

**Solutions:**
1. Check frontend API call in `frontend/src/utils/api.ts`
2. Check frontend data parsing in `frontend/src/pages/Servos.tsx`
3. Check browser console for errors
4. Check CORS settings
5. Check API response format matches frontend expectations

---

## 📊 Data Flow Checklist

Use this checklist to verify each step:

- [ ] **Robot Client Running**
  - [ ] Process is running on Raspberry Pi
  - [ ] Logs show "Sent servo status" messages
  - [ ] No errors in robot client logs

- [ ] **MQTT Messages**
  - [ ] Messages on `tonypi/servos/{robot_id}` topic
  - [ ] Messages contain servo data structure
  - [ ] Messages published every 5 seconds

- [ ] **Backend Receiving**
  - [ ] Backend logs show "Received message on tonypi/servos/..."
  - [ ] Backend logs show "Stored servo data for X servos"
  - [ ] No errors in backend logs

- [ ] **Database Storage**
  - [ ] Data in InfluxDB `servos` measurement
  - [ ] Data has correct tags (robot_id, servo_id, servo_name)
  - [ ] Data has fields (position, temperature, voltage, etc.)

- [ ] **API Endpoint**
  - [ ] `GET /api/robot-data/servos/{robot_id}` returns data
  - [ ] Response contains servos object
  - [ ] Response has correct structure

- [ ] **Frontend Display**
  - [ ] Servos page shows servo cards
  - [ ] Data updates every 5 seconds
  - [ ] No errors in browser console

---

## 🎯 Expected Data Flow Timeline

**Every 5 seconds:**

1. **T+0s:** Robot client calls `send_servo_status()`
2. **T+0.1s:** MQTT message published to `tonypi/servos/{robot_id}`
3. **T+0.2s:** Backend receives message via `on_message()`
4. **T+0.3s:** Backend calls `handle_servo_data()`
5. **T+0.4s:** Data written to InfluxDB
6. **T+0.5s:** Frontend polls API (every 5 seconds)
7. **T+0.6s:** API queries InfluxDB
8. **T+0.7s:** API returns data to frontend
9. **T+0.8s:** Frontend updates UI

**Total latency: < 1 second**

---

## 📝 Notes

### **Two Data Paths:**

1. **Sensor Data Path:**
   - Topic: `tonypi/sensors/{robot_id}`
   - Measurement: `sensors`
   - Tag: `sensor_type: servo_angle`
   - Used for: Simple angle tracking

2. **Servo Data Path:**
   - Topic: `tonypi/servos/{robot_id}`
   - Measurement: `servos`
   - Tags: `robot_id`, `servo_id`, `servo_name`, `alert_level`
   - Fields: `position`, `temperature`, `voltage`, `torque_enabled`, etc.
   - Used for: Full servo monitoring (frontend uses this)

**Frontend uses the Servo Data Path (`tonypi/servos/` topic)**

---

## 🔧 Quick Fixes

### **If robot is sending servo_angle but not full servo data:**

1. **Update robot client:**
   ```bash
   # On Windows
   copy_robot_client.bat YOUR_PI_IP
   
   # On Raspberry Pi
   pkill -f tonypi_client.py
   cd /home/pi/robot_client
   python3 tonypi_client.py --broker YOUR_PC_IP
   ```

2. **Verify robot client has:**
   - `get_servo_status()` function
   - `send_servo_status()` function
   - Calls `send_servo_status()` in main loop

---

## 📞 Support

If data flow is still not working:

1. Run verification script: `python verify_servo_data_flow.py`
2. Check all logs (robot, backend, frontend)
3. Verify MQTT broker is accessible
4. Verify InfluxDB credentials
5. Check network connectivity

---

**Last Updated:** December 2025




