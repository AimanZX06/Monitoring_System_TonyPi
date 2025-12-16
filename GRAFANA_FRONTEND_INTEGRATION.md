# Grafana Frontend Integration - Complete Guide

**Status:** ✅ **Grafana is fully integrated and embedded in the frontend**

---

## Overview

Grafana is now **fully embedded** inside the React frontend at `http://localhost:3001/monitoring`. All Grafana panels are displayed directly within the frontend interface, providing seamless monitoring without needing to access Grafana separately.

---

## How It Works

### **1. Embedded Panels**
- All Grafana panels are embedded via iframes
- Panels auto-refresh every 5 seconds
- Light theme for consistency with frontend UI
- Responsive grid layout

### **2. Frontend Integration**
- **Location:** `http://localhost:3001/monitoring`
- **Section:** "Advanced Analytics (Grafana)"
- **8 Panels Embedded:**
  1. System Performance (CPU & Memory)
  2. CPU Temperature (Gauge)
  3. Battery Level (Gauge)
  4. Accelerometer Data (X, Y, Z)
  5. Gyroscope Data (X, Y, Z)
  6. Distance Sensor
  7. Light Level (Gauge)
  8. Servo Angle

### **3. Configuration**
Grafana is configured in `docker-compose.yml`:
```yaml
grafana:
  environment:
    - GF_AUTH_ANONYMOUS_ENABLED=true      # No login required for viewing
    - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer   # Anonymous = Viewer role
    - GF_SECURITY_ALLOW_EMBEDDING=true    # Enable iframe embedding
    - GF_SECURITY_COOKIE_SAMESITE=none    # Cross-site cookies allowed
```

Frontend environment variables:
```yaml
frontend:
  environment:
    - REACT_APP_GRAFANA_URL=http://localhost:3000
    - REACT_APP_GRAFANA_ENABLED=true
```

---

## Access Points

### **Primary Access (Recommended)**
- **URL:** `http://localhost:3001/monitoring`
- **What you see:** Native charts + Grafana panels embedded
- **No login required** (anonymous viewing enabled)

### **Direct Grafana Access (Optional)**
- **URL:** `http://localhost:3000/d/tonypi-robot-monitoring`
- **Login:** `admin` / `admin`
- **Use for:** Dashboard customization, advanced queries

---

## Features

### ✅ **Always Available**
- Grafana panels are always shown when enabled
- Graceful error handling if Grafana is temporarily unavailable
- Fallback messages guide users if service is down

### ✅ **Real-time Updates**
- All panels refresh every 5 seconds
- Live data from InfluxDB
- Synchronized with robot telemetry

### ✅ **Seamless Integration**
- Panels match frontend theme
- Responsive design
- No page reloads needed
- Smooth user experience

### ✅ **Full Functionality**
- Time range selection (via full dashboard link)
- Zoom and pan capabilities
- Export options
- Custom queries

---

## Architecture

```
┌─────────────────────────────────────────┐
│  React Frontend (localhost:3001)        │
│  ┌───────────────────────────────────┐  │
│  │  Native Charts (Recharts)        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Grafana Panels (iframes)         │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐      │  │
│  │  │Panel1│ │Panel2│ │Panel3│ ...  │  │
│  │  └──────┘ └──────┘ └──────┘      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
           │                    │
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│  Grafana         │  │  Backend API    │
│  (localhost:3000)│  │  (localhost:8000)│
└──────────────────┘  └──────────────────┘
           │                    │
           └──────────┬─────────┘
                      ▼
              ┌──────────────┐
              │  InfluxDB    │
              │  (localhost:8086)│
              └──────────────┘
```

---

## Panel Details

| Panel | Type | Data Source | Panel ID |
|-------|------|-------------|----------|
| System Performance | Time Series | `robot_status` measurement | 1 |
| CPU Temperature | Gauge | `system_temperature` field | 2 |
| Battery Level | Gauge | `battery` measurement | 3 |
| Accelerometer | Time Series | `sensors` measurement | 4 |
| Gyroscope | Time Series | `sensors` measurement | 5 |
| Distance Sensor | Time Series | `sensors` measurement | 6 |
| Light Level | Gauge | `sensors` measurement | 7 |
| Servo Angle | Time Series | `sensors` measurement | 8 |

---

## Configuration Options

### **Enable/Disable Grafana**
```bash
# In docker-compose.yml or .env file:
REACT_APP_GRAFANA_ENABLED=false  # Disable Grafana
REACT_APP_GRAFANA_ENABLED=true    # Enable Grafana (default)
```

### **Custom Grafana URL**
```bash
# If Grafana runs on different port/host:
REACT_APP_GRAFANA_URL=http://custom-host:3000
```

### **Restart Services**
```bash
# After changing environment variables:
docker compose restart frontend
```

---

## Troubleshooting

### **Issue: Panels show "Loading..." or blank**
**Solutions:**
1. Check Grafana is running: `docker compose ps grafana`
2. Verify Grafana URL: `curl http://localhost:3000/api/health`
3. Check browser console for CORS errors
4. Ensure `GF_SECURITY_ALLOW_EMBEDDING=true` in docker-compose.yml
5. Restart Grafana: `docker compose restart grafana`

### **Issue: "Refused to connect" in iframe**
**Solutions:**
1. Verify embedding is enabled: `GF_SECURITY_ALLOW_EMBEDDING=true`
2. Check cookie settings: `GF_SECURITY_COOKIE_SAMESITE=none`
3. Clear browser cache
4. Try incognito/private mode

### **Issue: No data in panels**
**Solutions:**
1. Verify robot is sending data to InfluxDB
2. Check InfluxDB connection in Grafana datasource
3. Verify measurement names match (`robot_status`, `sensors`, `battery`)
4. Check time range (panels default to last 1 hour)

### **Issue: Panels don't refresh**
**Solutions:**
1. Check refresh interval in panel URL (should be `refresh=5s`)
2. Verify Grafana dashboard refresh settings
3. Check browser isn't blocking iframe updates

---

## Benefits

### ✅ **Unified Interface**
- All monitoring in one place
- No need to switch between applications
- Consistent user experience

### ✅ **Better Performance**
- Embedded panels load faster than separate page
- Reduced context switching
- Better mobile experience

### ✅ **Easier Access**
- No login required for viewing
- Direct access from main interface
- Quick navigation

### ✅ **Professional Look**
- Seamless integration
- Consistent styling
- Modern UI/UX

---

## Next Steps

1. ✅ **Grafana is now embedded** - All panels show in frontend
2. ✅ **Always available** - Panels always render when enabled
3. ✅ **Error handling** - Graceful fallbacks if Grafana unavailable
4. ✅ **Configuration** - Easy to enable/disable via environment variables

---

## Summary

**Grafana is fully integrated inside the frontend:**
- ✅ Embedded via iframes
- ✅ Always shown when enabled
- ✅ Real-time updates
- ✅ Seamless user experience
- ✅ No separate login required
- ✅ Professional integration

**Access:** `http://localhost:3001/monitoring` → Scroll to "Advanced Analytics (Grafana)"

