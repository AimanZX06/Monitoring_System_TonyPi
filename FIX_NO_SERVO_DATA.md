# Fix: No Servo Data Available

## 🔍 Problem Identified

The diagnostic shows:
- ✅ Robot is connected (`tonypi_raspberrypi` is online)
- ✅ API is working
- ❌ **No servo data in InfluxDB**

**This means the robot client is not sending servo data via MQTT.**

---

## ✅ Solution Steps

### **Step 1: Verify Robot Client Has Updated Code**

**On Raspberry Pi, check if servo code exists:**
```bash
ssh pi@YOUR_PI_IP
grep -n "get_servo_status" /home/pi/robot_client/tonypi_client.py
```

**If not found, copy the updated file:**
```cmd
# On Windows
cd C:\Users\aiman\Projects\Monitoring_System_TonyPi
copy_robot_client.bat YOUR_PI_IP
```

---

### **Step 2: Restart Robot Client**

**On Raspberry Pi:**
```bash
# Stop current client (Ctrl+C if running in terminal)
# Or kill it:
pkill -f tonypi_client.py

# Start with updated code:
cd /home/pi/robot_client
python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
```

**Look for these log messages:**
```
Board initialized successfully for servo control
Sent servo status: 6 servos
```

---

### **Step 3: Check SDK is Working**

**On Raspberry Pi, test SDK:**
```bash
python3 -c "
import hiwonder.ros_robot_controller_sdk as rrc
try:
    board = rrc.Board()
    temp = board.bus_servo_read_temp(1)
    print(f'Servo 1 Temp: {temp}')
    print('[OK] SDK working')
except Exception as e:
    print(f'[ERROR] SDK error: {e}')
"
```

**If SDK fails:**
- Install SDK: `pip3 install hiwonder`
- Check permissions: `sudo usermod -a -G dialout $USER` (then logout/login)
- Check UART is enabled: `sudo raspi-config` → Interface Options → Serial Port

---

### **Step 4: Verify Servo Data is Being Sent**

**Check robot client logs for:**
```
Sent servo status: 6 servos
```

**If you see "Using simulated servo data (SDK not available)":**
- SDK is not working (see Step 3)

**If you see errors:**
- Check the error message and fix accordingly

---

### **Step 5: Check Backend is Receiving**

**On Windows, check backend logs:**
```cmd
docker-compose logs backend --tail=50 | findstr /i "servo"
```

**Should see:**
```
MQTT: Received message on tonypi/servos/tonypi_raspberrypi: {...}
MQTT: Stored servo data for 6 servos from tonypi_raspberrypi
```

**If not seeing messages:**
- Check MQTT broker is running: `docker-compose ps mosquitto`
- Check robot client can connect to MQTT broker
- Check network connectivity

---

### **Step 6: Test Again**

**Run diagnostic:**
```cmd
python test_servo_api.py
```

**Should now show:**
```
[OK] Found X servo data points in InfluxDB
[OK] Found 6 servos
```

---

## 🐛 Common Issues

### **Issue: "SDK not available" in robot logs**

**Fix:**
```bash
# On Raspberry Pi
pip3 install hiwonder
# Or install from source if needed
```

---

### **Issue: "Failed to initialize Board"**

**Fix:**
```bash
# Check permissions
sudo usermod -a -G dialout $USER
# Logout and login again

# Check UART
sudo raspi-config
# Interface Options > Serial Port > Enable
```

---

### **Issue: Robot client not sending servo data**

**Check:**
1. Updated code is on Pi (Step 1)
2. Robot client is restarted (Step 2)
3. SDK is working (Step 3)
4. No errors in robot client logs

---

## ✅ Quick Checklist

- [ ] Updated `tonypi_client.py` is on Raspberry Pi
- [ ] Robot client is running with updated code
- [ ] SDK is installed and working
- [ ] Robot client logs show "Sent servo status"
- [ ] Backend logs show "MQTT: Received message on tonypi/servos/..."
- [ ] Diagnostic script shows servo data in InfluxDB
- [ ] Frontend Servos page shows servo cards

---

## 🚀 Quick Fix Command

**On Raspberry Pi (one command to check everything):**
```bash
cd /home/pi/robot_client && \
python3 -c "import hiwonder.ros_robot_controller_sdk as rrc; board = rrc.Board(); print('[OK] SDK works')" && \
grep -q "get_servo_status" tonypi_client.py && echo "[OK] Updated code present" || echo "[ERROR] Need to copy updated code"
```

---

**After fixing, the Servos page should show servo data!**



