# TonyPi Robot Monitoring System

A comprehensive full-stack monitoring, reporting, and management system for HiWonder TonyPi robots (Raspberry Pi 5). This system provides real-time data collection, visualization, and remote control capabilities through a modern web interface.

## 🚀 Features

- **Real-time Monitoring**: Live sensor data streaming via MQTT
- **Interactive Dashboard**: System overview with robot status and health metrics
- **Data Visualization**: Time-series charts using InfluxDB and Grafana
- **Remote Management**: Send commands and configure robots remotely  
- **Reporting System**: Automated and custom reports with PostgreSQL storage
- **Responsive UI**: Modern React TypeScript interface with Tailwind CSS
- **Containerized Deployment**: Complete Docker-based infrastructure

## 🏗️ Architecture

The system consists of 6 main services:

1. **MQTT Broker** (Mosquitto) - Message queuing for robot communication
2. **Time-series Database** (InfluxDB) - Sensor data storage and analytics
3. **Relational Database** (PostgreSQL) - Users, reports, configurations
4. **Visualization** (Grafana) - Advanced data visualization and dashboards
5. **Backend API** (FastAPI) - REST API with Python
6. **Frontend** (React + TypeScript) - Modern web interface

## 📋 Prerequisites

- Docker Desktop
- Docker Compose v2.0+
- 8GB+ RAM recommended
- Ports 1883, 3000, 3001, 5432, 8000, 8086, 9001 available

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Monitoring_System_TonyPi
```

### 2. Environment Configuration
The `.env` file is already configured with default values:

```bash
# Database Configuration
POSTGRES_DB=tonypi_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# InfluxDB Configuration
INFLUXDB_USERNAME=admin
INFLUXDB_PASSWORD=adminpass
INFLUXDB_ORG=tonypi
INFLUXDB_BUCKET=robot_data
INFLUXDB_TOKEN=my-super-secret-auth-token

# Grafana Configuration
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin

# MQTT Configuration
MQTT_USERNAME=tonypi
MQTT_PASSWORD=tonypi123
```

### 3. Start All Services
```bash
# Start all services in detached mode
docker-compose up -d

# View logs from all services
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Access the Applications

Once all services are running, access them via:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3001 | No auth required |
| **Backend API** | http://localhost:8000 | No auth required |
| **API Docs** | http://localhost:8000/docs | Interactive Swagger UI |
| **Grafana** | http://localhost:3000 | admin / admin |
| **InfluxDB** | http://localhost:8086 | admin / adminpass |

### 5. Verify Installation

1. **Check API Health**:
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Frontend Access**: Navigate to http://localhost:3001
   - Dashboard should show system status
   - Monitoring page shows MQTT connection status

3. **MQTT Connection**: Test MQTT broker
   ```bash
   # Install mosquitto clients (optional)
   # Ubuntu/Debian: sudo apt-get install mosquitto-clients
   # macOS: brew install mosquitto
   
   # Test publish
   mosquitto_pub -h localhost -p 1883 -t "tonypi/test" -m '{"test": "message"}'
   ```

## 📡 MQTT Topics

The system uses the following MQTT topic structure:

### Robot Data Topics
```
tonypi/sensors/{robot_id}/{sensor_type}     # Sensor data
tonypi/battery/{robot_id}                   # Battery status  
tonypi/location/{robot_id}                  # Robot position
tonypi/status/{robot_id}                    # Robot status
```

### Command Topics
```
tonypi/commands/{robot_id}                  # Commands to robot
tonypi/commands/response/{robot_id}         # Command responses
tonypi/config/{robot_id}                    # Configuration updates
```

### Example Payloads

**Sensor Data**:
```json
{
  "robot_id": "tonypi_01",
  "sensor_type": "temperature",
  "value": 24.5,
  "timestamp": "2025-09-24T10:30:00Z"
}
```

**Battery Status**:
```json
{
  "robot_id": "tonypi_01", 
  "voltage": 12.3,
  "current": 0.5,
  "percentage": 85,
  "temperature": 22.1
}
```

**Robot Command**:
```json
{
  "command": "move_forward",
  "parameters": {
    "speed": 0.5,
    "distance": 1.0
  },
  "timestamp": "2025-09-24T10:30:00Z"
}
```

