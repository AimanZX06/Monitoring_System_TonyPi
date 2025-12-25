# Fix "Dashboard Not Found" Error

The "Dashboard not found" error means Grafana can't find the dashboard with UID `tonypi-robot-monitoring`. Here's how to fix it.

---

## 🚀 Quick Fix (2 Methods)

### **Method 1: Manual Import (Fastest - 2 minutes)**

1. **Open Grafana:**
   ```
   http://localhost:3000
   ```
   Login: `admin` / `admin`

2. **Import Dashboard:**
   - Click **"+"** icon (top left) → **"Import"**
   - OR go to **Dashboards** → **Import**

3. **Upload Dashboard File:**
   - Click **"Upload JSON file"**
   - Navigate to: `C:\Users\aiman\Projects\Monitoring_System_TonyPi\grafana\provisioning\dashboards\tonypi-dashboard.json`
   - Select the file and click **"Open"**

4. **Set Dashboard UID:**
   - In the import screen, find **"Unique identifier (uid)"** field
   - Set it to: `tonypi-robot-monitoring`
   - **IMPORTANT:** This must match exactly!

5. **Click "Import"**

6. **Verify:**
   - Dashboard should open automatically
   - URL should be: `http://localhost:3000/d/tonypi-robot-monitoring`
   - You should see 8 panels

7. **Test Frontend:**
   - Open: http://localhost:3001
   - Go to **Monitoring** tab
   - Scroll to **Advanced Analytics**
   - Panels should now load!

---

### **Method 2: Fix Provisioning (Permanent Fix)**

If provisioning isn't working, fix it:

#### **Step 1: Check Dashboard File Location**

Verify the file exists:
```bash
# Check if file exists
dir grafana\provisioning\dashboards\tonypi-dashboard.json
```

#### **Step 2: Check Provisioning Configuration**

Verify `grafana/provisioning/dashboards/dashboards.yml` exists and has correct path:
```yaml
apiVersion: 1

providers:
  - name: 'TonyPi Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
      foldersFromFilesStructure: false
```

#### **Step 3: Restart Grafana**

```bash
# Stop Grafana
docker-compose stop grafana

# Remove container (clears cache)
docker-compose rm -f grafana

# Start Grafana
docker-compose up -d grafana

# Wait 10 seconds
timeout /t 10

# Check logs for provisioning
docker-compose logs grafana | findstr /i "provision dashboard"
```

#### **Step 4: Verify Dashboard Appeared**

1. Open Grafana: http://localhost:3000
2. Go to **Dashboards** → **Browse**
3. Look for **"TonyPi Robot Monitoring"**
4. If it appears, provisioning worked!

---

## 🔍 Verify Dashboard Exists

### **Check via API:**

```bash
# Test if dashboard exists
curl -u admin:admin http://localhost:3000/api/dashboards/uid/tonypi-robot-monitoring
```

**If it returns 404:**
- Dashboard doesn't exist → Use Method 1 to import

**If it returns JSON:**
- Dashboard exists → Check frontend configuration

---

## 🐛 Troubleshooting

### **Issue: File Not Found When Importing**

**Solution:**
1. Check file path is correct
2. File should be at: `grafana/provisioning/dashboards/tonypi-dashboard.json`
3. If file doesn't exist, check if it was deleted or moved

### **Issue: Import Fails with Error**

**Common Errors:**

1. **"Invalid JSON"**
   - File might be corrupted
   - Check file opens in text editor
   - Verify it's valid JSON

2. **"Datasource not found"**
   - InfluxDB datasource not configured
   - Go to **Configuration** → **Data sources**
   - Verify **InfluxDB** exists and is working

3. **"UID already exists"**
   - Dashboard already exists with different name
   - Either delete old dashboard or use different UID

### **Issue: Dashboard Imports but Panels Show No Data**

**Solution:**
1. Check InfluxDB datasource:
   - Go to **Configuration** → **Data sources**
   - Click **InfluxDB**
   - Click **"Test"** button
   - Should show "Data source is working"

2. Check InfluxDB is running:
   ```bash
   docker-compose ps influxdb
   ```

3. Verify data exists in InfluxDB:
   - Check if robots are connected and sending data
   - Frontend should show data in Performance tab

---

## ✅ Verification Checklist

After fixing, verify:

- [ ] Dashboard exists in Grafana: http://localhost:3000/d/tonypi-robot-monitoring
- [ ] Dashboard UID is exactly: `tonypi-robot-monitoring`
- [ ] All 8 panels are visible
- [ ] Panel IDs are 1-8 (check by editing panels)
- [ ] InfluxDB datasource is configured and working
- [ ] Frontend can access dashboard (no "not found" error)
- [ ] Panels load in frontend Monitoring tab

---

## 📋 Quick Reference

**Dashboard File Location:**
```
grafana/provisioning/dashboards/tonypi-dashboard.json
```

**Dashboard UID:**
```
tonypi-robot-monitoring
```

**Panel IDs:**
- Panel 1: CPU & Memory Usage
- Panel 2: CPU Temperature
- Panel 3: Battery Level
- Panel 4: Accelerometer
- Panel 5: Gyroscope
- Panel 6: Distance Sensor
- Panel 7: Light Level
- Panel 8: Servo Angle

**Grafana URL:**
```
http://localhost:3000
```

**Dashboard Direct URL:**
```
http://localhost:3000/d/tonypi-robot-monitoring
```

---

## 🎯 Recommended: Use Method 1 First

**Method 1 (Manual Import)** is fastest and most reliable:
1. Takes 2 minutes
2. Works immediately
3. No need to restart services
4. Verifies dashboard file is correct

**Then use Method 2** to fix provisioning for future restarts.

---

## 📞 Still Not Working?

1. **Check Grafana logs:**
   ```bash
   docker-compose logs grafana --tail 50
   ```

2. **Verify file permissions:**
   - File should be readable
   - Check if file exists in container:
   ```bash
   docker-compose exec grafana ls -la /etc/grafana/provisioning/dashboards/
   ```

3. **Test dashboard API:**
   ```bash
   curl -u admin:admin http://localhost:3000/api/dashboards/uid/tonypi-robot-monitoring
   ```

4. **Check browser console:**
   - Open frontend: http://localhost:3001
   - Press F12 → Console tab
   - Look for errors

---

**Last Updated:** December 2025






