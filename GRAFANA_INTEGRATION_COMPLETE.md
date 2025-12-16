# Grafana Frontend Integration Guide

## Overview

Grafana dashboards are now **fully integrated into the React frontend** at http://localhost:3001. You no longer need to access Grafana's website separately.

## What Was Implemented

### 1. **Pre-configured Dashboard**
- Dashboard ID: `tonypi-robot-monitoring`
- Auto-provisioned on Grafana startup
- **8 comprehensive panels**:
  - CPU & Memory Usage (Time Series)
  - CPU Temperature (Gauge)
  - Battery Level (Gauge)
  - Accelerometer Data (Time Series)
  - Gyroscope Data (Time Series)
  - Ultrasonic Distance (Time Series)
  - Camera Light Level (Gauge)
  - Servo Angle (Time Series)

### 2. **Embedded in Monitoring Page**
- All panels embedded as iframes
- Auto-refresh every 5 seconds
- Light theme for consistency
- Organized in responsive grid layout

### 3. **Grafana Configuration**
Updated `docker-compose.yml` with:
```yaml
- GF_AUTH_ANONYMOUS_ENABLED=true
- GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
- GF_SECURITY_ALLOW_EMBEDDING=true
- GF_SECURITY_COOKIE_SAMESITE=none
```

## How to Access

### Frontend (Recommended)
1. Navigate to: **http://localhost:3001/monitoring**
2. Scroll down to "Advanced Analytics" section
3. View all 8 panels with live data

### Grafana Direct (Optional)
- URL: http://localhost:3000/d/tonypi-robot-monitoring
- Username: `admin`
- Password: `admin`
- Use only for dashboard customization

## Panel Details

| Panel | Type | Purpose | Panel ID |
|-------|------|---------|----------|
| CPU & Memory | Time Series | System resource usage over time | 1 |
| CPU Temperature | Gauge | Current CPU temperature with thresholds | 2 |
| Battery Level | Gauge | Current battery percentage | 3 |
| Accelerometer | Time Series | 3-axis acceleration data (X, Y, Z) | 4 |
| Gyroscope | Time Series | 3-axis rotation data (X, Y, Z) | 5 |
| Distance Sensor | Time Series | Ultrasonic distance measurements | 6 |
| Light Level | Gauge | Camera light sensor reading | 7 |
| Servo Angle | Time Series | Servo motor position | 8 |

## Customization

### To Add More Panels

1. **Create/Edit in Grafana**:
   ```
   http://localhost:3000/d/tonypi-robot-monitoring
   ```

2. **Get Embed URL**:
   - Click panel title → Share → Link
   - Toggle "Direct link rendered image"
   - Copy the URL

3. **Add to Frontend**:
   Edit `frontend/src/pages/Monitoring.tsx`:
   ```tsx
   <GrafanaPanel 
     panelUrl="http://localhost:3000/d-solo/tonypi-robot-monitoring/...?panelId=9"
     height={300}
   />
   ```

### To Modify Dashboard Queries

Edit `grafana/provisioning/dashboards/tonypi-dashboard.json` and restart Grafana:
```bash
docker compose restart grafana
```

## Data Sources

All panels use **InfluxDB** datasource:
- **Bucket**: `robot_data`
- **Organization**: `tonypi`
- **Query Language**: Flux

### Common Flux Queries

**CPU Usage:**
```flux
from(bucket: "robot_data")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "robot_status")
  |> filter(fn: (r) => r["_field"] == "system_cpu_percent")
```

**Battery:**
```flux
from(bucket: "robot_data")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "battery")
  |> filter(fn: (r) => r["_field"] == "percentage")
```

**Sensors:**
```flux
from(bucket: "robot_data")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "sensors")
  |> filter(fn: (r) => r["sensor_type"] == "accelerometer_x")
```

## Troubleshooting

### Panels Not Loading

**Issue**: Blank iframes or "panel not found"

**Solutions**:
1. Check Grafana is running:
   ```bash
   docker compose ps grafana
   ```

2. Verify dashboard exists:
   ```
   http://localhost:3000/d/tonypi-robot-monitoring
   ```

3. Check browser console for CORS errors

4. Restart Grafana:
   ```bash
   docker compose restart grafana
   ```

### No Data Showing

**Issue**: Panels load but show "No Data"

**Solutions**:
1. Verify robot is connected and sending data
2. Check InfluxDB has data:
   ```bash
   curl http://localhost:8000/api/robot-data/sensors?measurement=sensors&time_range=1h
   ```

3. Adjust time range in Grafana (top-right corner)

### CORS or Embedding Errors

**Issue**: "X-Frame-Options deny" or "refused to display"

**Solutions**:
1. Ensure Grafana environment variables are set:
   ```yaml
   - GF_SECURITY_ALLOW_EMBEDDING=true
   - GF_SECURITY_COOKIE_SAMESITE=none
   ```

2. Restart Grafana after changes:
   ```bash
   docker compose down grafana
   docker compose up -d grafana
   ```

## Benefits of Integration

✅ **Single Interface**: No need to switch between apps  
✅ **Consistent UX**: Matches your frontend design  
✅ **Auto-Refresh**: Real-time updates every 5 seconds  
✅ **Production-Ready**: Anonymous access for viewers  
✅ **Customizable**: Easy to add/remove panels  
✅ **Professional**: Grafana's powerful visualization engine  

## Next Steps

1. **Test the Integration**:
   - Visit http://localhost:3001/monitoring
   - Verify all 8 panels load
   - Check data is flowing

2. **Customize Appearance**:
   - Modify panel heights in `Monitoring.tsx`
   - Adjust grid layout
   - Add custom titles

3. **Add More Visualizations**:
   - Create custom dashboards in Grafana
   - Embed new panels in frontend
   - Add alerting rules

## File Structure

```
Monitoring_System_TonyPi/
├── grafana/
│   └── provisioning/
│       ├── datasources/
│       │   └── datasources.yml           # InfluxDB + PostgreSQL
│       └── dashboards/
│           ├── dashboards.yml            # Dashboard provider config
│           └── tonypi-dashboard.json     # Main dashboard definition
├── frontend/
│   └── src/
│       ├── components/
│       │   └── GrafanaPanel.tsx          # Reusable iframe component
│       └── pages/
│           └── Monitoring.tsx            # Embedded dashboard page
└── docker-compose.yml                     # Grafana with embedding enabled
```

## Summary

Your Grafana dashboards are now **seamlessly integrated** into your React frontend. Users can view all robot metrics without ever leaving your application. The system is production-ready with anonymous access for viewers and full customization capabilities for administrators.

🎉 **You now have a professional-grade monitoring system with embedded analytics!**