## 🔧 API Endpoints

### Health & Status
- `GET /api/health` - System health check
- `GET /api/management/system/status` - Detailed system status

### Robot Data  
- `GET /api/robot-data/sensors` - Query sensor data
- `GET /api/robot-data/status` - Current robot status
- `GET /api/robot-data/latest/{robot_id}` - Latest data for robot

### Management
- `POST /api/management/command` - Send command to robot
- `GET /api/management/robots` - List all robots
- `GET /api/management/robots/{robot_id}/config` - Robot configuration
- `POST /api/management/robots/{robot_id}/emergency-stop` - Emergency stop

### Reports
- `GET /api/reports` - List reports (with filtering)
- `POST /api/reports` - Create new report
- `GET /api/reports/{id}` - Get specific report

Full API documentation: http://localhost:8000/docs

## 🐳 Docker Services

### Service Details

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| mosquitto | tonypi_mosquitto | 1883, 9001 | MQTT broker |
| influxdb | tonypi_influxdb | 8086 | Time-series data |
| postgres | tonypi_postgres | 5432 | Relational data |
| grafana | tonypi_grafana | 3000 | Visualization |
| backend | tonypi_backend | 8000 | FastAPI server |
| frontend | tonypi_frontend | 3001 | React app |

### Volume Mappings

Data persistence is configured with local directories:
- `./mosquitto/data` - MQTT persistence
- `./influxdb/data` - InfluxDB data
- `./postgres/data` - PostgreSQL data  
- `./grafana/data` - Grafana dashboards and config

### Service Dependencies

```
frontend → backend → [postgres, influxdb, mosquitto]
grafana → [influxdb, postgres]
```

## 🔧 Development

### Backend Development
```bash
cd backend

# Create virtual environment  
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Database Migrations
```bash
# Connect to PostgreSQL
docker exec -it tonypi_postgres psql -U postgres -d tonypi_db

# View tables
\dt

# Custom queries
SELECT * FROM robots;
SELECT * FROM reports ORDER BY created_at DESC LIMIT 10;
```

## 📊 Grafana Dashboards

Grafana comes pre-configured with InfluxDB and PostgreSQL datasources. Create custom dashboards:

1. Login to Grafana (admin/admin)
2. Navigate to Dashboards → New Dashboard
3. Add panels with queries:

**InfluxDB Flux Query Example**:
```flux
from(bucket: "robot_data")
  |> range(start: -1h)
  |> filter(fn: (r) => r["_measurement"] == "sensors")
  |> filter(fn: (r) => r["_field"] == "temperature")
```

**PostgreSQL Query Example**:
```sql
SELECT created_at, title, robot_id 
FROM reports 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
```

## 🐛 Troubleshooting

### Common Issues

**Services not starting**:
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

**Port conflicts**:
```bash
# Check port usage
netstat -tulpn | grep :3000

# Stop conflicting services or modify docker-compose.yml ports
```

**MQTT connection issues**:
```bash
# Test MQTT broker directly
mosquitto_pub -h localhost -p 1883 -t "test/topic" -m "test message"

# Check Mosquitto logs
docker-compose logs mosquitto
```

**Database connection errors**:
```bash
# Check PostgreSQL
docker exec -it tonypi_postgres pg_isready

# Check InfluxDB
curl http://localhost:8086/ping
```

### Reset Everything
```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images (optional)
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## 📈 Production Deployment

### Security Considerations

1. **Change default passwords** in `.env`
2. **Enable MQTT authentication** in `mosquitto.conf`
3. **Use environment-specific configs**
4. **Set up SSL/TLS** for all services
5. **Implement proper authentication** in the API

### Performance Optimization

1. **Resource limits** in docker-compose.yml
2. **InfluxDB retention policies** for data management  
3. **Database indexing** optimization
4. **MQTT QoS settings** based on requirements

### Monitoring

1. **Health checks** for all services
2. **Log aggregation** (ELK stack)
3. **Metrics collection** (Prometheus)
4. **Alerting** (AlertManager)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review Docker and service logs for debugging

---

**Built with ❤️ for HiWonder TonyPi Robot Community**
