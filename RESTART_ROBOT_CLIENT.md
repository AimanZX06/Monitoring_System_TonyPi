# Restart Robot Client with Updated Code

## ✅ Code is Copied!

You've successfully copied the updated `tonypi_client.py` to the Raspberry Pi. Now you need to **start the robot client** with the updated code.

---

## 🚀 Start Robot Client

**On Raspberry Pi (you're already SSH'd in):**

```bash
cd /home/pi/robot_client
python3 tonypi_client.py --broker 192.168.1.12 --port 1883
```

**Replace `192.168.1.12` with your Windows PC's IP address if different.**

---

## ✅ What to Look For

**After starting, you should see:**

1. **Connection messages:**
   ```
   Connected to MQTT broker at 192.168.1.12:1883
   Successfully connected to MQTT broker
   ```

2. **SDK messages (if SDK is installed):**
   ```
   HiwonderSDK loaded successfully
   Board initialized successfully for servo control
   ```

3. **Servo status messages (every 5 seconds):**
   ```
   Sent servo status: 6 servos to tonypi/servos/tonypi_raspberrypi
   ```

---

## 🔍 Verify It's Working

### **1. Check Robot Client Logs**

**On Raspberry Pi terminal, you should see:**
```
Sent servo status: 6 servos to tonypi/servos/tonypi_raspberrypi
```
**(Appears every 5 seconds)**

---

### **2. Check Backend Logs**

**On Windows, in a new terminal:**
```cmd
docker-compose logs backend --tail=50 | findstr /i "servos"
```

**Should see:**
```
MQTT: Received message on tonypi/servos/tonypi_raspberrypi: {...}
MQTT: Stored servo data for 6 servos from tonypi_raspberrypi
```

---

### **3. Test API**

**On Windows:**
```cmd
python test_servo_api.py
```

**Should now show:**
```
[OK] Found X servo data points in InfluxDB
[OK] Found 6 servos
```

---

### **4. Check Frontend**

**Open:** http://localhost:3001

**Go to "Servos" tab** - should now show servo cards with data!

---

## 🐛 Troubleshooting

### **If you don't see "Sent servo status" messages:**

1. **Check SDK:**
   ```bash
   python3 -c "import hiwonder.ros_robot_controller_sdk as rrc; print('OK')"
   ```
   - If error: SDK not installed → Servo data will be simulated (still works!)

2. **Check if client is running:**
   ```bash
   ps aux | grep tonypi_client
   ```

3. **Check for errors in robot client logs**

---

### **If backend still shows no servo data:**

1. **Wait 5-10 seconds** (servo data sends every 5 seconds)
2. **Check backend logs again:**
   ```cmd
   docker-compose logs backend --tail=100 | findstr /i "servos"
   ```
3. **Verify MQTT connection:**
   - Robot client should show "Connected to MQTT broker"
   - Backend should show "MQTT: Connected to broker"

---

## 📋 Quick Checklist

- [x] Code copied to Pi ✅
- [ ] Robot client started with updated code
- [ ] See "Sent servo status" messages in robot logs
- [ ] See "MQTT: Received message on tonypi/servos/..." in backend logs
- [ ] API test shows servo data
- [ ] Frontend shows servo cards

---

**Start the robot client now and check the logs!**



