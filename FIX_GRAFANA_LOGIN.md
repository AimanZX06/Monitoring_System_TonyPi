# Fix Grafana Login Issues - Password Change & Unauthorized Errors

This guide fixes the Grafana login problems where:
- Login works but requires password change
- After password change, you get "Unauthorized" error
- "Sign in" icon still shows even after login

---

## 🔍 Problem Diagnosis

**Symptoms:**
1. Can login with `admin`/`admin`
2. Grafana forces password change
3. If skip → Still shows "Sign in" (not logged in)
4. If change password → "Unauthorized" error

**Root Cause:**
- Grafana's default security requires password change on first login
- New password might not be saved correctly
- Anonymous access might be interfering with admin session

---

## ✅ Solution 1: Disable Password Change Requirement

### **Step 1: Update docker-compose.yml**

Add environment variable to disable password change requirement:

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
    # Disable password change requirement
    - GF_SECURITY_DISABLE_GRAVATAR=true
    - GF_USERS_ALLOW_SIGN_UP=false
    # Anonymous access configuration
    - GF_AUTH_ANONYMOUS_ENABLED=true
    - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
    - GF_AUTH_ANONYMOUS_ORG_NAME=Main Org.
    # Embedding and security
    - GF_SECURITY_ALLOW_EMBEDDING=true
    - GF_SECURITY_COOKIE_SAMESITE=none
    - GF_SECURITY_COOKIE_SECURE=false
    # Server configuration
    - GF_SERVER_ROOT_URL=http://localhost:3000
    # Public dashboards
    - GF_PUBLIC_DASHBOARDS_ENABLED=true
    # Keep login form enabled
    - GF_AUTH_DISABLE_LOGIN_FORM=false
```

### **Step 2: Reset Grafana Data (Fresh Start)**

**Option A: Reset Grafana completely (Recommended)**

```bash
# Stop Grafana
docker-compose stop grafana

# Remove Grafana container
docker-compose rm -f grafana

# Remove Grafana data (this resets everything)
rmdir /s /q grafana\data

# Or on Linux/Mac:
# rm -rf grafana/data

# Start Grafana fresh
docker-compose up -d grafana

# Wait 10 seconds
timeout /t 10
```

**Option B: Keep data but reset admin password**

```bash
# Stop Grafana
docker-compose stop grafana

# Access Grafana database
docker-compose exec grafana grafana-cli admin reset-admin-password admin
```

---

## ✅ Solution 2: Reset Admin Password via CLI

### **Method 1: Using Grafana CLI**

```bash
# Stop Grafana
docker-compose stop grafana

# Start Grafana in background
docker-compose up -d grafana

# Wait for it to start
timeout /t 10

# Reset admin password
docker-compose exec grafana grafana-cli admin reset-admin-password admin

# Restart Grafana
docker-compose restart grafana
```

### **Method 2: Using SQL (Direct Database Access)**

If CLI doesn't work, reset via database:

```bash
# Access Grafana's SQLite database
docker-compose exec grafana sqlite3 /var/lib/grafana/grafana.db

# In SQLite prompt, run:
UPDATE user SET password = '59acf18b94d7eb0694c61e60ce44c110c7a683ac6a8f09580d626f90f4a242000748579e74101baeee9ddcf0f6c3133137478347dad645a1fd61a80046b22426', salt = 'F3FAxVm33R' WHERE login = 'admin';
UPDATE user SET is_admin = 1 WHERE login = 'admin';
.exit
```

**Note:** The password hash above is for `admin` password.

---

## ✅ Solution 3: Use Environment Variables (Easiest)

### **Step 1: Create/Update .env file**

Create `.env` file in project root (if it doesn't exist):

```env
# Grafana Configuration
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin
```

### **Step 2: Update docker-compose.yml**

Make sure Grafana uses these environment variables:

```yaml
environment:
  - GF_SECURITY_ADMIN_USER=${GRAFANA_USER:-admin}
  - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
```

### **Step 3: Reset Grafana**

```bash
# Stop and remove
docker-compose stop grafana
docker-compose rm -f grafana

# Remove data directory
rmdir /s /q grafana\data

