# Start Robot Client to Send Servo Data

## 🔍 Problem

**Backend logs show:**
- ✅ Subscribed to `tonypi/servos/+`
- ✅ API calls return 200 OK
- ❌ **NO messages received on `tonypi/servos/` topic**
- ❌ **NO "MQTT: Received message on tonypi/servos/..." logs**
- ❌ **NO "MQTT: Stored servo data for X servos" logs**

**This means the robot client is NOT sending servo data.**

---

## ✅ Solution: Start Robot Client

### **Step 1: SSH into Raspberry Pi**

```bash
ssh pi@192.168.1.103
```

### **Step 2: Navigate to Robot Client Directory**

```bash
cd /home/pi/robot_client
```

### **Step 3: Check if Robot Client is Running**

```bash
ps aux | grep tonypi_client.py
```

**If you see a process:**
- The client is running
- But it might not be connected or sending data
- Kill it first: `pkill -f tonypi_client.py`

**If you see nothing:**
- The client is not running
- Proceed to start it

### **Step 4: Find Your PC's IP Address**

**On Windows (from your PC):**
```cmd
ipconfig
```

Look for your local IP address (usually `192.168.1.xxx`)

**Example:** If your PC IP is `192.168.1.100`, use that.

### **Step 5: Start Robot Client**

**On Raspberry Pi:**
```bash
cd /home/pi/robot_client
python3 tonypi_client.py --broker 192.168.1.100 --port 1883
```

**Replace `192.168.1.100` with your actual PC IP address.**

### **Step 6: Verify Robot Client is Sending Data**

**You should see logs like:**
```
Sent servo status: 6 servos to tonypi/servos/tonypi_raspberrypi
```

**If you see errors:**
- Check MQTT broker is accessible
- Check network connectivity
- Check broker IP address is correct

---

## 🔍 Verify Data Flow

### **On Raspberry Pi (Robot Client Logs):**

**Should see every 5 seconds:**
```
Sent servo status: 6 servos to tonypi/servos/tonypi_raspberrypi
```

### **On Windows (Backend Logs):**

**Check backend logs:**
```cmd
docker-compose logs backend --tail=50 | findstr /i "servos"
```

**Should see:**
```
MQTT: Received message on tonypi/servos/tonypi_raspberrypi: {...}
MQTT: Stored servo data for 6 servos from tonypi_raspberrypi
```

### **Check MQTT Directly:**

**On Windows:**
```cmd
docker exec tonypi_mosquitto mosquitto_sub -t "tonypi/servos/#" -C 1 -W 10
```

**Should see JSON payload with servo data.**

---

## 🐛 Troubleshooting

### **Problem: Robot Client Not Starting**

**Check:**
1. Python 3 is installed: `python3 --version`
2. Required packages installed: `pip3 list | grep paho`
3. File exists: `ls -la /home/pi/robot_client/tonypi_client.py`

**Install missing packages:**
```bash
pip3 install paho-mqtt psutil
```

### **Problem: Connection Failed**

**Error:** `Connection refused` or `Connection timeout`

**Solutions:**
1. Check MQTT broker is running:
   ```cmd
   docker-compose ps mosquitto
   ```

2. Check broker is accessible from Pi:
   ```bash
   # On Pi
   ping YOUR_PC_IP
   telnet YOUR_PC_IP 1883
   ```

3. Check firewall on Windows:
   - Allow port 1883 through Windows Firewall
   - Or temporarily disable firewall to test

### **Problem: No "Sent servo status" Logs**

**Check:**
1. Robot client is connected:
   - Look for "Connected to MQTT broker" message
   - Check `is_connected` is True

2. `get_servo_status()` is working:
   - Check for errors in robot client logs
   - Verify SDK is available (if using real servos)

3. Check robot client logs for errors:
   ```bash
   # Look for error messages
   python3 tonypi_client.py --broker YOUR_PC_IP 2>&1 | grep -i error
   ```

### **Problem: Messages Sent But Not Received**

**Check:**
1. Backend is subscribed:
   ```cmd
   docker-compose logs backend | findstr /i "Subscribed to tonypi/servos"
   ```

2. MQTT broker is routing messages:
   ```cmd
   docker exec tonypi_mosquitto mosquitto_sub -t "tonypi/servos/#" -v
   ```

3. Network connectivity:
   - Pi can reach broker
   - Broker can reach backend

---

## 📋 Quick Checklist

- [ ] Robot client file exists on Pi
- [ ] Robot client has `send_servo_status()` function
- [ ] Robot client is running
- [ ] Robot client is connected to MQTT broker
- [ ] Robot client logs show "Sent servo status" messages
- [ ] Backend logs show "Received message on tonypi/servos/..."
- [ ] Backend logs show "Stored servo data for X servos"
- [ ] API returns servo data: `curl http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi`

---

## 🚀 Quick Start Command

**On Raspberry Pi:**
```bash
cd /home/pi/robot_client && python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
```

**Replace `YOUR_PC_IP` with your actual Windows PC IP address.**

**To run in background:**
```bash
nohup python3 tonypi_client.py --broker YOUR_PC_IP --port 1883 > /tmp/robot_client.log 2>&1 &
```

**To check if running:**
```bash
ps aux | grep tonypi_client.py
tail -f /tmp/robot_client.log
```

---

## 📝 Expected Output

### **Robot Client Logs:**
```
TonyPi Robot Client initialized with ID: tonypi_raspberrypi
Connecting to MQTT broker at 192.168.1.100:1883
Connected to MQTT broker
Sent servo status: 6 servos to tonypi/servos/tonypi_raspberrypi
Sent servo status: 6 servos to tonypi/servos/tonypi_raspberrypi
...
```

### **Backend Logs:**
```
MQTT: Received message on tonypi/servos/tonypi_raspberrypi: {'robot_id': 'tonypi_raspberrypi', 'servos': {...}}
MQTT: Stored servo data for 6 servos from tonypi_raspberrypi
```

### **API Response:**
```json
{
  "robot_id": "tonypi_raspberrypi",
  "servos": {
    "servo_1_left_front": {
      "id": 1,
      "position": 45.0,
      "temperature": 55.2,
      ...
    },
    ...
  }
}
```

---

**Last Updated:** December 2025












