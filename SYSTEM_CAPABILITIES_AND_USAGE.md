# TonyPi Monitoring System - Capabilities, Tech Stack & Usage Guide

## 📋 Table of Contents
1. [System Capabilities](#system-capabilities)
2. [Complete Tech Stack](#complete-tech-stack)
3. [How to Use the System](#how-to-use-the-system)
4. [Servo Data Retrieval from Raspberry Pi 5](#servo-data-retrieval-from-raspberry-pi-5)

---

## 🚀 System Capabilities

### **Core Features**

#### 1. **Real-Time Robot Monitoring**
- ✅ **Live System Metrics**: CPU usage, memory, disk usage, temperature
- ✅ **Multi-Robot Support**: Monitor multiple TonyPi robots simultaneously
- ✅ **Real-Time Updates**: Auto-refresh every 5 seconds
- ✅ **Status Tracking**: Online/offline status, last seen timestamps
- ✅ **Battery Monitoring**: Voltage, current, percentage, charging status

#### 2. **Sensor Data Collection**
- ✅ **Accelerometer**: X, Y, Z axis acceleration (m/s²)
- ✅ **Gyroscope**: X, Y, Z axis rotation rates (°/s)
- ✅ **Ultrasonic Distance**: Obstacle detection (cm)
- ✅ **Camera Light Level**: Ambient light sensing (%)
- ✅ **Servo Angle**: Head/camera position tracking (°)
- ✅ **Temperature**: CPU and system temperature (°C)

#### 3. **Data Storage & Analytics**
- ✅ **Time-Series Database (InfluxDB)**: Historical sensor data, performance metrics
- ✅ **Relational Database (PostgreSQL)**: Robot configurations, reports, system logs
- ✅ **Data Retention**: Configurable retention policies
- ✅ **Query Interface**: REST API for data retrieval

#### 4. **Advanced Visualization**
- ✅ **Grafana Dashboards**: Pre-configured panels for:
  - CPU Usage (Time Series)
  - Memory Usage (Time Series)
  - Temperature (Gauge)
  - Disk Usage (Stat)
  - Sensor Data (Time Series)
  - Battery Status (Time Series)
  - Location Tracking (Time Series)
  - Servo Angle (Time Series)
- ✅ **Embedded Panels**: Grafana panels embedded in React frontend
- ✅ **Custom Dashboards**: Create custom visualizations

#### 5. **Job Tracking & Management**
- ✅ **QR Code Scanning**: Track items processed via QR scans
- ✅ **Job Progress**: Real-time progress tracking (items done/total, percentage)
- ✅ **Job History**: Historical job records in PostgreSQL
- ✅ **Job Status**: Active, completed, failed states

#### 6. **Remote Robot Control**
- ✅ **Command Publishing**: Send commands via MQTT
- ✅ **Movement Control**: Forward, backward, left, right with speed/distance
- ✅ **Status Requests**: Query robot status on demand
- ✅ **Emergency Stop**: Immediate robot halt
- ✅ **Shutdown Command**: Remote shutdown capability

#### 7. **Reporting System**
- ✅ **Automated Reports**: System-generated reports
- ✅ **Custom Reports**: User-created reports
- ✅ **Report Storage**: PostgreSQL-backed report management
- ✅ **Report Filtering**: Filter by robot, date range, type

#### 8. **System Health & Logging**
- ✅ **Health Checks**: API endpoint for system status
- ✅ **System Logs**: Event logging in PostgreSQL
- ✅ **Error Handling**: Graceful error handling and fallbacks
- ✅ **Service Monitoring**: Docker container health monitoring

---

## 🛠️ Complete Tech Stack

### **Frontend Layer**
| Technology | Version | Purpose |
|------------|---------|---------|
| **React.js** | 18.2.0 | UI framework with TypeScript |
| **TypeScript** | 4.9.5 | Type-safe JavaScript |
| **Tailwind CSS** | 3.3.0 | Utility-first CSS framework |
| **Recharts** | 2.8.0 | Native React charting library |
| **Axios** | 1.5.0 | HTTP client for API calls |
| **MQTT.js** | 5.3.0 | MQTT WebSocket client |
| **React Router** | 6.16.0 | Client-side routing |

### **Backend Layer**
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.104.1 | Modern Python web framework |
| **Uvicorn** | 0.24.0 | ASGI server |
| **Pydantic** | 2.5.0 | Data validation |
| **SQLAlchemy** | 2.0.23 | PostgreSQL ORM |
| **Paho-MQTT** | 1.6.1 | MQTT client library |
| **InfluxDB Client** | 1.38.0 | InfluxDB Python client |
| **Psycopg2** | 2.9.9 | PostgreSQL adapter |

### **Database Layer**
| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 15 | Relational database (configs, reports, logs) |
| **InfluxDB** | 2.7 | Time-series database (sensor data, metrics) |

### **Message Broker**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Eclipse Mosquitto** | 2.0 | MQTT message broker |
| **Ports** | 1883, 9001 | MQTT (TCP) and WebSocket |

### **Visualization**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Grafana** | 10.0.0 | Advanced data visualization |
| **Pre-configured Dashboards** | 8 panels | Ready-to-use visualizations |

### **Containerization**
| Technology | Purpose |
|------------|---------|
| **Docker** | Container runtime |
| **Docker Compose** | Multi-container orchestration |

---

## 📖 How to Use the System

### **Step 1: Start the System**

```bash
# Navigate to project directory
cd C:\Users\aiman\Projects\Monitoring_System_TonyPi

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### **Step 2: Access the Applications**

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3001 | No auth required |
| **Backend API** | http://localhost:8000 | No auth required |
| **API Documentation** | http://localhost:8000/docs | Interactive Swagger UI |
| **Grafana** | http://localhost:3000 | admin / admin |
| **InfluxDB** | http://localhost:8086 | admin / adminpass |

### **Step 3: Connect a Robot**

#### **Option A: Using Simulator (Testing)**
```bash
# Navigate to robot_client folder
cd robot_client

# Install dependencies
pip install paho-mqtt psutil

# Run simulator
python simulator.py
```

#### **Option B: Connect Real TonyPi Robot**
```bash
# On Raspberry Pi 5
cd ~/robot_client
pip3 install -r requirements.txt

# Run client (replace YOUR_PC_IP with your PC's IP)
python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
```

### **Step 4: Navigate the Frontend**

#### **Overview Tab**
- View robot connection status
- See system health metrics
- Monitor real-time robot status
- Trigger QR code scans
- View job summaries

#### **Performance Tab**
- **Task Manager UI**: CPU, Memory, Disk, Temperature
- **Real-Time Charts**: Historical data visualization
- **Auto-Refresh**: Updates every 5 seconds
- **Multi-Robot Support**: Switch between robots

#### **Jobs Tab**
- View active jobs
- Track job progress (items processed, percentage)
- View job history
- Filter by robot, date, status

#### **Robots Tab**
- List all connected robots
- View robot details (status, location, battery)
- Manage robot configurations
- See last seen timestamps

#### **Monitoring Tab**
- Embedded Grafana panels
- Advanced time-series visualizations
- Customizable dashboards

### **Step 5: Use the API**

#### **Check System Health**
```bash
curl http://localhost:8000/api/health
```

#### **Get Robot Status**
```bash
curl http://localhost:8000/api/robot-data/status
```

#### **Query Sensor Data**
```bash
curl "http://localhost:8000/api/robot-data/sensors?measurement=sensors&time_range=1h&robot_id=tonypi_raspberrypi"
```

#### **Send Robot Command**
```bash
curl -X POST http://localhost:8000/api/management/command \
  -H "Content-Type: application/json" \
  -d '{
    "robot_id": "tonypi_raspberrypi",
    "type": "move",
    "direction": "forward",
    "distance": 1.0,
    "speed": 0.5
  }'
```

#### **Get Job History**
```bash
curl http://localhost:8000/api/robots-db/jobs/history
```

### **Step 6: View Data in Grafana**

1. Login to Grafana: http://localhost:3000 (admin/admin)
2. Navigate to **Dashboards** → **TonyPi Dashboard**
3. View pre-configured panels:
   - CPU Usage over time
   - Memory consumption
   - Temperature trends
   - Sensor data visualization
   - Battery status
   - Servo angle tracking

### **Step 7: Monitor MQTT Messages**

```bash
# Subscribe to all robot topics
docker exec -it tonypi_mosquitto mosquitto_sub -t "tonypi/#" -v
```

### **Step 8: Query Databases**

#### **PostgreSQL**
```bash
# Connect to database
docker exec -it tonypi_postgres psql -U postgres -d tonypi_db

# View robots
SELECT * FROM robots;

# View jobs
SELECT * FROM jobs ORDER BY start_time DESC LIMIT 10;
```

#### **InfluxDB**
```bash
# Query via API
curl -XPOST "http://localhost:8086/api/v2/query?org=tonypi" \
  -H "Authorization: Token my-super-secret-auth-token" \
  -H "Content-Type: application/vnd.flux" \
  -d 'from(bucket: "robot_data")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_measurement"] == "sensors")
        |> limit(n: 10)'
```

---

## 🤖 Servo Data Retrieval from Raspberry Pi 5

### **✅ YES - It is Possible!**

The system **can retrieve data from robot servos** running on Raspberry Pi 5, even with multiple servos of the same brand. Here's how:

### **Current Implementation Status**

#### **✅ Already Working**
- **Servo Angle Tracking**: Currently implemented and working
  - Tracks head/camera servo position
  - Data flows: Robot → MQTT → Backend → InfluxDB → Frontend
  - Visible in Grafana dashboards and frontend

#### **⚠️ Enhanced Servo Monitoring (Ready to Implement)**
The system architecture supports full servo monitoring. You need to add hardware-specific code to read servo parameters.

### **What Servo Data Can Be Retrieved**

For **serial bus servos** (common in TonyPi robots like HTS/LX series):

| Parameter | Description | Unit | Retrievable |
|-----------|-------------|------|-------------|
| **Temperature** | Internal motor temperature | °C | ✅ Yes |
| **Position/Angle** | Current servo angle | Degrees | ✅ Yes (already working) |
| **Load/Torque** | Current load on servo | % | ✅ Yes |
| **Voltage** | Input voltage to servo | V | ✅ Yes |
| **Current** | Current draw | mA | ✅ Yes |
| **Speed** | Rotation speed | RPM | ✅ Yes |
| **Error Status** | Overload, overheat, stall | Boolean | ✅ Yes |

### **How to Implement Full Servo Monitoring**

#### **Step 1: Install Hardware SDK on Raspberry Pi 5**

For **HiWonder TonyPi** robots:
```bash
# SSH into Raspberry Pi 5
ssh pi@your-robot-ip

# Install HiwonderSDK
cd ~
git clone https://github.com/Hiwonder-docs/hiwonder-sdk-python.git
cd hiwonder-sdk-python
sudo pip3 install .
```

For **other servo brands** (e.g., LX-16A, Dynamixel):
```bash
# Install appropriate library
pip3 install pyserial  # For serial communication
# Or use brand-specific SDK
```

#### **Step 2: Enable Serial Port on Raspberry Pi 5**

```bash
# Edit boot configuration
sudo nano /boot/config.txt

# Add these lines:
enable_uart=1
dtoverlay=pi3-disable-bt

# Reboot
sudo reboot
```

#### **Step 3: Update Robot Client Code**

Add servo monitoring to `robot_client/tonypi_client.py`:

```python
# Add to imports
try:
    from hiwonder import Board  # TonyPi SDK
    MOTOR_SDK_AVAILABLE = True
except ImportError:
    MOTOR_SDK_AVAILABLE = False
    logger.warning("Motor SDK not available, using simulated data")

class TonyPiRobotClient:
    def __init__(self, ...):
        # ... existing code ...
        
        # Define servo IDs (TonyPi typically has 4-8 servos)
        self.servo_ids = {
            1: "left_front_leg",
            2: "left_rear_leg", 
            3: "right_front_leg",
            4: "right_rear_leg",
            5: "head_pan",
            6: "head_tilt"
        }

    def get_servo_status(self) -> Dict[str, Any]:
        """Get status of all servos"""
        servo_data = {}
        
        if MOTOR_SDK_AVAILABLE:
            for servo_id, servo_name in self.servo_ids.items():
                try:
                    # Read servo parameters using SDK
                    temp = Board.getBusServoTemp(servo_id)  # Temperature in °C
                    pos = Board.getBusServoPosition(servo_id)  # Position in degrees
                    load = Board.getBusServoLoad(servo_id)  # Load in percentage
                    voltage = Board.getBusServoVin(servo_id)  # Voltage in mV
                    
                    servo_data[servo_name] = {
                        "id": servo_id,
                        "temperature": temp / 10.0 if temp else 25.0,
                        "position": pos,
                        "load": abs(load) if load else 0,
                        "voltage": voltage / 1000.0 if voltage else 5.0,
                    }
                except Exception as e:
                    logger.error(f"Error reading servo {servo_id}: {e}")
                    servo_data[servo_name] = {"error": str(e)}
        else:
            # Simulated data for testing
            import random
            for servo_id, servo_name in self.servo_ids.items():
                servo_data[servo_name] = {
                    "id": servo_id,
                    "temperature": round(random.uniform(35, 70), 1),
                    "position": random.randint(-90, 90),
                    "load": round(random.uniform(10, 85), 1),
                    "voltage": round(random.uniform(4.8, 5.2), 2),
                }
        
        return servo_data

    def send_servo_status(self):
        """Publish servo status to MQTT"""
        servo_status = self.get_servo_status()
        
        payload = {
            "robot_id": self.robot_id,
            "timestamp": datetime.now().isoformat(),
            "servos": servo_status
        }
        
        # Publish to servo-specific topic
        servo_topic = f"tonypi/servos/{self.robot_id}"
        self.client.publish(servo_topic, json.dumps(payload))
```

#### **Step 4: Update Main Loop**

In `robot_client/tonypi_client.py`, add to the `run()` method:

```python
async def run(self):
    """Main loop"""
    # ... existing code ...
    
    while self.running:
        # ... existing sensor data sending ...
        
        # Send servo status every 5 seconds
        if current_time - last_servo_time >= 5:
            self.send_servo_status()
            last_servo_time = current_time
```

#### **Step 5: Backend Will Automatically Handle It**

The existing MQTT client in `backend/mqtt/mqtt_client.py` will:
- ✅ Receive servo data from MQTT topic `tonypi/servos/{robot_id}`
- ✅ Store it in InfluxDB automatically
- ✅ Make it available via API endpoints

#### **Step 6: View Servo Data**

**Via API:**
```bash
curl "http://localhost:8000/api/robot-data/sensors?measurement=servos&time_range=1h&robot_id=tonypi_raspberrypi"
```

**Via Frontend:**
- Servo data will appear in the Monitoring tab
- Can be visualized in Grafana dashboards

**Via Grafana:**
- Create custom panels for servo temperature, load, voltage
- Query InfluxDB measurement: `servos`

### **Multiple Servos of Same Brand**

✅ **Fully Supported!** The system handles multiple servos by:

1. **Servo ID Mapping**: Each servo has a unique ID (1, 2, 3, etc.)
2. **Named Identification**: Servos are named (e.g., "left_front_leg", "head_pan")
3. **Tagged Storage**: InfluxDB stores each servo with tags:
   - `robot_id`: Which robot
   - `servo_id`: Servo hardware ID
   - `servo_name`: Human-readable name
4. **Individual Monitoring**: Each servo's data is tracked separately
5. **Aggregated Views**: Can view all servos together or filter by specific servo

### **Example: Monitoring 6 Servos**

```python
# In robot_client/tonypi_client.py
self.servo_ids = {
    1: "servo_1_left_front",
    2: "servo_2_left_rear",
    3: "servo_3_right_front",
    4: "servo_4_right_rear",
    5: "servo_5_head_pan",
    6: "servo_6_head_tilt"
}

# All 6 servos will be:
# - Read individually
# - Published to MQTT
# - Stored in InfluxDB with unique tags
# - Queryable via API
# - Visualizable in Grafana
```

### **Testing Without Hardware**

The system includes **simulation mode**:
- If SDK is not installed, it uses simulated servo data
- Allows testing the complete monitoring pipeline
- No hardware required for development

### **Summary: Servo Data Retrieval**

| Feature | Status | Notes |
|---------|--------|-------|
| **Servo Angle** | ✅ Working | Already implemented |
| **Servo Temperature** | ⚠️ Ready | Needs SDK integration |
| **Servo Load/Torque** | ⚠️ Ready | Needs SDK integration |
| **Servo Voltage** | ⚠️ Ready | Needs SDK integration |
| **Multiple Servos** | ✅ Supported | Architecture supports unlimited servos |
| **Same Brand Servos** | ✅ Supported | Servo IDs differentiate them |
| **Real-Time Updates** | ✅ Working | MQTT → InfluxDB → Frontend |
| **Historical Data** | ✅ Working | Stored in InfluxDB |
| **Visualization** | ✅ Working | Grafana dashboards |

**Answer: YES, it is absolutely possible to retrieve data from robot servos on Raspberry Pi 5, even with multiple servos of the same brand. The system architecture fully supports this, and you just need to add the hardware SDK integration code (which is well-documented in `MOTOR_MONITORING.md`).**

---

## 📚 Additional Resources

- **Quick Start Guide**: `QUICK_START_GUIDE.md`
- **Motor Monitoring Details**: `MOTOR_MONITORING.md`
- **API Documentation**: http://localhost:8000/docs
- **Robot Client Setup**: `robot_client/README.md`
- **System Status**: `SYSTEM_STATUS_REPORT.md`

---

**Last Updated**: December 2025
**System Version**: 1.0



