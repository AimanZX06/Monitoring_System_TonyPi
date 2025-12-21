# Getting Started with TonyPi Robot - Complete Guide

This guide will walk you through connecting your real TonyPi robot to the monitoring system step by step.

---

## 📋 Prerequisites Checklist

Before you begin, make sure you have:

- ✅ **Monitoring System Running**: All Docker containers started on your PC
- ✅ **TonyPi Robot**: Raspberry Pi 5 with TonyPi hardware
- ✅ **Network Connection**: Both PC and TonyPi on the same network (WiFi or Ethernet)
- ✅ **SSH Access**: Ability to connect to TonyPi via SSH
- ✅ **Python 3**: Installed on TonyPi (usually pre-installed on Raspberry Pi OS)

---

## 🚀 Step-by-Step Guide

### **Step 1: Start the Monitoring System**

First, ensure all services are running on your PC:

```bash
# Navigate to project directory
cd C:\Users\aiman\Projects\Monitoring_System_TonyPi

# Start all Docker containers
docker-compose up -d

# Verify all services are running
docker-compose ps
```

**Expected Output:**
```
NAME                STATUS
tonypi_backend      Up
tonypi_frontend     Up
tonypi_postgres      Up
tonypi_influxdb      Up
tonypi_mosquitto     Up
tonypi_grafana       Up
```

**Access Points:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

### **Step 2: Find Your PC's IP Address**

You need to know your PC's IP address so the TonyPi robot can connect to it.

**On Windows:**
```cmd
ipconfig
```

Look for **"IPv4 Address"** under your active network adapter. Example:
```
IPv4 Address. . . . . . . . . . . : 192.168.1.12
```

**On Linux/Mac:**
```bash
ifconfig
# or
ip addr show
```

**Note this IP address** - you'll need it in Step 5!

---

### **Step 3: Prepare Files on Your PC**

Make sure the `robot_client` folder exists on your PC:

```bash
# Verify files exist
dir C:\Users\aiman\Projects\Monitoring_System_TonyPi\robot_client
```

You should see:
- `tonypi_client.py` - Main robot client script
- `requirements.txt` - Python dependencies
- `README.md` - Documentation

---

### **Step 4: Copy Files to TonyPi Robot**

You have two options to transfer files:

#### **Option A: Using SCP (Secure Copy) - Recommended**

**On Windows (using PowerShell or Git Bash):**
```bash
# Replace 192.168.1.103 with YOUR TonyPi's IP address
scp -r C:\Users\aiman\Projects\Monitoring_System_TonyPi\robot_client pi@192.168.1.103:/home/pi/
```

**On Linux/Mac:**
```bash
scp -r robot_client/ pi@192.168.1.103:/home/pi/
```

**Enter password when prompted** (default is usually `raspberry`)

#### **Option B: Using File Transfer Tool**

1. **Download WinSCP** (Windows) or **FileZilla** (cross-platform)
2. **Connect to TonyPi:**
   - Host: `192.168.1.103` (your TonyPi IP)
   - Username: `pi`
   - Password: `raspberry` (or your custom password)
   - Protocol: SFTP
3. **Upload** the entire `robot_client` folder to `/home/pi/`

---

### **Step 5: Connect to TonyPi via SSH**

**On Windows (using PowerShell or Git Bash):**
```bash
ssh pi@192.168.1.103
```

**On Linux/Mac:**
```bash
ssh pi@192.168.1.103
```

**Enter password** when prompted.

**If you don't know your TonyPi's IP address:**
- Check your router's admin panel
- Or on TonyPi, run: `hostname -I`

---

### **Step 6: Install Python Dependencies**

Once connected to TonyPi via SSH:

```bash
# Navigate to robot_client folder
cd ~/robot_client

# Install required Python packages
pip3 install -r requirements.txt
```

**Expected Output:**
```
Collecting paho-mqtt>=1.6.1
Collecting psutil>=5.9.0
...
Successfully installed paho-mqtt-1.6.1 psutil-5.9.0 ...
```

**If pip3 is not found:**
```bash
# Install pip3 first
sudo apt-get update
sudo apt-get install python3-pip
```

**Optional: Install Hardware Libraries** (for advanced features):
```bash
pip3 install RPi.GPIO gpiozero picamera2 opencv-python
```

---

### **Step 7: Configure Firewall (If Needed)**

**On Your PC (Windows):**
1. Open **Windows Defender Firewall**
2. Click **"Advanced settings"**
3. Click **"Inbound Rules"** → **"New Rule"**
4. Select **"Port"** → **"TCP"** → Port **1883**
5. Allow the connection
6. Name it: "MQTT Broker"

