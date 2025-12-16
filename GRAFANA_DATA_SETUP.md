# Grafana Dashboard Setup - Complete Guide

## 🎯 What to Display in Grafana

Based on your InfluxDB data, here are the best visualizations for your TonyPi monitoring system:

---

## 📊 Recommended Dashboards

### Dashboard 1: Raspberry Pi Performance Monitoring

#### Panel 1: CPU Usage Over Time
- **Type**: Time series graph
- **Data**: `system_cpu_percent` from `robot_status` measurement
- **Display**: Line graph showing CPU percentage (0-100%)
- **Useful for**: Identifying CPU spikes, performance trends

#### Panel 2: Memory Usage Over Time
- **Type**: Time series graph
- **Data**: `system_memory_percent` from `robot_status` measurement
- **Display**: Line graph showing memory percentage (0-100%)
- **Useful for**: Memory leak detection, usage patterns

#### Panel 3: Temperature Monitoring
- **Type**: Time series graph with threshold
- **Data**: `system_temperature` from `robot_status` measurement
- **Display**: Line graph with alert threshold at 70°C
- **Useful for**: Overheating detection, cooling effectiveness

#### Panel 4: Disk Usage
- **Type**: Gauge or stat panel
- **Data**: Latest `system_disk_usage` from `robot_status`
- **Display**: Current disk usage percentage
- **Useful for**: Storage monitoring

#### Panel 5: System Uptime
- **Type**: Stat panel
- **Data**: `system_uptime` from `robot_status`
- **Display**: Days/hours/minutes
- **Useful for**: Reliability tracking

### Dashboard 2: Multi-Robot Overview

#### Panel 1: All Robots Status Table
- **Type**: Table
- **Data**: Latest values from all `robot_id` tags
- **Columns**: Robot ID, CPU%, Memory%, Temp, Battery, Status
- **Useful for**: Quick overview of all robots

#### Panel 2: Battery Levels
- **Type**: Bar gauge
- **Data**: `battery_level` from `battery` measurement
- **Display**: Horizontal bars per robot
- **Useful for**: Battery management

#### Panel 3: Robot Activity Heatmap
- **Type**: Status history
- **Data**: Online/offline status per robot
- **Display**: Heatmap showing uptime patterns
- **Useful for**: Reliability analysis

### Dashboard 3: Job Performance

#### Panel 1: Jobs Completed Today
- **Type**: Stat panel
- **Data**: Count of jobs with end_time today
- **Display**: Big number with trend
- **Useful for**: Daily productivity tracking

#### Panel 2: Average Job Duration
- **Type**: Time series
- **Data**: end_time - start_time calculation
- **Display**: Line graph of average duration
- **Useful for**: Performance optimization

#### Panel 3: Items Processed Rate
- **Type**: Time series
- **Data**: Rate of items_done increase
- **Display**: Line graph showing items/hour
- **Useful for**: Throughput analysis

---

## 🚀 Quick Setup Steps

### Step 1: Access Grafana
1. Open browser: http://localhost:3000
2. Login: `admin` / `admin`
3. (Optional) Change password or skip

### Step 2: Add InfluxDB Data Source

1. Click **"⚙️ Configuration"** → **"Data sources"**
2. Click **"Add data source"**
3. Select **"InfluxDB"**
4. Configure:
   ```
   Name: TonyPi InfluxDB
   Query Language: Flux
   URL: http://influxdb:8086
   Auth: Off (disable all toggles)
   Organization: tonypi
   Token: my-super-secret-auth-token
   Default Bucket: robot_data
   ```
5. Click **"Save & Test"** → Should see "✅ datasource is working"

### Step 3: Create Dashboard

#### Option A: Import Complete Dashboard (Recommended)

1. Copy the JSON below
2. Click **"+"** → **"Import"**
3. Paste JSON
4. Click **"Load"**
5. Select data source: "TonyPi InfluxDB"
6. Click **"Import"**

