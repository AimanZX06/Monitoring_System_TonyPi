# Fix: 500 Error on Sensors Endpoint

## 🔍 Problem

Frontend shows:
```
sensors?measurement=sensors&time_range=1m:1 Failed to load resource: 
the server responded with a status of 500 (Internal Server Error)
```

But backend logs show:
```
INFO: "GET /api/robot-data/sensors?measurement=sensors&time_range=1m HTTP/1.1" 200 OK
```

**This suggests:**
- Backend is returning 200 OK
- But frontend is interpreting it as 500 error
- OR there's a CORS/network issue
- OR the response format is incorrect

---

## ✅ Solutions Applied

### **1. Improved Error Handling in InfluxDB Client**

**File:** `backend/database/influx_client.py`

**Changes:**
- Added `org` parameter to query
- Improved error messages with full traceback
- Re-raise exceptions instead of silently returning empty array

### **2. Improved Error Handling in API Endpoint**

**File:** `backend/routers/robot_data.py`

**Changes:**
- Better error handling for empty/invalid data
- Added try-catch for individual items
- Improved error messages with traceback

---

## 🔧 Diagnostic Steps

### **Step 1: Check Backend Logs for Actual Errors**

```cmd
docker-compose logs backend --tail=100 | findstr /i "error\|exception\|traceback"
```

**If you see errors:**
- Note the error message
- Check InfluxDB connection
- Verify token and credentials

### **Step 2: Test API Directly**

```cmd
python -c "import requests; r = requests.get('http://localhost:8000/api/robot-data/sensors?measurement=sensors&time_range=1m'); print(f'Status: {r.status_code}'); print(f'Response: {r.text}')"
```

**Expected:**
- Status: 200
- Response: `[]` (empty array if no data)

**If 500:**
- Check backend logs for the actual error
- Check InfluxDB connection

### **Step 3: Check InfluxDB Connection**

```cmd
docker-compose exec backend python -c "from database.influx_client import influx_client; print('Testing...'); data = influx_client.query_recent_data('sensors', '1h'); print(f'Found {len(data)} records')"
```

**If error:**
- Check InfluxDB is running: `docker-compose ps`
- Check InfluxDB logs: `docker-compose logs influxdb`
- Verify credentials in `.env`

### **Step 4: Check Frontend Network Tab**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for the failing request
4. Check:
   - Request URL
   - Request Method
   - Response Status
   - Response Headers
   - Response Body

**Common issues:**
- CORS error (check response headers)
- Network timeout
- Wrong URL
- Response format mismatch

---

## 🐛 Common Causes

### **1. Empty Database**

**Symptom:**
- API returns `[]` (empty array)
- Frontend might error if it expects data

**Solution:**
- This is normal if no data has been sent yet
- Start robot client to send data
- Frontend should handle empty arrays gracefully

### **2. InfluxDB Connection Issue**

**Symptom:**
- Backend logs show "Error querying from InfluxDB"
- 500 error in API

**Solution:**
- Check InfluxDB is running: `docker-compose ps influxdb`
- Check InfluxDB logs: `docker-compose logs influxdb`
- Verify token in `.env` matches InfluxDB setup
- Test connection: `python check_influxdb_connection.py`

### **3. CORS Issue**

**Symptom:**
- Browser console shows CORS error
- Network tab shows preflight failure

**Solution:**
- Check backend CORS settings
- Verify frontend is calling correct URL
- Check if API is accessible from browser

### **4. Response Format Mismatch**

**Symptom:**
- API returns 200 with data
- Frontend still shows error

**Solution:**
- Check response format matches frontend expectations
- Check browser console for parsing errors
- Verify frontend error handling

---

## 🔍 Debugging Commands

### **Check Backend Status**
```cmd
docker-compose ps backend
docker-compose logs backend --tail=50
```

### **Check InfluxDB Status**
```cmd
docker-compose ps influxdb
docker-compose logs influxdb --tail=50
```

### **Test API Endpoint**
```cmd
curl http://localhost:8000/api/robot-data/sensors?measurement=sensors&time_range=1m
```

### **Check Database Has Data**
```cmd
python -c "from backend.database.influx_client import influx_client; data = influx_client.query_recent_data('sensors', '1h'); print(f'Found {len(data)} records')"
```

### **Check Frontend Console**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

---

## 📋 Verification Checklist

- [ ] Backend is running (`docker-compose ps`)
- [ ] InfluxDB is running (`docker-compose ps influxdb`)
- [ ] API returns 200 OK (test with curl)
- [ ] InfluxDB connection works (test query)
- [ ] Database has data OR empty array is handled
- [ ] Frontend can access API (check Network tab)
- [ ] No CORS errors in browser console
- [ ] Response format matches frontend expectations

---

## 🚀 Next Steps

1. **If database is empty:**
   - Start robot client to send data
   - Wait for data to arrive
   - Check MQTT messages are being received

2. **If InfluxDB connection fails:**
   - Check credentials in `.env`
   - Verify InfluxDB is accessible
   - Test connection with diagnostic script

3. **If frontend still shows errors:**
   - Check browser console for actual error
   - Check Network tab for request/response
   - Verify frontend error handling

---

## 📝 Notes

- The backend now has better error handling
- Errors will be logged with full traceback
- Empty database is handled gracefully
- API returns empty array `[]` when no data (this is correct)

**The 500 error in frontend might be:**
- A browser caching issue (try hard refresh: Ctrl+F5)
- A CORS issue (check Network tab)
- A frontend error handling issue (check console)
- A network timeout (check if API is slow)

---

**Last Updated:** December 2025




