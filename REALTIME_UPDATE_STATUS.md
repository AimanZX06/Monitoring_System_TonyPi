# Real-Time Update Status

## ✅ **Yes, Charts and Data Update in Real-Time!**

The system uses **near real-time updates** with automatic refresh every **5 seconds**.

---

## 📊 **Update Intervals**

### **Frontend Pages (HTTP Polling):**

| Page | Update Interval | What Updates |
|------|----------------|--------------|
| **Servos** | Every 5 seconds | Servo data (position, temperature, voltage, etc.) |
| **Monitoring** | Every 5 seconds | CPU, memory, disk, temperature charts |
| **Jobs** | Every 5 seconds | Job progress, status, completion |
| **Robots** | Every 5 seconds | Robot status, battery, location |
| **Dashboard** | Every 5 seconds | All overview data |

### **Grafana Panels:**

All Grafana panels are configured with **`refresh: '5s'`**, meaning they automatically refresh every 5 seconds.

**Panels include:**
- CPU Usage
- Memory Usage
- CPU Temperature
- Battery Level
- Accelerometer (X, Y, Z)
- Gyroscope (X, Y, Z)
- Ultrasonic Distance
- Servo Angle

### **Robot Client (Data Source):**

| Data Type | Send Interval | Topic |
|-----------|---------------|-------|
| **Servo Status** | Every 5 seconds | `tonypi/servos/{robot_id}` |
| **Sensor Data** | Every 2 seconds | `tonypi/sensors/{robot_id}` |
| **Location** | Every 5 seconds | `tonypi/location` |
| **Battery** | Every 30 seconds | `tonypi/battery` |
| **Status** | Every 60 seconds | `tonypi/status/{robot_id}` |

---

## 🔄 **How It Works**

### **Data Flow:**

```
Raspberry Pi (Robot Client)
    │
    │ Sends data every 2-5 seconds
    │
    ▼
MQTT Broker (Mosquitto)
    │
    │ Routes messages
    │
    ▼
Backend (FastAPI)
    │
    │ Receives & stores in InfluxDB/PostgreSQL
    │
    ▼
Frontend (React)
    │
    │ Polls API every 5 seconds
    │
    ▼
Charts & Displays Update
```

### **Update Mechanism:**

1. **Robot Client** → Sends data via MQTT (every 2-5 seconds)
2. **Backend** → Receives MQTT, stores in databases
3. **Frontend** → Polls API every 5 seconds via `setInterval()`
4. **Charts** → Update automatically when new data arrives
5. **Grafana** → Auto-refreshes every 5 seconds

---

## ⚡ **Real-Time vs Near Real-Time**

**Current System: Near Real-Time (5-second polling)**

- ✅ Updates automatically every 5 seconds
- ✅ No manual refresh needed
- ✅ Low latency (5 seconds max)
- ⚠️ Not instant (true real-time would be < 1 second)

**True Real-Time Options (if needed):**

1. **WebSocket Connection:**
   - Backend pushes data to frontend instantly
   - Updates in < 1 second
   - Requires WebSocket implementation

2. **MQTT in Frontend:**
   - Frontend subscribes to MQTT topics directly
   - Updates instantly when data arrives
   - Already have `useMqtt` hook available!

3. **Server-Sent Events (SSE):**
   - Backend streams data to frontend
   - Updates in < 1 second
   - Requires SSE implementation

---

## 🎯 **Current Performance**

**For most monitoring use cases, 5-second updates are sufficient:**

- ✅ Servo monitoring: 5 seconds is fast enough
- ✅ System metrics: 5 seconds is standard
- ✅ Job tracking: 5 seconds is adequate
- ✅ Battery monitoring: 30 seconds is fine

**5-second polling provides:**
- Good balance between responsiveness and server load
- Smooth chart updates
- Low bandwidth usage
- No noticeable lag for monitoring purposes

---

## 🔍 **Verify Updates Are Working**

### **1. Check Frontend Console:**

Open browser DevTools (F12) → Console tab

You should see:
```
Servo data received: {...}
```

Every 5 seconds.

### **2. Watch Charts:**

- Charts should smoothly update every 5 seconds
- Grafana panels should refresh automatically
- No page reload needed

### **3. Check Network Tab:**

Open DevTools → Network tab

You should see API calls every 5 seconds:
- `/api/robot-data/servos/tonypi_raspberrypi`
- `/api/robot-data/status`
- `/api/pi/perf/...`

---

## ⚙️ **Change Update Interval (If Needed)**

### **To Make Updates Faster (e.g., 2 seconds):**

**Edit frontend files:**

```typescript
// In Servos.tsx, Monitoring.tsx, etc.
const interval = setInterval(fetchData, 2000); // Changed from 5000 to 2000
```

### **To Make Updates Slower (e.g., 10 seconds):**

```typescript
const interval = setInterval(fetchData, 10000); // Changed from 5000 to 10000
```

### **For Grafana Panels:**

Edit `frontend/src/pages/Monitoring.tsx`:

```typescript
// Change refresh parameter
panelUrl={buildGrafanaPanelUrl('tonypi-robot-monitoring', 1, { 
  robotId, 
  refresh: '2s',  // Changed from '5s' to '2s'
  theme: 'light' 
})}
```

---

## 📋 **Summary**

✅ **Charts and data update automatically every 5 seconds**

✅ **No manual refresh needed** - everything updates in real-time

✅ **Grafana panels auto-refresh** every 5 seconds

✅ **All pages update automatically** via HTTP polling

✅ **Robot sends data frequently** (2-5 second intervals)

**The system is working in near real-time mode, which is perfect for monitoring applications!**

---

**Last Updated:** December 2025