#### Dashboard JSON:
```json
{
  "dashboard": {
    "title": "TonyPi Performance Monitor",
    "uid": "tonypi-perf",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "type": "timeseries",
        "title": "CPU Usage (%)",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
        "targets": [
          {
            "refId": "A",
            "query": "from(bucket: \"robot_data\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r[\"_measurement\"] == \"robot_status\")\n  |> filter(fn: (r) => r[\"_field\"] == \"system_cpu_percent\")\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> yield(name: \"mean\")"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "color": { "mode": "palette-classic" }
          }
        }
      },
      {
        "id": 2,
        "type": "timeseries",
        "title": "Memory Usage (%)",
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
        "targets": [
          {
            "refId": "A",
            "query": "from(bucket: \"robot_data\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r[\"_measurement\"] == \"robot_status\")\n  |> filter(fn: (r) => r[\"_field\"] == \"system_memory_percent\")\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> yield(name: \"mean\")"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "color": { "mode": "palette-classic" }
          }
        }
      },
      {
        "id": 3,
        "type": "timeseries",
        "title": "CPU Temperature (°C)",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
        "targets": [
          {
            "refId": "A",
            "query": "from(bucket: \"robot_data\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r[\"_measurement\"] == \"robot_status\")\n  |> filter(fn: (r) => r[\"_field\"] == \"system_temperature\")\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> yield(name: \"mean\")"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "celsius",
            "color": { "mode": "thresholds" },
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "value": null, "color": "green" },
                { "value": 60, "color": "yellow" },
                { "value": 70, "color": "red" }
              ]
            }
          }
        }
      },
      {
        "id": 4,
        "type": "gauge",
        "title": "Disk Usage",
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
        "targets": [
          {
            "refId": "A",
            "query": "from(bucket: \"robot_data\")\n  |> range(start: -5m)\n  |> filter(fn: (r) => r[\"_measurement\"] == \"robot_status\")\n  |> filter(fn: (r) => r[\"_field\"] == \"system_disk_usage\")\n  |> last()"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "color": { "mode": "thresholds" },
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "value": null, "color": "green" },
                { "value": 70, "color": "yellow" },
                { "value": 90, "color": "red" }
              ]
            }
          }
        }
      }
    ],
    "refresh": "5s",
    "time": { "from": "now-1h", "to": "now" }
  }
}
```

#### Option B: Create Panels Manually

**Panel 1: CPU Usage**
1. Click **"Add panel"** → **"Add a new panel"**
2. Data source: "TonyPi InfluxDB"
3. Click **"Code"** (top right)
4. Paste query:
```flux
from(bucket: "robot_data")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "robot_status")
  |> filter(fn: (r) => r["_field"] == "system_cpu_percent")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
```
5. Right panel → **Standard options**:
   - Unit: `Percent (0-100)`
   - Min: `0`
   - Max: `100`
6. Panel options → Title: `CPU Usage (%)`
7. Click **"Apply"**

**Repeat for other panels** with these queries:

**Memory Usage:**
```flux
from(bucket: "robot_data")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "robot_status")
  |> filter(fn: (r) => r["_field"] == "system_memory_percent")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
```

**Temperature:**
```flux
from(bucket: "robot_data")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "robot_status")
  |> filter(fn: (r) => r["_field"] == "system_temperature")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
```

**Disk Usage (Latest value):**
```flux
from(bucket: "robot_data")
  |> range(start: -5m)
  |> filter(fn: (r) => r["_measurement"] == "robot_status")
  |> filter(fn: (r) => r["_field"] == "system_disk_usage")
  |> last()
```

### Step 4: Configure Dashboard Settings

1. Click **⚙️** (dashboard settings) at top
2. **General** tab:
   - Name: `TonyPi Performance Monitor`
   - Description: `Real-time Raspberry Pi performance metrics`
   - Tags: `tonypi`, `performance`, `monitoring`
3. **Variables** tab → Add variable:
   - Name: `robot_id`
   - Type: Query
   - Data source: TonyPi InfluxDB
   - Query:
     ```flux
     import "influxdata/influxdb/schema"
     schema.tagValues(bucket: "robot_data", tag: "robot_id")
     ```
   - This allows filtering by specific robot
