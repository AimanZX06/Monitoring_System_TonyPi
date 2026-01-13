# Quick Testing Guide - All Features

Quick reference for testing all system features.

---

## 🚀 Quick Test Commands

### **1. Check SDK**
```bash
ssh pi@robot-ip "python3 -c 'from hiwonder import Board; print(\"✅ SDK installed\")' 2>&1 || echo \"❌ SDK not installed\""
```

### **2. Check Servo Data**
```bash
# Check MQTT messages
docker exec -it tonypi_mosquitto mosquitto_sub -t "tonypi/servos/#" -v
```

### **3. Check Databases**
```bash
# InfluxDB
curl http://localhost:8086/api/health

# PostgreSQL
docker exec tonypi_postgres pg_isready
docker exec tonypi_postgres psql -U postgres -d tonypi_db -c "SELECT COUNT(*) FROM robots;"
```

### **4. Check PDF Export**
```bash
curl -X POST "http://localhost:8000/api/reports/generate?report_type=performance" -H "Content-Type: application/json"
curl "http://localhost:8000/api/reports/1/pdf" -o test.pdf
```

### **5. Check Task Manager**
```bash
# Open: http://localhost:3001/monitoring
# Check Performance tab shows CPU, Memory, Disk, Temperature
```

### **6. Check Multi-Robot**
```bash
# Terminal 1
python robot_client/simulator.py --robot-id robot1

# Terminal 2
python robot_client/simulator.py --robot-id robot2

# Check: http://localhost:3001/robots (should show 2 robots)
```

### **7. Check Grafana**
```bash
curl http://localhost:3000/api/health
# Open: http://localhost:3001/monitoring (scroll to Advanced Analytics)
```

### **8. Check OpenAI (After Setup)**
```bash
curl -X POST "http://localhost:8000/api/analytics/analyze-sensors?robot_id=test&time_range=1h"
```

---

## ✅ Status Checklist

- [ ] SDK installed/checked
- [ ] Servo data working
- [ ] InfluxDB storing data
- [ ] PostgreSQL storing data
- [ ] PDF export working
- [ ] Task Manager showing data
- [ ] Multi-robot working
- [ ] Grafana panels loading
- [ ] OpenAI integrated (optional)

---

**See `SYSTEM_TESTING_CHECKLIST.md` for detailed steps!**













