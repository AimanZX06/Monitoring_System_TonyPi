# Fix: MQTT Callback TypeError

## 🔍 Problem

**Error on Raspberry Pi:**
```
TypeError: TonyPiRobotClient.on_disconnect() takes from 4 to 5 positional arguments but 6 were given
```

**Cause:** The `on_disconnect` callback signature doesn't match what paho-mqtt v2.x expects.

---

## ✅ Solution

**The fix has been applied to `robot_client/tonypi_client.py`.**

The `on_disconnect` method now uses `*args` and `**kwargs` to accept any number of arguments, making it compatible with both paho-mqtt v1.x and v2.x.

---

## 🚀 Next Steps

### **Step 1: Copy Fixed File to Raspberry Pi**

**On Windows:**
```cmd
cd C:\Users\aiman\Projects\Monitoring_System_TonyPi
copy_robot_client.bat YOUR_PI_IP
```

### **Step 2: Restart Robot Client**

**On Raspberry Pi:**
```bash
# Stop current client (Ctrl+C or):
pkill -f tonypi_client.py

# Start with fixed code:
cd /home/pi/robot_client
python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
```

### **Step 3: Verify No Errors**

**You should now see:**
```
Connected to MQTT broker at 192.168.1.12:1883
Successfully connected to MQTT broker
Board initialized successfully for servo control
Sent servo status: 6 servos
```

**No more TypeError!**

---

## ✅ What Was Fixed

**Before (causing error):**
```python
def on_disconnect(self, client, userdata, flags=None, rc=None, properties=None):
```

**After (fixed):**
```python
def on_disconnect(self, client, userdata, *args, **kwargs):
    # Handles both v1.x and v2.x signatures
    if args:
        if len(args) >= 2:
            return_code = args[1]  # rc
        else:
            return_code = args[0]  # flags or rc
    else:
        return_code = kwargs.get('rc') or kwargs.get('flags', 0)
```

**Also fixed `on_connect` for consistency:**
```python
def on_connect(self, client, userdata, flags, rc, *args, **kwargs):
```

---

## 🎯 Expected Behavior After Fix

1. ✅ Robot client connects to MQTT broker
2. ✅ No TypeError in logs
3. ✅ Servo data being sent: "Sent servo status: 6 servos"
4. ✅ Backend receives servo data
5. ✅ Frontend shows servo data

---

**The error is now fixed! Copy the updated file and restart the robot client.**











