# 🤖 TonyPi Robot Monitoring System

A comprehensive full-stack monitoring, analytics, and management system for HiWonder TonyPi robots (Raspberry Pi 5). Real-time data collection, AI-powered insights, and a modern web interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

---

## ✨ Features

### 📊 Real-Time Monitoring
- **Live Telemetry**: CPU, Memory, Disk, Temperature via MQTT
- **Task Manager View**: Windows-style system performance dashboard
- **Sensor Dashboard**: IMU, light sensors, ultrasonic, and more
- **Servo Monitoring**: Position, temperature, voltage for all 6 servos
- **Camera Streaming**: Live video feed from robot camera

### 🤖 Robot Management
- **Multi-Robot Support**: Monitor multiple TonyPi robots simultaneously
- **Remote Commands**: Send commands to robots in real-time
- **Job Tracking**: Track robot tasks and job progress
- **Location Tracking**: GPS/position updates

### 📈 Data & Analytics
- **AI-Powered Insights**: Google Gemini integration for intelligent analysis
- **Time-Series Storage**: InfluxDB for sensor data history
- **Custom Reports**: Generate and export PDF reports
- **Grafana Dashboards**: Advanced data visualization

### 🔐 User Management
- **Role-Based Access**: Admin, Operator, Viewer roles
- **Authentication**: Secure login system
- **Audit Logs**: Track all system activities

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING SERVER                            │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Frontend │  │ Backend  │  │ Grafana  │  │   MQTT   │       │
│  │  :3001   │  │  :8000   │  │  :3000   │  │  :1883   │       │
│  │  React   │  │ FastAPI  │  │          │  │Mosquitto │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │              │              │
│       └─────────────┴─────────────┴──────────────┘              │
│                           │                                     │
│              ┌────────────┴────────────┐                       │
│              │                         │                        │
│        ┌─────┴─────┐            ┌──────┴─────┐                 │
│        │ PostgreSQL│            │  InfluxDB  │                 │
│        │   :5432   │            │   :8086    │                 │
│        │  Metadata │            │ Time-series│                 │
│        └───────────┘            └────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                         MQTT/HTTP
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     TONYPI ROBOT                                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    main.py                                │  │
│  │  • MQTT Telemetry Client                                 │  │
│  │  • Camera Stream Server (:8080)                          │  │
│  │  • Vision AI (QR codes, colors, faces)                   │  │
│  │  • Voice Module (TTS with Piper)                         │  │
│  │  • Hardware Control (servos, sensors)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Hardware: Camera, 6 Servos, IMU, Light Sensor, Ultrasonic    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### Monitoring Server (Your Computer)
- ✅ Docker Desktop
- ✅ Docker Compose v2.0+
- ✅ 8GB+ RAM recommended
- ✅ Ports available: 1883, 3000, 3001, 5432, 8000, 8086, 9001

### TonyPi Robot (Raspberry Pi)
- ✅ Python 3.8+
- ✅ Camera connected
- ✅ Network connectivity to monitoring server

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Monitoring_System_TonyPi.git
cd Monitoring_System_TonyPi
```

### 2. Configure Environment
Create a `.env` file in the project root:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=tonypi_db

# InfluxDB
INFLUXDB_TOKEN=my-super-secret-auth-token
INFLUXDB_ORG=tonypi
INFLUXDB_BUCKET=robot_data

# MQTT
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883

# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin

# AI Analytics (Optional - Free tier)
# Get your key: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-api-key-here
```

### 3. Start All Services
```bash
docker-compose up -d
```

### 4. Access the System

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3001 | - |
| **Backend API** | http://localhost:8000 | - |
| **API Docs** | http://localhost:8000/docs | Interactive Swagger |
| **Grafana** | http://localhost:3000 | admin / admin |
| **InfluxDB** | http://localhost:8086 | admin / adminpass |

### 5. Connect Your Robot
On your TonyPi robot:
```bash
cd tonyPi/FYP_Robot
export MQTT_BROKER=YOUR_PC_IP
python3 main.py
```

---

## 🖥️ Frontend Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview with robot status, stats, and quick actions |
| **Monitoring** | Task Manager-style CPU, Memory, Disk, Temperature view |
| **Robots** | Robot grid with camera feeds and terminal output |
| **Sensors** | Real-time sensor data charts (IMU, light, ultrasonic) |
| **Servos** | Servo status with position, temperature, voltage |
| **Jobs** | Job tracking and progress monitoring |
| **Reports** | Generate and view AI-powered PDF reports |
| **Logs** | Real-time system logs with filtering |
| **Alerts** | Alert management and configuration |
| **Users** | User management (Admin only) |

---

## 📡 MQTT Topics

### Robot → Server
```
tonypi/status/{robot_id}           # Robot status & system metrics
tonypi/sensors/{robot_id}          # Sensor data (IMU, light, etc.)
tonypi/servos/{robot_id}           # Servo positions & status
tonypi/battery/{robot_id}          # Battery level
tonypi/location/{robot_id}         # GPS/position
tonypi/camera/{robot_id}           # Camera events
tonypi/logs/{robot_id}             # Robot logs
```

