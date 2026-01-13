# Fix Grafana Incognito Access Issue

If you can't access Grafana in incognito mode, here's how to fix it.

---

## 🔍 Problem: Can't Access in Incognito

**Symptoms:**
- Can't access Grafana in incognito/private window
- Shows login page or error
- Anonymous access not working

**Root Cause:**
- Anonymous access might not be properly configured
- Grafana version might have bugs
- Configuration not applied correctly

---

## ✅ Solution 1: Fix Anonymous Access Configuration

### **Step 1: Update docker-compose.yml**

Make sure anonymous access is properly configured:

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
    # Anonymous access - MUST be enabled
    - GF_AUTH_ANONYMOUS_ENABLED=true
    - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
    - GF_AUTH_ANONYMOUS_ORG_NAME=Main Org.
    # Important: Allow anonymous access to work
    - GF_AUTH_ANONYMOUS_HIDE_VERSION=true
    # Embedding
    - GF_SECURITY_ALLOW_EMBEDDING=true
    - GF_SECURITY_COOKIE_SAMESITE=none
    - GF_SECURITY_COOKIE_SECURE=false
    # Server
    - GF_SERVER_ROOT_URL=http://localhost:3000
    # Public dashboards
    - GF_PUBLIC_DASHBOARDS_ENABLED=true
    # Keep login available
    - GF_AUTH_DISABLE_LOGIN_FORM=false
```

### **Step 2: Restart Grafana**

```bash
docker-compose stop grafana
docker-compose rm -f grafana
docker-compose up -d grafana
```

### **Step 3: Test Incognito Access**

1. Open incognito window
2. Go to: http://localhost:3000
3. Should access without login (as Viewer)

---

## ✅ Solution 2: Update Grafana (Recommended)

If there's an update available, updating might fix the issue.

### **Check Current Version**

```bash
docker-compose exec grafana grafana-server -v
```

### **Update to Latest Version**

**Option A: Update docker-compose.yml**

Change the image version:

```yaml
grafana:
  image: grafana/grafana:latest  # or specific version like grafana/grafana:11.0.0
```

**Option B: Use Latest Stable**

Check latest version at: https://hub.docker.com/r/grafana/grafana/tags

Then update:

```yaml
grafana:
  image: grafana/grafana:11.0.0  # Replace with latest version
```

### **After Updating:**

```bash
# Pull new image
docker-compose pull grafana

# Stop and remove old container
docker-compose stop grafana
docker-compose rm -f grafana

# Start with new version
docker-compose up -d grafana

# Wait for startup
timeout /t 15

# Test access
curl http://localhost:3000/api/health
```

---

## ✅ Solution 3: Verify Anonymous Access in Grafana UI

Even if you can't access in incognito, you can configure it via normal login:

### **Step 1: Login Normally**

1. Go to: http://localhost:3000
2. Login: `admin` / `admin` (or your password)

### **Step 2: Configure Anonymous Access**

1. Click **Configuration** (gear icon, left sidebar)
2. Go to **Users and access** → **Settings**
3. Find **"Anonymous access"** section
4. Enable it:
   - ✅ **Enable anonymous access**: ON
   - **Organization role**: Viewer
   - **Organization name**: Main Org.
5. Click **Save**

### **Step 3: Test Incognito**

1. Open incognito window
2. Go to: http://localhost:3000
3. Should now work without login

---

## ✅ Solution 4: Complete Reset + Update

If nothing works, do a complete reset with update:

### **Step 1: Backup (Optional)**

```bash
# Backup Grafana data (if you have important dashboards)
xcopy grafana\data grafana\data_backup /E /I
```

### **Step 2: Update docker-compose.yml**

Update Grafana version to latest:

```yaml
grafana:
  image: grafana/grafana:latest  # or grafana/grafana:11.0.0
```

### **Step 3: Reset Everything**

```bash
# Stop Grafana
docker-compose stop grafana

# Remove container
docker-compose rm -f grafana

# Remove data
rmdir /s /q grafana\data

# Pull new image
docker-compose pull grafana

# Start fresh
docker-compose up -d grafana

# Wait 20 seconds
timeout /t 20
```

### **Step 4: Configure**

1. Go to: http://localhost:3000
2. Login: `admin` / `admin`
3. Configure anonymous access (Solution 3, Step 2)
4. Import dashboard: `import_dashboard.bat`

---

## 🔍 Troubleshooting

### **Check 1: Is Anonymous Access Actually Enabled?**

```bash
# Check Grafana logs
docker-compose logs grafana | findstr /i "anonymous"
```

Should see: `auth.anonymous enabled=true`

### **Check 2: Test API Access**

```bash
# Test without authentication (should work if anonymous enabled)
curl http://localhost:3000/api/health

# Test with authentication
curl -u admin:admin http://localhost:3000/api/user
```

### **Check 3: Check Browser Console**

1. Open incognito window
2. Go to: http://localhost:3000
3. Press `F12` → **Console** tab
4. Look for errors

### **Check 4: Verify Environment Variables**

```bash
# Check what Grafana sees
docker-compose exec grafana env | findstr GF_AUTH_ANONYMOUS
```

Should show:
```
GF_AUTH_ANONYMOUS_ENABLED=true
GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
```

---

## 📋 Recommended Approach

**Best solution: Update Grafana + Fix Configuration**

1. **Update Grafana to latest version** (fixes potential bugs)
2. **Reset Grafana data** (fresh start)
3. **Configure anonymous access properly**
4. **Import dashboard**

This ensures:
- ✅ Latest bug fixes
- ✅ Clean configuration
- ✅ Anonymous access working
- ✅ Dashboard imported

---

## 🎯 Quick Fix Script

Create `fix_incognito_access.bat`:

```batch
@echo off
echo ========================================
echo Fix Grafana Incognito Access
echo ========================================
echo.

echo Step 1: Stopping Grafana...
docker-compose stop grafana

echo.
echo Step 2: Removing container...
docker-compose rm -f grafana

echo.
echo Step 3: Updating Grafana image...
docker-compose pull grafana

echo.
echo Step 4: Starting Grafana...
docker-compose up -d grafana

echo.
echo Step 5: Waiting for startup (20 seconds)...
timeout /t 20 /nobreak

echo.
echo Step 6: Testing access...
curl -s http://localhost:3000/api/health
echo.

echo.
echo ========================================
echo Done!
echo ========================================
echo.
echo Next steps:
echo 1. Open Grafana: http://localhost:3000
echo 2. Login: admin / admin
echo 3. Go to Configuration -^> Users and access -^> Settings
echo 4. Enable "Anonymous access" -^> Save
echo 5. Test incognito: http://localhost:3000
echo.
pause
```

---

## ✅ After Fixing

Once incognito access works:

1. **Import Dashboard:**
   ```cmd
   import_dashboard.bat
   ```

2. **Test Frontend:**
   - Open: http://localhost:3001
   - Go to **Monitoring** tab
   - Check **Advanced Analytics** section
   - Panels should load!

---

**Last Updated:** December 2025














