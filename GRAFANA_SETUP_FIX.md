# Grafana Setup Fix - Resolving "Panel Not Found" and "Unauthorized" Errors

This guide will help you fix the Grafana integration issues in the frontend.

---

## 🔍 Problem Diagnosis

**Symptoms:**
- "Panel with id not found" error
- "Unauthorized" popup
- Grafana panels not loading in frontend

**Root Causes:**
1. Grafana authentication not properly configured for anonymous access
2. Dashboard not properly provisioned
3. Panel embedding requires authentication
4. CORS/embedding security settings

---

## ✅ Solution: Complete Grafana Setup

### **Step 1: Verify Grafana is Running**

```bash
# Check if Grafana container is running
docker-compose ps grafana

# Check Grafana logs
docker-compose logs grafana --tail 50

# Test Grafana accessibility
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{"commit":"","database":"ok","version":"10.0.0"}
```

---

### **Step 2: Access Grafana and Verify Dashboard**

1. **Open Grafana in browser:**
   ```
   http://localhost:3000
   ```

2. **Login:**
   - Username: `admin`
   - Password: `admin`

3. **Check if dashboard exists:**
   - Go to **Dashboards** → **Browse**
   - Look for **"TonyPi Robot Monitoring"**
   - If it doesn't exist, the provisioning might have failed

4. **Verify Dashboard UID:**
   - Open the dashboard
   - Check the URL: should be `http://localhost:3000/d/tonypi-robot-monitoring`
   - If UID is different, note it down

---

### **Step 3: Fix Grafana Configuration**

Update `docker-compose.yml` with proper Grafana settings:

```yaml
grafana:
  image: grafana/grafana:10.0.0
  container_name: tonypi_grafana
  restart: unless-stopped
  ports:
    - "3000:3000"
  volumes:
    - ./grafana/data:/var/lib/grafana
    - ./grafana/provisioning:/etc/grafana/provisioning
  environment:
    - GF_SECURITY_ADMIN_USER=${GRAFANA_USER:-admin}
    - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    # Enable anonymous access
    - GF_AUTH_ANONYMOUS_ENABLED=true
    - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
    - GF_AUTH_ANONYMOUS_ORG_NAME=Main Org.
    # Allow embedding
    - GF_SECURITY_ALLOW_EMBEDDING=true
    # Disable login form (optional, for anonymous access)
    - GF_AUTH_DISABLE_LOGIN_FORM=false
    # Cookie settings for embedding
    - GF_SECURITY_COOKIE_SAMESITE=none
    - GF_SECURITY_COOKIE_SECURE=false
    # CORS settings
    - GF_SERVER_ROOT_URL=http://localhost:3000
    # Enable public dashboards (for embedding)
    - GF_PUBLIC_DASHBOARDS_ENABLED=true
  depends_on:
    - influxdb
    - postgres
  networks:
    - tonypi_network
```

---

### **Step 4: Create Grafana Configuration File**

Create `grafana/config/grafana.ini` (optional, but recommended):

```ini
[server]
root_url = http://localhost:3000

[security]
allow_embedding = true
cookie_samesite = none
cookie_secure = false

[auth.anonymous]
enabled = true
org_role = Viewer
org_name = Main Org.

[auth]
disable_login_form = false
```

**Update docker-compose.yml to mount this config:**

```yaml
grafana:
  volumes:
    - ./grafana/data:/var/lib/grafana
    - ./grafana/provisioning:/etc/grafana/provisioning
    - ./grafana/config/grafana.ini:/etc/grafana/grafana.ini  # Add this line
```

---

### **Step 5: Restart Grafana**

```bash
# Stop Grafana
docker-compose stop grafana

# Remove Grafana container (optional, to clear cache)
docker-compose rm -f grafana

# Start Grafana with new configuration
docker-compose up -d grafana

# Check logs
docker-compose logs grafana --tail 50
```

---

### **Step 6: Verify Anonymous Access**

1. **Open Grafana in incognito/private window:**
   ```
   http://localhost:3000
   ```

2. **You should be able to access without login** (as Viewer)

3. **Test dashboard access:**
   ```
   http://localhost:3000/d/tonypi-robot-monitoring
   ```

4. **Test panel embedding:**
   ```
   http://localhost:3000/d-solo/tonypi-robot-monitoring/tonypi-robot-monitoring?panelId=1&from=now-15m&to=now
   ```