### Server → Robot
```
tonypi/commands/{robot_id}         # Commands to robot
tonypi/config/{robot_id}           # Configuration updates
```

---

## 🔧 API Endpoints

### Health & Status
- `GET /api/health` - System health check
- `GET /api/management/system/status` - Detailed system status

### Robot Data
- `GET /api/robot-data/status` - Current robot status
- `GET /api/robot-data/sensors` - Query sensor data
- `GET /api/robots-db/robots` - List all robots
- `GET /api/robots-db/stats` - Robot statistics

### Performance Metrics
- `GET /api/pi-perf/status` - Raspberry Pi performance
- `GET /api/pi-perf/history` - Performance history

### Management
- `POST /api/management/command` - Send command to robot
- `POST /api/management/robots/{id}/emergency-stop` - Emergency stop

### Reports & Logs
- `GET /api/reports` - List reports
- `POST /api/reports` - Create new report
- `GET /api/robots-db/logs` - System logs

Full documentation: http://localhost:8000/docs

---

## 🐳 Docker Services

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| mosquitto | tonypi_mosquitto | 1883, 9001 | MQTT broker |
| influxdb | tonypi_influxdb | 8086 | Time-series data |
| postgres | tonypi_postgres | 5432 | Relational data |
| grafana | tonypi_grafana | 3000 | Visualization |
| backend | tonypi_backend | 8000 | FastAPI server |
| frontend | tonypi_frontend | 3001 | React app |

### Common Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Stop all
docker-compose down

# Reset everything (removes data)
docker-compose down -v
```

---

## 🤖 Robot Setup

The robot code is in `tonyPi/FYP_Robot/`. See [COMPLETE_SYSTEM_STARTUP_GUIDE.md](COMPLETE_SYSTEM_STARTUP_GUIDE.md) for detailed setup instructions.

### Quick Start on Robot
```bash
# SSH into your TonyPi
ssh pi@<robot-ip>

# Navigate to robot code
cd tonyPi/FYP_Robot

# Set MQTT broker IP
export MQTT_BROKER=<your-pc-ip>

# Run robot
python3 main.py
```

### Robot Features
- **Camera Streaming**: MJPEG stream on port 8080
- **Vision AI**: QR code, color, and face detection
- **Voice**: Text-to-speech with Piper TTS
- **Telemetry**: Auto-sends system metrics every 5 seconds
- **Servo Control**: 6 servo positions and status

---

## 🧠 AI Analytics (Optional)

The system includes Google Gemini AI integration for intelligent data analysis:

- **Performance Analysis**: CPU, memory, temperature insights
- **Anomaly Detection**: Identify unusual patterns
- **Report Generation**: AI-powered PDF reports
- **Recommendations**: Actionable suggestions

### Setup
1. Get a free API key: https://aistudio.google.com/app/apikey
2. Add to `.env`: `GEMINI_API_KEY=your-key`
3. Restart backend: `docker-compose restart backend`

Free tier limits (generous):
- 15 requests/minute
- 1 million tokens/minute
- 1,500 requests/day

---

## 🛠️ Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Database Access
```bash
# PostgreSQL
docker exec -it tonypi_postgres psql -U postgres -d tonypi_db

# InfluxDB
curl http://localhost:8086/ping
```

---

## 🐛 Troubleshooting

### Services not starting
```bash
docker-compose ps
docker-compose logs [service]
```

### MQTT connection issues
```bash
# Test broker
mosquitto_pub -h localhost -p 1883 -t "test" -m "hello"

# Check logs
docker-compose logs mosquitto
```

### Robot not appearing
1. Verify MQTT broker IP is correct
2. Check firewall allows port 1883
3. Test: `ping <pc-ip>` from robot
4. Check backend logs: `docker-compose logs backend`

### Database errors
```bash
# PostgreSQL
docker exec -it tonypi_postgres pg_isready

# InfluxDB
curl http://localhost:8086/ping
```

---

## 📁 Project Structure

```
Monitoring_System_TonyPi/
├── backend/                 # FastAPI backend
│   ├── routers/            # API routes
│   ├── services/           # Business logic (Gemini AI)
│   ├── models/             # Database models
│   ├── database/           # DB connections
│   └── mqtt/               # MQTT client
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Shared components
│   │   ├── contexts/      # React contexts
│   │   └── utils/         # Helpers & API
├── tonyPi/FYP_Robot/       # Robot code
│   ├── main.py            # Main robot controller
│   ├── modules/           # Robot modules
│   └── actions/           # Robot actions
├── grafana/               # Grafana config
├── mosquitto/             # MQTT config
├── postgres/              # PostgreSQL init
├── influxdb/              # InfluxDB config
├── docker-compose.yml     # Docker orchestration
└── .env                   # Environment config
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [HiWonder](https://www.hiwonder.com/) for TonyPi robot hardware
- [Eclipse Mosquitto](https://mosquitto.org/) for MQTT broker
- [InfluxDB](https://www.influxdata.com/) for time-series database
- [Grafana](https://grafana.com/) for visualization
- [Google Gemini](https://ai.google.dev/) for AI analytics

---


