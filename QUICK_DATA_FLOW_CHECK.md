# Quick Data Flow Check

## 🚀 Fastest Way to Check Data Flow

### **Option 1: Automated Script (Recommended)**

```cmd
verify_servo_data_flow.bat
```

Or:
```cmd
python verify_servo_data_flow.py
```

This will check all steps automatically and show you exactly where the data flow breaks.

---

### **Option 2: Quick Manual Checks**

#### **1. Check Robot is Sending (30 seconds)**
```cmd
docker-compose logs backend --tail=20 | findstr /i "servos"
```
**Look for:** `MQTT: Received message on tonypi/servos/...`

#### **2. Check Database Has Data (30 seconds)**
```cmd
curl http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi
```
**Look for:** `"servos": {...}` with data

#### **3. Check Frontend (30 seconds)**
- Open: http://localhost:3000/servos
- Select robot
- **Look for:** Servo cards with data

---

## 📊 Data Flow Status Indicators

### ✅ **Everything Working:**
- Backend logs: `MQTT: Stored servo data for X servos`
- API: Returns `servos` object with data
- Frontend: Shows servo cards with values

### ⚠️ **Partial Working:**
- Backend logs: `MQTT: Received message on tonypi/sensors/...` (servo_angle only)
- API: Returns empty `servos: {}`
- Frontend: Shows "No servo data"

**Fix:** Robot needs to send on `tonypi/servos/` topic, not just `tonypi/sensors/`

### ❌ **Not Working:**
- Backend logs: No servo messages
- API: Returns empty
- Frontend: Shows "No servo data"

**Fix:** Check robot client is running and has `send_servo_status()` function

---

## 🔍 Common Issues

### **Issue: Robot sending servo_angle but not full servo data**

**Symptom:**
- Backend logs show: `tonypi/sensors/tonypi_raspberrypi` with `servo_angle`
- But NOT: `tonypi/servos/tonypi_raspberrypi`

**Solution:**
```bash
# On Raspberry Pi
grep -n "send_servo_status" /home/pi/robot_client/tonypi_client.py
# If not found, copy updated code:
# On Windows:
copy_robot_client.bat YOUR_PI_IP
```

---

## 📋 One-Minute Checklist

- [ ] Robot client running? (`ps aux | grep tonypi_client.py`)
- [ ] Backend receiving messages? (`docker-compose logs backend | findstr servos`)
- [ ] Database has data? (`curl http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi`)
- [ ] Frontend showing data? (Open browser, check Servos page)

---

**For detailed verification, see:** `VERIFY_SERVO_DATA_FLOW.md`












