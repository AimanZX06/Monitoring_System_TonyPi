# Update Grafana - Safe Upgrade Guide

Your current version: **Grafana 10.0.0** (June 2023)  
Latest stable: **Grafana 12.3.0** (December 2025)  
**Recommended:** Update to **Grafana 11.0.0** (stable, good compatibility)

---

## ✅ Should You Update?

**YES, but carefully:**

**Benefits:**
- ✅ Bug fixes (including anonymous access issues)
- ✅ Security patches
- ✅ Better performance
- ✅ New features

**Risks:**
- ⚠️ Potential breaking changes
- ⚠️ Dashboard compatibility
- ⚠️ Configuration changes

**Recommendation:** Update to **Grafana 11.0.0** (stable, good balance)

---

## 🚀 Safe Update Process

### **Step 1: Backup Current Setup**

```bash
# Backup Grafana data
xcopy grafana\data grafana\data_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2% /E /I

# Backup docker-compose.yml
copy docker-compose.yml docker-compose.yml.backup
```

### **Step 2: Update docker-compose.yml**

I've already updated it to Grafana 11.0.0. If you want a different version:

**Option A: Grafana 11.0.0 (Recommended - Stable)**
```yaml
grafana:
  image: grafana/grafana:11.0.0
```

**Option B: Latest Stable (12.3.0)**
```yaml
grafana:
  image: grafana/grafana:latest
```

**Option C: Specific Version**
```yaml
grafana:
  image: grafana/grafana:12.3.0
```

### **Step 3: Pull New Image**

```bash
# Pull new Grafana image
docker-compose pull grafana
```

### **Step 4: Stop and Update**

```bash
# Stop Grafana
docker-compose stop grafana

# Remove old container
docker-compose rm -f grafana

# Start with new version
docker-compose up -d grafana

# Wait for startup (20 seconds)
timeout /t 20
```

### **Step 5: Verify Update**

```bash
# Check version
docker-compose exec grafana grafana-server -v

# Check health
curl http://localhost:3000/api/health

# Check logs
docker-compose logs grafana --tail 20
```

### **Step 6: Test Access**

1. **Normal access:**
   - Go to: http://localhost:3000
   - Login: `admin` / `admin`

2. **Incognito access:**
   - Open incognito window
   - Go to: http://localhost:3000
   - Should work without login (if anonymous enabled)

3. **Configure anonymous access:**
   - Login as admin
   - Go to **Configuration** → **Users and access** → **Settings**
   - Enable **Anonymous access**
   - Role: **Viewer**
   - Save

### **Step 7: Re-import Dashboard**

After update, dashboard might need re-import:

```cmd
import_dashboard.bat
```

---

## 🔄 Update Script

Create `update_grafana.bat`:

```batch
@echo off
echo ========================================
echo Grafana Update Script
echo ========================================
echo.
echo Current version: Grafana 10.0.0
echo Updating to: Grafana 11.0.0
echo.
echo WARNING: This will update Grafana!
echo.
pause

echo.
echo Step 1: Backing up Grafana data...
if exist "grafana\data" (
    set BACKUP_DIR=grafana\data_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%
    xcopy grafana\data %BACKUP_DIR% /E /I /Y
    echo Backup created: %BACKUP_DIR%
) else (
    echo No data to backup
)

echo.
echo Step 2: Stopping Grafana...
docker-compose stop grafana

echo.
echo Step 3: Pulling new Grafana image...
docker-compose pull grafana
if %errorlevel% neq 0 (
    echo ERROR: Failed to pull new image
    pause
    exit /b 1
)

echo.
echo Step 4: Removing old container...
docker-compose rm -f grafana

echo.
echo Step 5: Starting Grafana with new version...
docker-compose up -d grafana
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Grafana
    pause
    exit /b 1
)

echo.
echo Step 6: Waiting for Grafana to start (20 seconds)...
timeout /t 20 /nobreak

echo.
echo Step 7: Checking Grafana health...
curl -s http://localhost:3000/api/health
echo.

echo.
echo Step 8: Checking version...
docker-compose exec grafana grafana-server -v 2>nul
if %errorlevel% neq 0 (
    echo Could not check version (might need more time)
)

echo.
echo ========================================
echo Update Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open Grafana: http://localhost:3000
echo 2. Login: admin / admin
echo 3. Configure anonymous access (if needed)
echo 4. Import dashboard: import_dashboard.bat
echo.
echo If you have issues, restore from backup:
echo   rmdir /s /q grafana\data
echo   xcopy %BACKUP_DIR% grafana\data /E /I
echo.
pause
```

---

## ⚠️ Potential Issues After Update

### **Issue 1: Dashboard Not Found**

**Solution:**
```cmd
import_dashboard.bat
```

### **Issue 2: Anonymous Access Not Working**

**Solution:**
1. Login as admin
2. Go to **Configuration** → **Users and access** → **Settings**
3. Enable **Anonymous access**
4. Save

### **Issue 3: Datasource Connection Failed**

**Solution:**
1. Go to **Configuration** → **Data sources**
2. Click **InfluxDB**
3. Click **"Test"** button
4. If fails, check InfluxDB is running: `docker-compose ps influxdb`

### **Issue 4: Panels Show No Data**

**Solution:**
- Check InfluxDB datasource is working
- Verify robots are connected and sending data
- Check time range in panels

---

## 🔙 Rollback (If Update Fails)

If update causes problems, rollback:

```bash
# Stop Grafana
docker-compose stop grafana

# Remove new container
docker-compose rm -f grafana

# Restore backup
rmdir /s /q grafana\data
xcopy grafana\data_backup_YYYYMMDD grafana\data /E /I

# Revert docker-compose.yml
copy docker-compose.yml.backup docker-compose.yml

# Start old version
docker-compose up -d grafana
```

---

## 📋 Version Recommendations

| Version | Status | Recommendation |
|---------|--------|----------------|
| **10.0.0** | Current | Old, has bugs |
| **11.0.0** | Stable | ✅ **Recommended** |
| **11.5.0** | Stable | Good alternative |
| **12.0.0** | Latest Major | New features, test first |
| **12.3.0** | Latest | Most recent, test first |

**My Recommendation:** Update to **11.0.0** first (safe, stable), then consider 12.x later.

---

## ✅ After Update Checklist

- [ ] Grafana starts without errors
- [ ] Can login with admin/admin
- [ ] Anonymous access works (incognito)
- [ ] Dashboard exists and loads
- [ ] All 8 panels visible
- [ ] InfluxDB datasource working
- [ ] Frontend panels load correctly

---

## 🎯 Quick Update (Recommended)

**I've already updated docker-compose.yml to Grafana 11.0.0**

Just run:

```bash
# Pull and update
docker-compose pull grafana
docker-compose stop grafana
docker-compose rm -f grafana
docker-compose up -d grafana

# Wait 20 seconds
timeout /t 20

# Test
curl http://localhost:3000/api/health
```

Then:
1. Login: http://localhost:3000 (admin/admin)
2. Configure anonymous access
3. Import dashboard: `import_dashboard.bat`

---

**Last Updated:** December 2025














