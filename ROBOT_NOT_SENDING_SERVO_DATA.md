# Robot Not Sending Servo Data - Diagnosis

## 🔍 Current Status

**Backend logs show:**
- ✅ Subscribed to `tonypi/servos/+`
- ✅ Receiving status messages: `tonypi/status/tonypi_raspberrypi`
- ✅ Robot client IS running and connected
- ❌ **NO messages on `tonypi/servos/` topic**
- ❌ **NO "MQTT: Received message on tonypi/servos/..." logs**

**This means:**
- Robot client is running ✅
- Robot client is connected to MQTT ✅
- Robot client is sending status updates ✅
- **But robot client is NOT sending servo data** ❌

---

## 🐛 Possible Causes

### **1. `send_servo_status()` is Failing Silently**

**Check robot client logs for errors:**
```bash
# On Raspberry Pi
# If running in foreground, check terminal output
# If running in background, check log file
tail -f /tmp/robot_client.log
# Or
journalctl -u robot_client -f
```

**Look for:**
- `Error sending servo status: ...`
- `Error in get_servo_status: ...`
- Any exception messages

### **2. `get_servo_status()` Returns Empty Data**

**The function might be:**
- Returning empty dict `{}`
- Failing to read servo data
- SDK not available/working

**Check:**
```bash
# On Pi, test if SDK is available
python3 -c "import hiwonder.ros_robot_controller_sdk as rrc; print('SDK OK')"
```

### **3. Robot Client Not Calling `send_servo_status()`**

**Even though code shows it should be called every 5 seconds, check:**
- Is the main loop running?
- Is `last_servo_time` being updated?
- Is there an exception preventing the call?

---

## ✅ Solution Steps

### **Step 1: Check Robot Client Logs**

**SSH into Raspberry Pi:**
```bash
ssh pi@192.168.1.103
```

**Check if robot client is running:**
```bash
ps aux | grep tonypi_client.py
```

**If running, check logs:**
```bash
# Find the process and check its output
# Or if running with nohup, check log file
tail -f /tmp/robot_client.log
```

**Look for:**
- `Sent servo status: X servos to tonypi/servos/...`
- `Error sending servo status: ...`
- `Error in get_servo_status: ...`

### **Step 2: Test Servo Status Function Manually**

**On Raspberry Pi, test the function:**
```bash
cd /home/pi/robot_client
python3 -c "
from tonypi_client import TonyPiRobotClient
import time

client = TonyPiRobotClient(mqtt_broker='YOUR_PC_IP', mqtt_port=1883)
# Connect
import asyncio
asyncio.run(client.connect())

# Test get_servo_status
servo_data = client.get_servo_status()
print(f'Servo data: {servo_data}')
print(f'Number of servos: {len(servo_data)}')

# Test send_servo_status
client.send_servo_status()
print('Sent servo status')
"
```

**This will show:**
- If `get_servo_status()` works
- If `send_servo_status()` works
- What data is being sent

### **Step 3: Check Robot Client Code**

**Verify the function is being called:**
```bash
# On Pi
grep -A 5 "send_servo_status" /home/pi/robot_client/tonypi_client.py
```

**Should show:**
```python
# Send servo status every 5 seconds
if current_time - last_servo_time >= 5:
    self.send_servo_status()
    last_servo_time = current_time
```

### **Step 4: Add Debug Logging**

**If needed, add more logging to robot client:**

Edit `/home/pi/robot_client/tonypi_client.py`:

**In `send_servo_status()` function, add:**
```python
def send_servo_status(self):
    """Publish comprehensive servo status to MQTT"""
    logger.info("send_servo_status() called")  # ADD THIS
    if not self.is_connected:
        logger.warning("Not connected, skipping servo status")  # ADD THIS
        return
    
    try:
        logger.info("Getting servo status...")  # ADD THIS
        servo_status = self.get_servo_status()
        logger.info(f"Got {len(servo_status)} servos")  # ADD THIS
        
        # ... rest of function
```

**Then restart robot client and check logs.**

### **Step 5: Restart Robot Client**

**Kill existing process:**
```bash
pkill -f tonypi_client.py
```

**Start fresh:**
```bash
cd /home/pi/robot_client
python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
```

**Watch for:**
- Connection messages
- "Sent servo status" messages
- Error messages

---

## 🔍 Quick Diagnostic Commands

### **On Raspberry Pi:**

**1. Check if robot client is running:**
```bash
ps aux | grep tonypi_client.py
```

**2. Check robot client logs:**
```bash
# If running with nohup
tail -f /tmp/robot_client.log

# Or check systemd service logs
journalctl -u robot_client -f
```

**3. Test MQTT connection:**
```bash
# Test if can publish to MQTT
mosquitto_pub -h YOUR_PC_IP -p 1883 -t "tonypi/test" -m "test"
```

**4. Test servo SDK:**
```bash
python3 -c "import hiwonder.ros_robot_controller_sdk as rrc; b = rrc.Board(); print('SDK OK')"
```

### **On Windows (Backend):**

**1. Check MQTT messages:**
```cmd
docker exec tonypi_mosquitto mosquitto_sub -t "tonypi/servos/#" -v -C 1 -W 10
```

**2. Check backend logs:**
```cmd
docker-compose logs backend --tail=50 | findstr /i "servos"
```

**3. Test API:**
```cmd
curl http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi
```

---

## 📋 Expected Behavior

### **When Working Correctly:**

**Robot Client Logs (every 5 seconds):**
```
Sent servo status: 6 servos to tonypi/servos/tonypi_raspberrypi
```

**Backend Logs:**
```
MQTT: Received message on tonypi/servos/tonypi_raspberrypi: {'robot_id': 'tonypi_raspberrypi', 'servos': {...}}
MQTT: Stored servo data for 6 servos from tonypi_raspberrypi
```

**API Response:**
```json
{
  "robot_id": "tonypi_raspberrypi",
  "servos": {
    "servo_1_left_front": {...},
    ...
  }
}
```

---

## 🎯 Most Likely Issue

**Based on the logs, the most likely issue is:**

1. **`get_servo_status()` is returning empty data** - SDK might not be working
2. **Exception in `send_servo_status()` is being caught** - Check robot client logs
3. **Robot client code is not calling the function** - Verify main loop is running

**Next step:** Check robot client logs on Raspberry Pi to see what's happening.

---

**Last Updated:** December 2025




