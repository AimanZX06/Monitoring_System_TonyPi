# Troubleshooting: No Servo Data Available

If you see "No servo data available" in the Servos page, follow these steps to diagnose and fix the issue.

---

## 🔍 Quick Diagnostic

**Run the diagnostic script:**

```cmd
python test_servo_api.py
```

Or use the batch script:

```cmd
check_servo_data_flow.bat
```

---

## 📋 Step-by-Step Troubleshooting

### **Step 1: Check Robot Client is Running**

**On Raspberry Pi:**
```bash
# Check if robot client is running
ps aux | grep tonypi_client

# If not running, start it:
cd /home/pi/robot_client
python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
```

**Expected output in logs:**
```
Sent servo status: 6 servos
```

---

### **Step 2: Check Robot Client Has Updated Code**

**Verify the robot client has the servo monitoring code:**

```bash
# On Raspberry Pi
grep -n "get_servo_status" /home/pi/robot_client/tonypi_client.py
```

**Should show:**
```
def get_servo_status(self) -> Dict[str, Any]:
```

**If not found, copy the updated file:**
```cmd
# On Windows
copy_robot_client.bat 192.168.1.100
```

---

### **Step 3: Check MQTT Messages**

**Check if servo data is being published:**

```bash
# On Windows (if mosquitto_sub is available)
docker exec -it tonypi_mosquitto mosquitto_sub -t "tonypi/servos/#" -v
```

**Or check backend logs:**
```cmd
docker-compose logs backend | findstr /i "servo"
```

**Expected:**
```
MQTT: Received message on tonypi/servos/tonypi_raspberrypi: {...}
MQTT: Stored servo data for 6 servos from tonypi_raspberrypi
```

---

### **Step 4: Check Backend is Receiving Data**

**Check backend MQTT handler:**

```cmd
# View backend logs
docker-compose logs backend --tail=100 | findstr /i "servo\|mqtt"
```

**Look for:**
- `MQTT: Received message on tonypi/servos/...`
- `MQTT: Stored servo data for X servos`

**If not seeing messages:**
1. Check MQTT broker is running: `docker-compose ps mosquitto`
2. Check backend is subscribed: Look for `MQTT: Subscribed to tonypi/servos/+`
3. Check robot client can connect to MQTT broker

---

### **Step 5: Check InfluxDB Has Data**

**Test API directly:**
```cmd
curl http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi
```

**Or use Python script:**
```cmd
python test_servo_api.py
```

**Expected response:**
```json
{
  "robot_id": "tonypi_raspberrypi",
  "servos": {
    "servo_1_left_front": {
      "id": 1,
      "name": "servo_1_left_front",
      "position": 45.0,
      "temperature": 52.3,
      ...
    },
    ...
  },
  "servo_count": 6
}
```

**If empty:**
- Check InfluxDB is running: `docker-compose ps influxdb`
- Check data was written: Look for `Error writing to InfluxDB` in backend logs

---

### **Step 6: Check SDK is Working on Robot**

**On Raspberry Pi, test SDK directly:**
```bash
python3 -c "
import hiwonder.ros_robot_controller_sdk as rrc
try:
    board = rrc.Board()
    temp = board.bus_servo_read_temp(1)
    pos = board.bus_servo_read_position(1)
    print(f'Servo 1 - Temp: {temp}°C, Position: {pos}°')
    print('✅ SDK working')
except Exception as e:
    print(f'❌ SDK error: {e}')
"
```

**If SDK fails:**
- Check SDK is installed: `pip3 list | grep hiwonder`
- Check permissions: May need `sudo` or add user to dialout group
- Check servos are connected and powered

---

### **Step 7: Check Robot ID Matches**

**Verify robot ID in frontend matches actual robot ID:**

**Check robot status:**
```cmd
curl http://localhost:8000/api/robot-data/status
```

**Note the `robot_id` (e.g., `tonypi_raspberrypi`)**

**In frontend Servos page, make sure you select the correct robot from dropdown.**

**Common mismatch:**
- Frontend expects: `tonypi_raspberrypi`
- Robot sends: `tonypi_01`
- **Fix:** Update robot client to use consistent ID, or select correct robot in frontend

---

## 🐛 Common Issues & Fixes

### **Issue 1: "No servo data found" in API response**

**Cause:** Data not in InfluxDB

**Fix:**
1. Check robot client is sending: Look for "Sent servo status" in robot logs
2. Check backend is receiving: Look for MQTT messages in backend logs
3. Check InfluxDB connection: Look for errors in backend logs

---

### **Issue 2: Robot client shows "SDK not available"**

**Cause:** HiwonderSDK not installed or not importable

**Fix:**
```bash
# On Raspberry Pi
pip3 install hiwonder
# Or install from source if needed
```

---

### **Issue 3: Robot client shows "Failed to initialize Board"**

**Cause:** Hardware not connected or permissions issue

**Fix:**
```bash
# Check permissions
ls -l /dev/ttyUSB* /dev/ttyAMA*

# Add user to dialout group
sudo usermod -a -G dialout $USER
# Log out and back in

# Check UART is enabled
sudo raspi-config
# Interface Options > Serial Port > Enable
```

---

### **Issue 4: MQTT connection fails**

**Cause:** Network or broker configuration

**Fix:**
1. Check robot can reach MQTT broker:
   ```bash
   # On Raspberry Pi
   ping YOUR_PC_IP
   telnet YOUR_PC_IP 1883
   ```

2. Check MQTT broker is accessible:
   ```cmd
   # On Windows
   docker-compose ps mosquitto
   ```

3. Check firewall allows port 1883

---

### **Issue 5: Backend not storing data**

**Cause:** InfluxDB connection or write error

**Fix:**
1. Check InfluxDB is running:
   ```cmd
   docker-compose ps influxdb
   ```

2. Check backend logs for InfluxDB errors:
   ```cmd
   docker-compose logs backend | findstr /i "influx\|error"
   ```

3. Verify InfluxDB credentials in `.env` file

---

## ✅ Verification Checklist

After fixing issues, verify:

- [ ] Robot client is running and shows "Sent servo status"
- [ ] Backend logs show "MQTT: Received message on tonypi/servos/..."
- [ ] Backend logs show "MQTT: Stored servo data for X servos"
- [ ] API returns servo data: `curl http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi`
- [ ] Frontend Servos page shows servo cards
- [ ] Servo data updates every 5 seconds

---

## 🔧 Quick Fixes

### **Restart Everything:**
```cmd
# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Restart robot client on Pi
# SSH to Pi and restart tonypi_client.py
```

### **Check All Services:**
```cmd
docker-compose ps
```

All services should show "Up" status.

### **View All Logs:**
```cmd
docker-compose logs --tail=100
```

---

## 📞 Still Not Working?

**Collect diagnostic info:**

1. **Robot client logs:**
   ```bash
   # On Raspberry Pi
   python3 tonypi_client.py --broker YOUR_PC_IP 2>&1 | tee robot_client.log
   ```

2. **Backend logs:**
   ```cmd
   docker-compose logs backend > backend.log
   ```

3. **API test:**
   ```cmd
   python test_servo_api.py > api_test.log
   ```

4. **Check:**
   - Robot ID matches between robot client and frontend
   - MQTT broker IP/port is correct
   - All services are running
   - SDK is working on robot

---

**Last Updated:** December 2025



