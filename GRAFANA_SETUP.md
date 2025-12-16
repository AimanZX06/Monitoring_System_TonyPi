# Grafana Integration Guide - ✅ FULLY INTEGRATED IN FRONTEND

> **🎉 UPDATE**: Grafana is now fully embedded in React frontend at http://localhost:3001/monitoring  
> **No need to access Grafana website separately!**

**Status:** Grafana dashboards auto-provisioned and embedded  
**Frontend Access:** http://localhost:3001/monitoring (scroll to "Advanced Analytics")  
**Direct Grafana (Optional):** http://localhost:3000 (admin / admin)

---

## ✅ Latest Updates (Grafana in Frontend)

### **1. Pre-configured Dashboard Created**
- Dashboard automatically provisioned on startup
- 8 comprehensive panels covering all sensors
- Real-time updates every 5 seconds

### **2. Embedded in React Frontend**
All Grafana panels now appear in the Monitoring page:
- CPU & Memory Usage Chart
- CPU Temperature Gauge
- Battery Level Gauge
- Accelerometer Data (X, Y, Z)
- Gyroscope Data (X, Y, Z)
- Distance Sensor
- Light Level Gauge
- Servo Angle Chart

### **3. Files Added**
- `grafana/provisioning/dashboards/dashboards.yml` - Provider config
- `grafana/provisioning/dashboards/tonypi-dashboard.json` - Dashboard definition
- `GRAFANA_INTEGRATION_COMPLETE.md` - Full documentation

### **4. How to Use**
Simply visit: **http://localhost:3001/monitoring**
Scroll down to the "Advanced Analytics" section - all panels are there!

---

# Original Grafana Setup (For Reference)

**Status:** Grafana is now configured and embedded in the frontend  
**Access:** http://localhost:3000  
**Default Login:** admin / admin

---

## ✅ What Was Fixed (Historical)

### **1. Grafana Container Started**
- Grafana was defined in docker-compose.yml but wasn't running
- Started with: `docker compose up -d grafana`

### **2. Embedding Configuration Added**
Added these environment variables to allow embedding in your frontend:

```yaml
- GF_AUTH_ANONYMOUS_ENABLED=true          # Allow anonymous viewing
- GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer      # Anonymous users can view
- GF_SECURITY_ALLOW_EMBEDDING=true       # Enable iframe embedding
- GF_SECURITY_COOKIE_SAMESITE=none       # Allow cross-site cookies
```

### **3. Frontend iframe Fixed**
- Removed restrictive `sandbox=""` attribute that was blocking content
- Added Grafana embed section to Monitoring page
- Added link to open full Grafana dashboard

---

## 🚀 How to Use Grafana

### **Step 1: Access Grafana**
Open in your browser:
```
http://localhost:3000
```

**Login credentials:**
- Username: `admin`
- Password: `admin`