4. **Time options**:
   - Auto refresh: `5s`
   - Time range: `Last 1 hour`
5. Click **"Save dashboard"**

### Step 5: Get Embed URL

1. Click **"Share"** button (top right)
2. Select **"Embed"** tab
3. Toggle **"Lock time range"** (optional)
4. Copy the iframe URL
5. Update `frontend/src/pages/Monitoring.tsx`:
   ```tsx
   <iframe
     src="YOUR_EMBED_URL_HERE"
     width="100%"
     height="600"
     allow="fullscreen"
   />
   ```

---

## 📈 Advanced Visualizations

### 1. All Robots Table

Create a table showing all robots:

```flux
from(bucket: "robot_data")
  |> range(start: -5m)
  |> filter(fn: (r) => r["_measurement"] == "robot_status")
  |> filter(fn: (r) => r["_field"] == "system_cpu_percent" or r["_field"] == "system_memory_percent" or r["_field"] == "system_temperature")
  |> last()
  |> pivot(rowKey:["robot_id"], columnKey: ["_field"], valueColumn: "_value")
```

Visualization: **Table**

### 2. Battery Status Bar Chart

```flux
from(bucket: "robot_data")
  |> range(start: -5m)
  |> filter(fn: (r) => r["_measurement"] == "battery")
  |> filter(fn: (r) => r["_field"] == "battery_level")
  |> last()
```

Visualization: **Bar gauge**

### 3. Network Activity Heatmap

```flux
from(bucket: "robot_data")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "robot_status")
  |> filter(fn: (r) => r["robot_id"] == v.robot_id)
  |> aggregateWindow(every: 1m, fn: count)
```

Visualization: **Status history**

---

## 🎨 Dashboard Customization

### Color Schemes
- **CPU**: Blue (#3498db)
- **Memory**: Purple (#9b59b6)
- **Temperature**: 
  - Green (<60°C)
  - Yellow (60-70°C)
  - Red (>70°C)
- **Battery**:
  - Green (>50%)
  - Yellow (20-50%)
  - Red (<20%)

### Panel Types
- **Time series**: For trends over time (CPU, Memory, Temp)
- **Gauge**: For current values (Disk, Battery)
- **Stat**: For single numbers (Uptime, Count)
- **Table**: For multi-robot overview
- **Bar gauge**: For comparison across robots

---

## 🔗 Useful Links

| Purpose | URL |
|---------|-----|
| Grafana UI | http://localhost:3000 |
| InfluxDB UI | http://localhost:8086 |
| Backend API | http://localhost:8000 |
| Frontend | http://localhost:3001 |
| API Docs | http://localhost:8000/docs |

---

## 🐛 Troubleshooting

### No data in panels?
```bash
# Check if data exists in InfluxDB
docker exec -it tonypi_influxdb influx query '
from(bucket: "robot_data")
  |> range(start: -1h)
  |> filter(fn: (r) => r["_measurement"] == "robot_status")
  |> limit(n: 5)
' --org tonypi --token my-super-secret-auth-token

# Make sure robot client is running and sending data
```

### Data source connection failed?
- Verify URL is `http://influxdb:8086` (internal Docker network)
- Check token: `my-super-secret-auth-token`
- Check organization: `tonypi`
- Check bucket: `robot_data`

### Panels show "No data"?
- Check time range (top right) - try "Last 1 hour"
- Verify measurement name matches exactly: `robot_status`
- Check if robot is actively sending data

---

## 📦 Export Dashboard

To save and share your dashboard:

1. Dashboard settings (⚙️) → **JSON Model**
2. Copy JSON
3. Save to file: `grafana_dashboard.json`
4. To import: **+** → **Import** → Paste JSON

---

## Summary

**What to Display:**
1. ✅ CPU usage over time
2. ✅ Memory usage over time  
3. ✅ Temperature with alerts
4. ✅ Disk usage gauge
5. ✅ Multi-robot table
6. ✅ Battery levels
7. ✅ System uptime

**All data is already in InfluxDB** - just need to create the Grafana panels!
