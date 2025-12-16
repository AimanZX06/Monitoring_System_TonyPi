# Database Usage Status Report

## Overview
This document explains how InfluxDB and PostgreSQL are currently being used in the TonyPi Monitoring System.

---

## ✅ InfluxDB - ACTIVELY USED

### Configuration
- **URL**: http://influxdb:8086 (internal) / http://localhost:8086 (external)
- **Version**: v2.7.12
- **Organization**: tonypi
- **Bucket**: robot_data
- **Token**: my-super-secret-auth-token
- **Status**: ✅ Running and actively storing data

### Current Usage

#### 1. **Robot Performance Metrics** (`robot_status` measurement)
   - **Source**: Robot client publishes via MQTT topic `tonypi/pi_status/{robot_id}`
   - **Fields**:
     - `system_cpu_percent` - CPU usage percentage
     - `system_memory_percent` - Memory usage percentage
     - `system_disk_usage` - Disk usage percentage
     - `system_temperature` - CPU temperature in Celsius
     - `system_uptime` - System uptime in seconds
   - **Tags**:
     - `robot_id` - Unique identifier (e.g., tonypi_raspberrypi)
   - **Used By**:
     - Performance tab (Task Manager UI)
     - Dashboard statistics
     - Reports generation
     - CSV/JSON export

#### 2. **Sensor Data** (`sensors` measurement)
   - **Source**: MQTT topic `tonypi/sensors/{robot_id}`
   - **Fields**: Various sensor readings (temperature, humidity, etc.)
   - **Tags**: robot_id, sensor_type
   - **Used By**: Overview tab sensor display

#### 3. **Battery Data** (`battery` measurement)
   - **Source**: MQTT topic `tonypi/battery/{robot_id}`
   - **Fields**: battery_level, voltage, current
   - **Tags**: robot_id
   - **Used By**: Robot status displays, multi-robot management

#### 4. **Location Data** (`location` measurement)
   - **Source**: MQTT topic `tonypi/location/{robot_id}`
   - **Fields**: x, y, z coordinates
   - **Tags**: robot_id
   - **Used By**: Robot position tracking

#### 5. **Robot Status** (`robot_status` measurement)
   - **Source**: MQTT topic `tonypi/status/{robot_id}`
   - **Fields**: status, mode, error_count
   - **Tags**: robot_id
   - **Used By**: Connection status, health monitoring

### Data Flow
```
Robot Client (Raspberry Pi)
    ↓ (publishes MQTT)
Mosquitto Broker
    ↓ (subscribes)
Backend MQTT Handler (mqtt_client.py)
    ↓ (writes)
InfluxDB
    ↓ (queries)
Backend API Endpoints
    ↓ (fetches)
Frontend UI
```

### API Endpoints Using InfluxDB
1. **GET /api/robot-data/sensor/{measurement}** - Query specific measurements
2. **GET /api/robot-data/robots** - List all robots with latest data
3. **GET /api/robot-data/robot/{robot_id}** - Get specific robot details
4. **GET /api/pi-perf/{time_range}** - Raspberry Pi performance metrics
5. **GET /api/reports** - Generate reports from InfluxDB data
6. **GET /api/reports/export/csv** - Export data to CSV
7. **GET /api/reports/export/json** - Export data to JSON

### Files Using InfluxDB
- `backend/database/influx_client.py` - Client wrapper
- `backend/mqtt/mqtt_client.py` - Writes MQTT data to InfluxDB
- `backend/routers/robot_data.py` - Queries robot data
- `backend/routers/pi_perf.py` - Queries performance metrics
- `backend/routers/reports.py` - Generates reports from InfluxDB

### Verification
```bash
# Check InfluxDB logs
docker compose logs influxdb --tail 50

# Query data directly
docker exec -it tonypi_influxdb influx query "from(bucket: \"robot_data\") |> range(start: -1h)"
```

---

## ⚠️ PostgreSQL - CONFIGURED BUT NOT ACTIVELY USED

### Configuration
- **URL**: postgresql://postgres:postgres@postgres:5432/tonypi_db
- **Version**: PostgreSQL 15.14
- **Status**: ✅ Running but minimal usage

### Current State

#### Database Setup
The PostgreSQL database is initialized with:
- Database name: `tonypi_db`
- Schema: Defined via SQLAlchemy models
- Connection pool: Configured in `backend/database/database.py`