# Start fresh
docker-compose up -d grafana
```

Now Grafana will use `admin`/`admin` and won't require password change.

---

## ✅ Solution 4: Fix Current Session Issue

If you're already logged in but seeing "Sign in":

### **Step 1: Clear Browser Data**

1. **Open browser DevTools:** Press `F12`
2. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
3. **Clear cookies for localhost:3000**
4. **Clear localStorage**
5. **Hard refresh:** `Ctrl+Shift+R`

### **Step 2: Try Incognito/Private Window**

1. Open incognito window
2. Go to: http://localhost:3000
3. Login: `admin` / `admin`
4. If password change appears, try the reset methods above

---

## ✅ Solution 5: Complete Reset Script

Create `reset_grafana.bat`:

```batch
@echo off
echo ========================================
echo Grafana Complete Reset Script
echo ========================================
echo.
echo This will:
echo 1. Stop Grafana
echo 2. Remove Grafana container
echo 3. Delete all Grafana data (fresh start)
echo 4. Start Grafana with default admin/admin
echo.
pause

echo.
echo Step 1: Stopping Grafana...
docker-compose stop grafana

echo.
echo Step 2: Removing Grafana container...
docker-compose rm -f grafana

echo.
echo Step 3: Removing Grafana data...
if exist grafana\data (
    rmdir /s /q grafana\data
    echo Grafana data removed
) else (
    echo Grafana data directory doesn't exist
)

echo.
echo Step 4: Starting Grafana fresh...
docker-compose up -d grafana

echo.
echo Step 5: Waiting for Grafana to start (15 seconds)...
timeout /t 15 /nobreak

echo.
echo Step 6: Resetting admin password...
docker-compose exec grafana grafana-cli admin reset-admin-password admin 2>nul
if %errorlevel% neq 0 (
    echo Note: Password reset command may not be available in this Grafana version
    echo Using default password: admin/admin
)

echo.
echo ========================================
echo Reset Complete!
echo ========================================
echo.
echo Grafana should now be accessible with:
echo   Username: admin
echo   Password: admin
echo.
echo Access: http://localhost:3000
echo.
echo If password change is still required:
echo 1. Change password to: admin (or any password you prefer)
echo 2. Or use the import script to import dashboard without login
echo.
pause
```

---

## 🎯 Recommended: Quick Fix

**Fastest solution - Reset everything:**

```bash
# 1. Stop Grafana
docker-compose stop grafana

# 2. Remove container and data
docker-compose rm -f grafana
rmdir /s /q grafana\data

# 3. Start fresh
docker-compose up -d grafana

# 4. Wait 15 seconds
timeout /t 15

# 5. Access Grafana
# Go to: http://localhost:3000
# Login: admin / admin
# If password change appears, change it to: admin
```

---

## 🔧 Alternative: Work Without Login

If login keeps causing issues, you can work with anonymous access:

### **Option 1: Import Dashboard via API (No Login Needed)**

Use the import script:
```cmd
import_dashboard.bat
```

This works without logging in!

### **Option 2: Use Anonymous Access**

Since anonymous access is enabled:
1. Go to: http://localhost:3000
2. You should be able to view dashboards without login
3. Import dashboard using API script (no UI needed)

---

## 📋 Troubleshooting Steps

### **Check 1: Verify Grafana is Running**

```bash
docker-compose ps grafana
```

Should show: `Up` status

### **Check 2: Check Grafana Logs**

```bash
docker-compose logs grafana --tail 50
```

Look for:
- Authentication errors
- Password reset messages
- Database errors

### **Check 3: Test Grafana API**

```bash
# Test health (no auth needed)
curl http://localhost:3000/api/health

# Test with admin credentials
curl -u admin:admin http://localhost:3000/api/user
```

### **Check 4: Verify Environment Variables**

```bash
# Check what Grafana sees
docker-compose exec grafana env | findstr GRAFANA
```

---

## ✅ Success Indicators

After fixing, you should:

1. ✅ Access Grafana: http://localhost:3000
2. ✅ Login with `admin`/`admin` works
3. ✅ No forced password change (or can skip it)
4. ✅ Stay logged in (see your name/avatar in top right)
5. ✅ Can access all features (dashboards, settings, etc.)
6. ✅ Can import dashboard

---

## 🆘 If Still Having Issues

**Last Resort - Complete Fresh Start:**

```bash
# Stop all services
docker-compose down

# Remove all Grafana data
rmdir /s /q grafana\data

# Remove Grafana volume (if exists)
docker volume rm tonypi_grafana_data 2>nul

# Start everything fresh
docker-compose up -d

# Wait 20 seconds
timeout /t 20

# Access Grafana
# http://localhost:3000
# Login: admin / admin
```

---

**Last Updated:** December 2025