**On Your PC (Linux):**
```bash
sudo ufw allow 1883/tcp
```

**On TonyPi (if firewall is enabled):**
```bash
sudo ufw allow out 1883/tcp
```

---

### **Step 8: Test Network Connectivity**

**From TonyPi, test connection to your PC:**
```bash
# Replace 192.168.1.12 with YOUR PC's IP address
ping 192.168.1.12
```

**Press Ctrl+C to stop.** You should see successful ping responses.

**Test MQTT port:**
```bash
# Test if MQTT port is accessible
telnet 192.168.1.12 1883
```

If connection succeeds, you'll see a blank screen. Press Ctrl+] then type `quit` to exit.

---

### **Step 9: Run the Robot Client**

**On TonyPi, run the client:**

```bash
# Make sure you're in the robot_client directory
cd ~/robot_client

# Run the client (replace 192.168.1.12 with YOUR PC's IP)
python3 tonypi_client.py --broker 192.168.1.12 --port 1883
```

**Expected Output:**
```
2025-12-05 10:30:00 - TonyPi-Client - INFO - TonyPi Robot Client initialized with ID: tonypi_raspberrypi
2025-12-05 10:30:01 - TonyPi-Client - INFO - Connecting to MQTT broker at 192.168.1.12:1883...
2025-12-05 10:30:02 - TonyPi-Client - INFO - Connected to MQTT broker!
2025-12-05 10:30:02 - TonyPi-Client - INFO - Publishing status...
2025-12-05 10:30:02 - TonyPi-Client - INFO - Publishing system info...
```

**The client is now running!** Keep this terminal open.

---

### **Step 10: Verify Connection in Frontend**

1. **Open your browser**: http://localhost:3001

2. **Check Overview Tab:**
   - Robot Status should show **"Connected"** (green)
   - Robot ID should appear (e.g., `tonypi_raspberrypi`)
   - System metrics should be updating

3. **Check Performance Tab:**
   - CPU Usage chart should show real data
   - Memory Usage chart should show real data
   - Temperature gauge should show actual Pi temperature
   - All updating every 5 seconds

4. **Check Robots Tab:**
   - Your robot should appear in the grid
   - Status should be **"online"** (green indicator)
   - Last seen should show "a few seconds ago"

**If you see the robot in the frontend, congratulations! Your TonyPi is connected! 🎉**

---

### **Step 11: Test Job Tracking (Optional)**

1. In the **Overview** tab, scroll to **"Robot Controls"**
2. Select a QR code from the dropdown (e.g., "QR12345 - Widget A")
3. Click **"Trigger Scan"**
4. Watch the **Job Summary** section update:
   - Start time appears
   - Items processed: 1/0
   - Progress percentage updates

5. Switch to **Jobs** tab to see the active job

---

## 🔧 Running as a Background Service (Optional)

