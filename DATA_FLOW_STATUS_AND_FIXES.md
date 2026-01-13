# Data Flow Status and Fixes

## ✅ Current Status

### **Backend API: WORKING**
- API endpoint returns **200 OK**
- Returns empty array `[]` when database is empty (correct behavior)
- Error handling improved with better logging

### **Database: EMPTY (Expected)**
- InfluxDB is running and accessible
- No data yet because robot hasn't sent servo data on `tonypi/servos/` topic
- Robot is sending `servo_angle` on `tonypi/sensors/` topic (this is different)

### **Frontend: 500 ERROR (Likely Frontend Issue)**
- Browser shows 500 error
- But backend logs show 200 OK
- This suggests a frontend/CORS/network issue

---

## 🔍 Root Cause Analysis

### **Issue 1: Database is Empty**

**Why:**
- Robot is sending `servo_angle` on `tonypi/sensors/` topic
- But frontend expects full servo data on `tonypi/servos/` topic
- These are two different data paths

**Data Flow:**
```
Robot → tonypi/sensors/{robot_id} → sensors measurement (servo_angle only)
Robot → tonypi/servos/{robot_id} → servos measurement (full servo data) ← Frontend uses this
```

**Solution:**
- Robot needs to send data on `tonypi/servos/` topic
- Robot client has `send_servo_status()` function (verified on Pi)
- Need to restart robot client to start sending servo data

### **Issue 2: Frontend 500 Error**

**Why:**
- Backend returns 200 OK with empty array
- Frontend might be:
  - Not handling empty arrays correctly
  - Having CORS issues
  - Timing out
  - Caching old error responses

**Solution:**
- Check browser console for actual error
- Check Network tab for request/response
- Try hard refresh (Ctrl+F5)
- Check if CORS headers are present

---

## 🔧 Fixes Applied

### **1. Improved InfluxDB Error Handling**

**File:** `backend/database/influx_client.py`

- Added `org` parameter to query
- Better error messages with traceback
- Re-raises exceptions instead of silent failures

### **2. Improved API Error Handling**

**File:** `backend/routers/robot_data.py`

- Better handling of empty/invalid data
- Individual item error handling
- Better error messages

---

## 📋 Action Items

### **Immediate Actions:**

1. **Start Robot Client to Send Servo Data**
   ```bash
   # On Raspberry Pi
   cd /home/pi/robot_client
   python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
   ```

2. **Verify Robot is Sending Servo Data**
   ```cmd
   # Check backend logs
   docker-compose logs backend --tail=50 | findstr /i "servos"
   
   # Should see:
   # MQTT: Received message on tonypi/servos/tonypi_raspberrypi
   # MQTT: Stored servo data for X servos
   ```

3. **Check Frontend Error**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for actual error message
   - Go to Network tab
   - Check the failing request details

4. **Test API Directly**
   ```cmd
   curl http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi
   ```

### **Verification Steps:**

1. **Check MQTT Messages**
   ```cmd
   docker exec tonypi_mosquitto mosquitto_sub -t "tonypi/servos/#" -C 1 -W 10
   ```

2. **Check Database Has Data**
   ```cmd
   python -c "from backend.database.influx_client import influx_client; data = influx_client.query_recent_data('servos', '1h'); print(f'Found {len(data)} records')"
   ```

3. **Check API Returns Data**
   ```cmd
   curl http://localhost:8000/api/robot-data/servos/tonypi_raspberrypi
   ```

4. **Check Frontend**
   - Open http://localhost:3000/servos
   - Select robot
   - Should see servo cards with data

---

## 🎯 Expected Results

### **After Robot Sends Servo Data:**

1. **Backend Logs:**
   ```
   MQTT: Received message on tonypi/servos/tonypi_raspberrypi: {...}
   MQTT: Stored servo data for 6 servos from tonypi_raspberrypi
   ```

2. **Database:**
   - `servos` measurement has data
   - Tags: robot_id, servo_id, servo_name
   - Fields: position, temperature, voltage, etc.

3. **API:**
   ```json
   {
     "robot_id": "tonypi_raspberrypi",
     "servos": {
       "head_servo": {
         "id": 1,
         "position": 45.0,
         "temperature": 55.2,
         ...
       },
       ...
     }
   }
   ```

4. **Frontend:**
   - Servo cards displayed
   - Data updates every 5 seconds
   - No errors in console

---

## 🐛 Troubleshooting

### **If Frontend Still Shows 500 Error:**

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Check Console tab for actual error
   - Check Network tab for request details

2. **Check CORS:**
   - Look for CORS errors in console
   - Check response headers include CORS headers
   - Verify API URL is correct

3. **Clear Browser Cache:**
   - Hard refresh: Ctrl+F5
   - Or clear cache and reload

4. **Check Network:**
   - Verify API is accessible: `curl http://localhost:8000/api/health`
   - Check if there's a firewall blocking
   - Check if port 8000 is accessible

### **If Database Remains Empty:**

1. **Check Robot Client:**
   - Verify robot client is running
   - Check robot client logs for "Sent servo status"
   - Verify robot client has `send_servo_status()` function

2. **Check MQTT:**
   - Verify MQTT broker is running
   - Check messages are being published
   - Verify backend is subscribed to `tonypi/servos/+`

3. **Check Backend:**
   - Check backend logs for MQTT messages
   - Check backend logs for InfluxDB write errors
   - Verify InfluxDB connection

---

## 📊 Data Flow Verification

Use the verification script:
```cmd
python verify_servo_data_flow.py
```

Or the batch file:
```cmd
verify_servo_data_flow.bat
```

This will check:
1. ✅ API health
2. ✅ MQTT messages
3. ✅ Database storage
4. ✅ API responses
5. ✅ Frontend data flow

---

## 📝 Summary

**Current State:**
- ✅ Backend API is working
- ✅ InfluxDB is connected
- ✅ MQTT is working
- ⚠️ Database is empty (waiting for robot data)
- ⚠️ Frontend shows 500 error (likely frontend/CORS issue)

**Next Steps:**
1. Start robot client to send servo data
2. Verify data flows: Robot → MQTT → Database → API
3. Check frontend error in browser console
4. Fix frontend error handling if needed

**The system is ready - just need robot to send data!**

---

**Last Updated:** December 2025












