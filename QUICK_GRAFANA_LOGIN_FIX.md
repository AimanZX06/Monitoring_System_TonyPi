# Quick Fix: Grafana Login Issues

## 🚀 Fastest Solution (2 minutes)

### **Option 1: Complete Reset (Recommended)**

Run this script to reset Grafana completely:

```cmd
reset_grafana.bat
```

This will:
1. Stop Grafana
2. Remove all data
3. Start fresh with `admin`/`admin`
4. No password change required on first start

**After reset:**
- Go to: http://localhost:3000
- Login: `admin` / `admin`
- Should work without password change prompt

---

### **Option 2: Fix Without Resetting**

If you want to keep your data:

#### **Step 1: Clear Browser Data**

1. **Open browser DevTools:** Press `F12`
2. **Application tab** → **Cookies** → `http://localhost:3000`
3. **Delete all cookies**
4. **Clear Storage** → **Clear site data**
5. **Close and reopen browser**

#### **Step 2: Try Login Again**

1. Go to: http://localhost:3000
2. Login: `admin` / `admin`
3. **If password change appears:**
   - **Change password to:** `admin` (same as current)
   - OR try: `password123` (something simple)
   - Click "Save"

#### **Step 3: If Still Shows "Sign in"**

Try incognito window:
1. Open incognito/private window
2. Go to: http://localhost:3000
3. Login: `admin` / `admin`
4. If password change appears, change it

---

## 🔧 Why This Happens

**Grafana's default behavior:**
- First login requires password change (security feature)
- If you skip, session might not be saved
- New password might not be saved correctly
- Browser cookies might be corrupted

**Solution:**
- Reset Grafana data (fresh start)
- Or properly change password (don't skip)

---

## ✅ After Fixing Login

Once you can login successfully:

1. **Import Dashboard:**
   ```cmd
   import_dashboard.bat
   ```

2. **Or use UI:**
   - Go to: http://localhost:3000/dashboard/import
   - Upload: `grafana/provisioning/dashboards/tonypi-dashboard.json`
   - Set UID: `tonypi-robot-monitoring`

3. **Test Frontend:**
   - Open: http://localhost:3001
   - Go to **Monitoring** tab
   - Check **Advanced Analytics** section

---

## 🆘 Still Not Working?

**Last Resort - Manual Reset:**

```bash
# Stop Grafana
docker-compose stop grafana

# Remove container
docker-compose rm -f grafana

# Delete data folder
rmdir /s /q grafana\data

# Start fresh
docker-compose up -d grafana

# Wait 20 seconds
timeout /t 20

# Access Grafana
# http://localhost:3000
# Login: admin / admin
```

---

**Quick Reference:**
- Reset script: `reset_grafana.bat`
- Import script: `import_dashboard.bat`
- Grafana URL: http://localhost:3000
- Default login: `admin` / `admin`