To run the robot client automatically on boot (so you don't need to manually start it):

### **Step 1: Create Systemd Service File**

```bash
# On TonyPi, create service file
sudo nano /etc/systemd/system/tonypi-client.service
```

### **Step 2: Add Service Configuration**

Paste this content (replace `192.168.1.12` with YOUR PC's IP):

```ini
[Unit]
Description=TonyPi Robot Client
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/robot_client
ExecStart=/usr/bin/python3 /home/pi/robot_client/tonypi_client.py --broker 192.168.1.12 --port 1883
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### **Step 3: Enable and Start Service**

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (starts on boot)
sudo systemctl enable tonypi-client.service

# Start service now
sudo systemctl start tonypi-client.service

# Check status
sudo systemctl status tonypi-client.service
```

**Expected Output:**
```
● tonypi-client.service - TonyPi Robot Client
   Loaded: loaded
   Active: active (running)
```

### **Useful Service Commands:**

```bash
# Stop service
sudo systemctl stop tonypi-client.service

# Restart service
sudo systemctl restart tonypi-client.service

# View logs
sudo journalctl -u tonypi-client.service -f

# Disable auto-start
sudo systemctl disable tonypi-client.service
```

---

## 🐛 Troubleshooting

### **Problem: Cannot Connect to MQTT Broker**

**Symptoms:**
- Error: "Failed to connect to MQTT broker"
- Connection timeout

**Solutions:**
1. **Check PC IP address is correct**
   ```bash
   # On PC
   ipconfig
   ```

2. **Check firewall allows port 1883**
   - Windows: Allow port 1883 in firewall
   - Linux: `sudo ufw allow 1883/tcp`

3. **Verify MQTT broker is running**
   ```bash
   # On PC
   docker-compose ps mosquitto
   ```

4. **Test network connectivity**
   ```bash
   # On TonyPi
   ping YOUR_PC_IP
   telnet YOUR_PC_IP 1883
   ```

5. **Check MQTT broker logs**
   ```bash
   # On PC
   docker-compose logs mosquitto --tail 20
   ```

---

### **Problem: Robot Not Appearing in Frontend**

**Symptoms:**
- Robot client shows "Connected" but doesn't appear in frontend

**Solutions:**
1. **Check backend is receiving MQTT messages**
   ```bash
   # On PC
   docker-compose logs backend --tail 50 | findstr /i "mqtt"
   ```
   Should see: `MQTT: Received message on tonypi/status/...`

2. **Check robot was registered in database**
   ```bash
   # On PC
   curl http://localhost:8000/api/robots-db/robots
   ```

3. **Refresh frontend** (hard refresh: Ctrl+Shift+R)

4. **Check browser console** (F12) for errors

---

### **Problem: No Data in Performance Tab**

**Symptoms:**
- Robot appears but no CPU/Memory/Temperature data

**Solutions:**
1. **Check if data is being sent**
   ```bash
   # On PC, subscribe to MQTT topics
   docker exec -it tonypi_mosquitto mosquitto_sub -t "tonypi/#" -v
   ```
   Should see messages from your robot

2. **Check InfluxDB has data**
   ```bash
   # On PC
   curl http://localhost:8000/api/robot-data/status
   ```

3. **Verify robot client is sending system info**
   - Check robot client terminal for "Publishing system info" messages

---

### **Problem: Permission Denied Errors**

**Symptoms:**
- Error: "Permission denied" when running script

**Solutions:**
```bash
# Make script executable
chmod +x ~/robot_client/tonypi_client.py

# Or run with python3 explicitly
python3 ~/robot_client/tonypi_client.py --broker YOUR_PC_IP
```

---

### **Problem: Python Packages Not Installing**

**Symptoms:**
- Error: "pip3: command not found" or package installation fails

**Solutions:**
```bash
# Update package list
sudo apt-get update

# Install pip3
sudo apt-get install python3-pip

# Upgrade pip
pip3 install --upgrade pip

# Try installing again
pip3 install -r requirements.txt
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Docker containers running on PC
- [ ] Frontend accessible at http://localhost:3001
- [ ] Robot client files copied to TonyPi
- [ ] Python dependencies installed on TonyPi
- [ ] Robot client running and shows "Connected"
- [ ] Robot appears in frontend Overview tab
- [ ] Performance tab shows real-time data
- [ ] Robot appears in Robots tab with "online" status
- [ ] Job tracking works (test with QR scan)

---

## 📊 What Happens After Connection

Once connected, your TonyPi robot will:

1. **Auto-Register**: Automatically registered in PostgreSQL
2. **Send Data Every 5 Seconds**:
   - CPU usage
   - Memory usage
   - Disk usage
   - Temperature
   - System uptime
3. **Send Sensor Data Every 2 Seconds**:
   - Accelerometer
   - Gyroscope
   - Ultrasonic distance
   - Servo angle
   - Camera light level
4. **Send Battery Status Every 30 Seconds**
5. **Send Location Updates Every 5 Seconds**
6. **Store All Data**: InfluxDB (time-series) + PostgreSQL (relational)

---

## 🎯 Next Steps

After successful connection:

1. **Monitor Performance**: Watch the Performance tab for real-time metrics
2. **Track Jobs**: Use QR scan triggers to test job tracking
3. **View History**: Check Jobs tab for completed jobs
4. **Explore API**: Try API endpoints at http://localhost:8000/docs
5. **Setup Grafana**: Create custom dashboards at http://localhost:3000
6. **Add More Robots**: Connect additional TonyPi robots (same process)

---

## 📞 Quick Reference

| Item | Value |
|------|-------|
| **Frontend** | http://localhost:3001 |
| **Backend API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |
| **Grafana** | http://localhost:3000 |
| **MQTT Port** | 1883 |
| **Robot Client Path** | `/home/pi/robot_client/` |
| **Service Name** | `tonypi-client.service` |
| **Robot ID Format** | `tonypi_{hostname}` |

---

## 🎉 Success!

If you've completed all steps and see your robot in the frontend, you're all set! The monitoring system is now tracking your TonyPi robot in real-time.

**Need Help?**
- Check the troubleshooting section above
- Review logs: `docker-compose logs backend`
- Check MQTT: `docker-compose logs mosquitto`
- Verify database: `curl http://localhost:8000/api/health`

---

**Last Updated:** December 2025
