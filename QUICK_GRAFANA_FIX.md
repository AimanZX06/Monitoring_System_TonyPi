# Quick Grafana Fix Guide

## 🚀 Quick Fix (5 Minutes)

### **Step 1: Update Configuration**

I've already updated `docker-compose.yml` with the correct Grafana settings. The changes include:
- ✅ Anonymous access properly configured
- ✅ Embedding enabled
- ✅ Cookie settings for iframe embedding
- ✅ Public dashboards enabled

### **Step 2: Restart Grafana**

**On Windows:**
```cmd
fix_grafana.bat
```

**Or manually:**
```bash
docker-compose stop grafana
docker-compose rm -f grafana
docker-compose up -d grafana
```

### **Step 3: Verify Setup**

1. **Check Grafana is running:**
   ```bash
   docker-compose ps grafana
   ```

2. **Test Grafana health:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return: `{"commit":"","database":"ok","version":"10.0.0"}`

3. **Access Grafana:**
   - Open: http://localhost:3000
   - Login: `admin` / `admin`
   - Check dashboard exists: **Dashboards** → **Browse** → **TonyPi Robot Monitoring**

4. **Test anonymous access:**
   - Open incognito/private window
   - Go to: http://localhost:3000
   - Should access without login (as Viewer)

5. **Test panel embedding:**
   - Open: http://localhost:3000/d-solo/tonypi-robot-monitoring/tonypi-robot-monitoring?panelId=1&from=now-15m&to=now
   - Should show CPU Usage panel

### **Step 4: Test Frontend**

1. **Open frontend:** http://localhost:3001
2. **Go to Monitoring tab**
3. **Scroll to "Advanced Analytics" section**
4. **Panels should now load without errors!**

---

## 🔍 If Still Not Working

### **Check 1: Dashboard Exists**

```bash
# Test dashboard API
curl -u admin:admin http://localhost:3000/api/dashboards/uid/tonypi-robot-monitoring
```

If this returns 404, the dashboard wasn't provisioned. Fix:

1. Login to Grafana
2. Go to **Dashboards** → **Import**
3. Upload: `grafana/provisioning/dashboards/tonypi-dashboard.json`
4. Set UID to: `tonypi-robot-monitoring`
5. Click **Import**

### **Check 2: Anonymous Access**

1. Login to Grafana
2. Go to **Configuration** → **Users and access** → **Settings**
3. Verify:
   - ✅ Anonymous access: **Enabled**
   - ✅ Organization role: **Viewer**

### **Check 3: Panel IDs**

1. Open dashboard in Grafana
2. Click on first panel → **Edit**
3. Check **Panel ID** (should be 1)
4. Verify all panels have IDs 1-8

If panel IDs are different, update `frontend/src/pages/Monitoring.tsx` with correct IDs.

### **Check 4: Browser Console**

1. Open frontend: http://localhost:3001
2. Press **F12** → **Console** tab
3. Look for errors related to Grafana
4. Check **Network** tab for failed requests

---

## 📋 Configuration Summary

**What was fixed in docker-compose.yml:**

```yaml
environment:
  # Anonymous access
  - GF_AUTH_ANONYMOUS_ENABLED=true
  - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
  - GF_AUTH_ANONYMOUS_ORG_NAME=Main Org.
  
  # Embedding
  - GF_SECURITY_ALLOW_EMBEDDING=true
  - GF_SECURITY_COOKIE_SAMESITE=none
  - GF_SECURITY_COOKIE_SECURE=false
  
  # Server
  - GF_SERVER_ROOT_URL=http://localhost:3000
  
  # Public dashboards
  - GF_PUBLIC_DASHBOARDS_ENABLED=true
```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Grafana accessible at http://localhost:3000
2. ✅ Can access dashboard without login (incognito)
3. ✅ Panel URLs work directly in browser
4. ✅ Frontend shows panels without "Unauthorized" error
5. ✅ No "Panel not found" errors in console
6. ✅ Panels display data (if robots are connected)

---

## 🆘 Still Having Issues?

See detailed guide: `GRAFANA_SETUP_FIX.md`

Or check logs:
```bash
docker-compose logs grafana --tail 100
```