(You'll be prompted to change password on first login - you can skip this)

---

### **Step 2: Add InfluxDB Data Source**

1. Click **⚙️ Configuration** → **Data Sources**
2. Click **Add data source**
3. Select **InfluxDB**
4. Configure:
   - **Name:** TonyPi InfluxDB
   - **Query Language:** Flux
   - **URL:** `http://influxdb:8086`
   - **Auth:** Turn OFF all auth toggles
   - **Organization:** `tonypi`
   - **Token:** `my-super-secret-auth-token`
   - **Default Bucket:** `robot_data`
5. Click **Save & Test** - should show "✅ datasource is working"

---

### **Step 3: Create a Dashboard**

#### **Option A: Quick Start - Import Dashboard**

1. Click **➕** → **Import**
2. Paste this dashboard JSON:

```json
{
  "dashboard": {
    "title": "Robot Monitoring",
    "uid": "robot-monitoring",
    "panels": [
      {
        "id": 1,
        "title": "CPU Usage",
        "type": "timeseries",
        "targets": [
          {
            "query": "from(bucket: \"robot_data\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r[\"_measurement\"] == \"robot_status\")\n  |> filter(fn: (r) => r[\"_field\"] == \"system_cpu_percent\")\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> yield(name: \"mean\")",
            "refId": "A"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 }
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "timeseries",
        "targets": [
          {
            "query": "from(bucket: \"robot_data\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r[\"_measurement\"] == \"robot_status\")\n  |> filter(fn: (r) => r[\"_field\"] == \"system_memory_percent\")\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> yield(name: \"mean\")",
            "refId": "A"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 }
      },
      {
        "id": 3,
        "title": "Temperature",
        "type": "gauge",
        "targets": [
          {
            "query": "from(bucket: \"robot_data\")\n  |> range(start: -1m)\n  |> filter(fn: (r) => r[\"_measurement\"] == \"robot_status\")\n  |> filter(fn: (r) => r[\"_field\"] == \"system_temperature\")\n  |> last()",
            "refId": "A"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
        "options": {
          "min": 0,
          "max": 100,
          "thresholds": [
            { "value": 0, "color": "green" },
            { "value": 60, "color": "yellow" },
            { "value": 75, "color": "red" }
          ]
        }
      },
      {
        "id": 4,
        "title": "Disk Usage",
        "type": "gauge",
        "targets": [
          {
            "query": "from(bucket: \"robot_data\")\n  |> range(start: -1m)\n  |> filter(fn: (r) => r[\"_measurement\"] == \"robot_status\")\n  |> filter(fn: (r) => r[\"_field\"] == \"system_disk_usage\")\n  |> last()",
            "refId": "A"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
        "options": {
          "min": 0,
          "max": 100,
          "thresholds": [
            { "value": 0, "color": "green" },
            { "value": 75, "color": "yellow" },
            { "value": 90, "color": "red" }
          ]
        }
      }
    ],
    "refresh": "5s",
    "time": { "from": "now-15m", "to": "now" }
  }
}
```

3. Click **Load**
4. Click **Import**

#### **Option B: Create Manually**

1. Click **➕** → **Dashboard** → **Add new panel**
2. In the query editor, select **InfluxDB** as data source
3. Switch to **Code** mode
4. Enter this Flux query for CPU:
```flux
from(bucket: "robot_data")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "robot_status")
  |> filter(fn: (r) => r["_field"] == "system_cpu_percent")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> yield(name: "mean")
```
5. Set panel title: "CPU Usage"
6. Click **Apply**
7. Repeat for Memory, Disk, Temperature using respective fields

---

### **Step 4: Embed in Frontend**

Once you have a dashboard:

1. Open the dashboard in Grafana
2. Click **Share** button (top right)
3. Go to **Embed** tab
4. Copy the iframe URL
5. Update `Monitoring.tsx` with your panel URL:

```typescript
<iframe
  src="YOUR_GRAFANA_PANEL_URL_HERE"
  width="100%"
  height="500"
  style={{ border: 0 }}
  allow="fullscreen"
/>
```

**Or** use the existing placeholder - it will show Grafana's homepage until you configure the URL.

---

## 📊 Current Integration

### **Where Grafana Appears:**

**Performance Tab** (`http://localhost:3001` → Performance):
- Embedded Grafana section added at the bottom
- Default shows Grafana homepage (needs dashboard URL)
- Link to open full Grafana in new tab
- Helper text with login instructions

---

## 🔧 Grafana Configuration Details

### **Container Settings:**
```yaml
ports:
  - "3000:3000"          # Accessible at localhost:3000

environment:
  - GF_AUTH_ANONYMOUS_ENABLED=true           # No login required for viewing
  - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer       # Anonymous = Viewer role
  - GF_SECURITY_ALLOW_EMBEDDING=true        # Allow iframe embedding
  - GF_SECURITY_COOKIE_SAMESITE=none        # Cross-site cookies allowed
```

### **Why These Settings?**
- **Anonymous Access:** Allows viewing without login (but still need login for editing)
- **Allow Embedding:** Removes X-Frame-Options header that blocks iframes
- **Cookie SameSite:** Allows authentication cookies in cross-origin iframes

---

## 📝 Available InfluxDB Measurements

Query these from Grafana:

### **robot_status** measurement:
- `system_cpu_percent` - CPU usage %
- `system_memory_percent` - Memory usage %
- `system_disk_usage` - Disk usage %
- `system_temperature` - CPU temperature °C
- `system_uptime` - System uptime in seconds
- `system_platform` - Platform name

### **Tags:**
- `robot_id` - Unique robot identifier
- `status_type` - Status type

### **Example Queries:**

**Latest CPU for specific robot:**
```flux
from(bucket: "robot_data")
  |> range(start: -1m)
  |> filter(fn: (r) => r["_measurement"] == "robot_status")
  |> filter(fn: (r) => r["robot_id"] == "tonypi_raspberrypi")
  |> filter(fn: (r) => r["_field"] == "system_cpu_percent")
  |> last()
```

**Average temperature over 1 hour:**
```flux
from(bucket: "robot_data")
  |> range(start: -1h)
  |> filter(fn: (r) => r["_measurement"] == "robot_status")
  |> filter(fn: (r) => r["_field"] == "system_temperature")
  |> aggregateWindow(every: 5m, fn: mean)
```

---

## 🎨 Panel Types to Use

### **Time Series (Line Chart)**
Best for: CPU, Memory over time
- Shows trends
- Good for historical data
- Auto-updates with refresh interval

### **Gauge**
Best for: Current values (Temperature, Disk)
- Shows single latest value
- Color-coded thresholds
- Easy to read at a glance

### **Stat (Single Value)**
Best for: Current status
- Large number display
- Spark line option
- Color thresholds

### **Bar Chart**
Best for: Comparing multiple robots
- Side-by-side comparison
- Good for summary data

---

## 🔍 Troubleshooting

### **Issue: "Datasource is not working"**
**Solution:**
- Verify InfluxDB is running: `docker compose ps influxdb`
- Check URL is `http://influxdb:8086` (not localhost)
- Verify token: `my-super-secret-auth-token`
- Verify org: `tonypi`
- Verify bucket: `robot_data`

### **Issue: "No data in panels"**
**Solution:**
- Ensure Raspberry Pi client is running and sending data
- Check time range (try "Last 5 minutes")
- Verify measurement name: `robot_status`
- Check field names match exactly
- Run query in InfluxDB UI to verify data exists

### **Issue: "Refused to connect" in iframe**
**Solution:**
- Already fixed with `GF_SECURITY_ALLOW_EMBEDDING=true`
- Restart Grafana: `docker compose restart grafana`
- Clear browser cache

### **Issue: "Cannot login to Grafana"**
**Solution:**
- Default: admin / admin
- Reset password: Delete `./grafana/data/grafana.db` and restart
- Check environment variables in docker-compose.yml

---

## 📱 Quick Access Links

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3001 | N/A |
| **Grafana** | http://localhost:3000 | admin / admin |
| **InfluxDB** | http://localhost:8086 | admin / adminpass |
| **Backend API** | http://localhost:8000 | N/A |

---

## ✅ What's Working Now

1. ✅ Grafana container running
2. ✅ Embedding enabled (no X-Frame-Options block)
3. ✅ Anonymous access enabled
4. ✅ Grafana section in Performance tab
5. ✅ Link to open full Grafana
6. ✅ Ready to create dashboards

---

## 🎯 Next Steps

1. **Login to Grafana:** http://localhost:3000 (admin/admin)
2. **Add InfluxDB data source** (see Step 2 above)
3. **Create dashboard** (import JSON or create manually)
4. **Get embed URL** from Share → Embed
5. **Update Monitoring.tsx** with your panel URL
6. **Enjoy embedded Grafana dashboards!** 🎉

---

## 💡 Pro Tips

- **Auto-refresh:** Set dashboard refresh to 5s for real-time monitoring
- **Time range:** Use "Last 15 minutes" for live data
- **Variables:** Add `$robot_id` variable to filter by robot
- **Alerts:** Configure email/Slack alerts for threshold breaches
- **Snapshots:** Share dashboard snapshots with team
- **Playlists:** Rotate between multiple dashboards automatically

---

**Grafana is now ready to use! Open http://localhost:3001, go to Performance tab, and scroll down to see the embedded Grafana section.** 📊✨