---

### **Step 7: Fix Frontend Panel URLs**

If the dashboard UID is different, update `frontend/src/pages/Monitoring.tsx`:

**Current code uses:**
```typescript
buildGrafanaPanelUrl('tonypi-robot-monitoring', 1, {...})
```

**If your dashboard UID is different, update it:**

1. Find the correct UID from Grafana dashboard URL
2. Update all `buildGrafanaPanelUrl` calls in `Monitoring.tsx`

**Or create a constant:**

```typescript
// In frontend/src/utils/grafana.ts
export const GRAFANA_DASHBOARD_UID = 'tonypi-robot-monitoring'; // Update this if needed
```

---

### **Step 8: Alternative Solution - Use Authentication Token**

If anonymous access doesn't work, use API key authentication:

#### **Step 8.1: Create API Key in Grafana**

1. Login to Grafana: http://localhost:3000
2. Go to **Configuration** → **API Keys**
3. Click **Add API Key**
4. Name: `Frontend Access`
5. Role: `Viewer`
6. Time to live: `No expiration` (or set expiration)
7. Click **Add**
8. **Copy the API key** (you'll only see it once!)

#### **Step 8.2: Update Frontend to Use API Key**

Update `frontend/src/utils/grafana.ts`:

```typescript
// Add API key constant
const GRAFANA_API_KEY = process.env.REACT_APP_GRAFANA_API_KEY || '';

// Update buildGrafanaPanelUrl function
export const buildGrafanaPanelUrl = (
  dashboardUid: string,
  panelId: number,
  options: {
    robotId?: string;
    refresh?: string;
    theme?: 'light' | 'dark';
  } = {}
): string => {
  const params = new URLSearchParams({
    panelId: panelId.toString(),
    from: 'now-15m',
    to: 'now',
    refresh: options.refresh || '5s',
    theme: options.theme || 'light',
  });

  // Add API key if available
  if (GRAFANA_API_KEY) {
    params.append('kiosk', 'tv');
    // Note: API key should be added via Authorization header in iframe
    // For iframe embedding, we need to use anonymous access or public dashboard
  }

  return `${GRAFANA_URL}/d-solo/${dashboardUid}/${dashboardUid}?${params.toString()}`;
};
```

**However, for iframe embedding, API keys don't work directly. Use anonymous access instead.**

---

### **Step 9: Enable Public Dashboard (Grafana 10+)**

If you're using Grafana 10+, you can create a public dashboard:

1. **In Grafana, open the dashboard**
2. **Click the share icon** (top right)
3. **Go to "Public dashboard" tab**
4. **Click "Generate public URL"**
5. **Copy the public URL**

**Update frontend to use public dashboard URL:**

```typescript
// In frontend/src/utils/grafana.ts
export const buildGrafanaPanelUrl = (
  dashboardUid: string,
  panelId: number,
  options: {
    robotId?: string;
    refresh?: string;
    theme?: 'light' | 'dark';
  } = {}
): string => {
  // Use public dashboard URL if available
  const publicUrl = process.env.REACT_APP_GRAFANA_PUBLIC_DASHBOARD_URL;
  
  if (publicUrl) {
    const params = new URLSearchParams({
      panelId: panelId.toString(),
      from: 'now-15m',
      to: 'now',
      refresh: options.refresh || '5s',
    });
    return `${publicUrl}?${params.toString()}`;
  }

  // Fallback to regular dashboard
  const params = new URLSearchParams({
    panelId: panelId.toString(),
    from: 'now-15m',
    to: 'now',
    refresh: options.refresh || '5s',
    theme: options.theme || 'light',
  });

  return `${GRAFANA_URL}/d-solo/${dashboardUid}/${dashboardUid}?${params.toString()}`;
};
```

---

### **Step 10: Verify Panel IDs**

Check that panel IDs in the dashboard match what frontend expects:

1. **Open dashboard in Grafana**
2. **Click on each panel** → **Edit**
3. **Check Panel ID** (shown in panel settings)
4. **Verify IDs are 1-8** (as expected by frontend)

**If panel IDs are different:**

Update `frontend/src/pages/Monitoring.tsx` with correct panel IDs:

```typescript
// Example: If panel IDs are 10, 11, 12, etc.
<GrafanaPanel
  panelUrl={buildGrafanaPanelUrl('tonypi-robot-monitoring', 10, {...})}
/>
```

---

### **Step 11: Test Panel Embedding Directly**

Test if panels can be embedded by accessing URLs directly:

**Panel 1 (CPU Usage):**
```
http://localhost:3000/d-solo/tonypi-robot-monitoring/tonypi-robot-monitoring?panelId=1&from=now-15m&to=now&refresh=5s&theme=light
```

**Panel 2 (Memory Usage):**
```
http://localhost:3000/d-solo/tonypi-robot-monitoring/tonypi-robot-monitoring?panelId=2&from=now-15m&to=now&refresh=5s&theme=light
```

**If these URLs work in browser but not in iframe:**
- It's a CORS/embedding issue
- Check Grafana security settings

---

### **Step 12: Final Verification**

1. **Restart all services:**
   ```bash
   docker-compose restart
   ```

2. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

3. **Test frontend:**
   - Open: http://localhost:3001
   - Go to **Monitoring** tab
   - Scroll to **Advanced Analytics** section
   - Panels should load without errors

4. **Check browser console:**
   - Press `F12` → **Console** tab
   - Look for any errors
   - Check network tab for failed requests

---

## 🔧 Troubleshooting

### **Issue: Still Getting "Unauthorized"**

**Solution 1: Check Grafana logs**
```bash
docker-compose logs grafana | grep -i "auth\|anonymous\|embed"
```

**Solution 2: Verify anonymous access is enabled**
1. Login to Grafana
2. Go to **Configuration** → **Users and access** → **Settings**
3. Check **"Anonymous access"** is enabled
4. Role should be **"Viewer"**

**Solution 3: Check if dashboard exists**
```bash
# Access Grafana API
curl -u admin:admin http://localhost:3000/api/dashboards/uid/tonypi-robot-monitoring
```

### **Issue: "Panel with id not found"**

**Solution 1: Verify panel IDs**
- Open dashboard in Grafana
- Check actual panel IDs
- Update frontend if different

**Solution 2: Check dashboard provisioning**
```bash
# Check Grafana logs for provisioning errors
docker-compose logs grafana | grep -i "provision\|dashboard"
```

**Solution 3: Manually import dashboard**
1. In Grafana, go to **Dashboards** → **Import**
2. Upload `grafana/provisioning/dashboards/tonypi-dashboard.json`
3. Set UID to: `tonypi-robot-monitoring`

### **Issue: Panels Load but Show No Data**

**Solution: Check InfluxDB connection**
1. In Grafana, go to **Configuration** → **Data sources**
2. Click on **InfluxDB**
3. Click **"Test"** button
4. Should show "Data source is working"

**If test fails:**
- Check InfluxDB is running: `docker-compose ps influxdb`
- Verify token in datasource configuration
- Check InfluxDB logs: `docker-compose logs influxdb`

---

## 📝 Quick Fix Checklist

- [ ] Grafana container is running
- [ ] Can access Grafana at http://localhost:3000
- [ ] Dashboard "TonyPi Robot Monitoring" exists
- [ ] Dashboard UID is "tonypi-robot-monitoring"
- [ ] Anonymous access is enabled in Grafana
- [ ] `GF_SECURITY_ALLOW_EMBEDDING=true` in docker-compose.yml
- [ ] `GF_AUTH_ANONYMOUS_ENABLED=true` in docker-compose.yml
- [ ] Panel IDs 1-8 exist in dashboard
- [ ] InfluxDB datasource is configured and working
- [ ] Frontend can access Grafana (no CORS errors)
- [ ] Browser console shows no errors

---

## 🎯 Recommended Configuration

**For Development (Current Setup):**
- Anonymous access enabled
- Embedding allowed
- No authentication required

**For Production:**
- Use authentication
- Create public dashboards for embedding
- Or use API keys with proper security

---

## 📞 Still Having Issues?

1. **Check all service logs:**
   ```bash
   docker-compose logs --tail=100
   ```

2. **Verify network connectivity:**
   ```bash
   docker-compose exec frontend ping grafana
   ```

3. **Test Grafana API:**
   ```bash
   curl http://localhost:3000/api/health
   curl -u admin:admin http://localhost:3000/api/dashboards/uid/tonypi-robot-monitoring
   ```

4. **Check browser network tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Look for failed requests to Grafana
   - Check response status codes

---

**Last Updated:** December 2025