#### Limited Usage
PostgreSQL is currently **defined but not actively used** for data storage:

1. **Database Connection Available**:
   - SQLAlchemy engine created in `database/database.py`
   - Session factory configured
   - `get_db()` dependency available for FastAPI endpoints

2. **No Active Models**:
   - No SQLAlchemy models defined yet
   - No tables created
   - No data being persisted

3. **Mentioned in Code**:
   - `backend/database/database.py` - Connection setup only
   - `backend/mqtt/mqtt_client.py` - Comment mentions PostgreSQL for command status
   - `backend/job_store.py` - Comment suggests PostgreSQL for production persistence
   - `backend/routers/management.py` - Status check only

### Why PostgreSQL Isn't Used Yet

1. **Time-Series Data Fits InfluxDB Better**:
   - Robot metrics (CPU, memory, temperature) are time-series data
   - InfluxDB provides better performance for time-series queries
   - Built-in retention policies and downsampling

2. **Job Store Uses In-Memory Storage**:
   - Current implementation uses Python dictionary (`job_store`)
   - Data is lost on backend restart
   - Suitable for development/testing

### Recommended PostgreSQL Use Cases

Consider using PostgreSQL for:

1. **Job Persistence** (High Priority):
   ```python
   # Example model for jobs
   class Job(Base):
       __tablename__ = "jobs"
       id = Column(Integer, primary_key=True)
       robot_id = Column(String, index=True)
       start_time = Column(DateTime)
       end_time = Column(DateTime)
       items_total = Column(Integer)
       items_done = Column(Integer)
       percent_complete = Column(Float)
       last_item = Column(JSON)
   ```

2. **Robot Configuration**:
   - Robot profiles, names, configuration settings
   - User-defined thresholds and alerts
   - Robot maintenance history

3. **User Management** (Future):
   - User accounts and authentication
   - Roles and permissions
   - Audit logs

4. **System Configuration**:
   - Dashboard preferences
   - Alert rules
   - Report templates

### Verification
```bash
# Check PostgreSQL logs
docker compose logs postgres --tail 30

# Connect to database
docker exec -it tonypi_postgres psql -U postgres -d tonypi_db

# List tables (should be empty currently)
\dt
```

---

## 📊 Database Comparison

| Feature | InfluxDB | PostgreSQL |
|---------|----------|------------|
| **Current Status** | ✅ Actively Used | ⚠️ Ready but Unused |
| **Data Type** | Time-series metrics | Relational data |
| **Use Case** | Real-time monitoring | Configuration & persistence |
| **Performance** | Optimized for time-series | General purpose |
| **Queries** | Flux query language | SQL |
| **Retention** | Automatic downsampling | Manual management |

---

## 🔧 Recommendations

### Immediate Actions
✅ **InfluxDB is working perfectly** - No action needed

⚠️ **PostgreSQL Usage** - Consider implementing:
1. Persist job data to PostgreSQL instead of in-memory storage
2. Store robot configuration and metadata
3. Create database migrations using Alembic

### Migration Plan for Job Store

If you want to persist jobs to PostgreSQL:

1. **Create SQLAlchemy Model**:
```python
# backend/models/job.py
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON
from database.database import Base

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(String, index=True)
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    items_total = Column(Integer)
    items_done = Column(Integer, default=0)
    percent_complete = Column(Float, default=0.0)
    last_item = Column(JSON, nullable=True)
```

2. **Create Tables**:
```python
# Run once to create tables
from database.database import engine, Base
Base.metadata.create_all(bind=engine)
```

3. **Update job_store.py**:
Replace in-memory dict with database operations

### Example: Check What's in PostgreSQL

```bash
# Connect to PostgreSQL
docker exec -it tonypi_postgres psql -U postgres -d tonypi_db

# Check if tables exist
\dt

# Check database size
SELECT pg_size_pretty(pg_database_size('tonypi_db'));

# Exit
\q
```

---

## Summary

- ✅ **InfluxDB**: Fully operational and storing all robot metrics
- ⚠️ **PostgreSQL**: Running and ready, but not storing any data yet
- 💡 **Next Step**: Decide if you want to persist job data to PostgreSQL

Both databases are correctly configured and working. InfluxDB handles all time-series data (performance metrics, sensors). PostgreSQL is available for relational data but currently unused.
