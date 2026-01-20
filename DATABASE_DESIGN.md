# Database Design

## Overview

The TonyPi Robot Monitoring System uses a dual-database architecture:
- **PostgreSQL**: Relational database for structured data (users, robots, jobs, alerts, reports, logs)
- **InfluxDB**: Time-series database for high-frequency sensor and performance data

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PostgreSQL Database                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│      USERS        │       │      ROBOTS       │       │       JOBS        │
├───────────────────┤       ├───────────────────┤       ├───────────────────┤
│ PK id (UUID)      │       │ PK id (INT)       │       │ PK id (INT)       │
│    username       │       │ UK robot_id       │◄──────│ FK robot_id       │
│ UK email          │       │    name           │       │    start_time     │
│    password_hash  │       │    description    │       │    end_time       │
│    role           │       │    location (JSON)│       │    items_total    │
│    is_active      │       │    status         │       │    items_done     │
│    created_at     │       │    ip_address     │       │    percent_complete│
│    updated_at     │       │    camera_url     │       │    last_item (JSON)│
└───────────────────┘       │    battery_threshold_low │    status         │
                            │    battery_threshold_critical│ created_at     │
                            │    temp_threshold_warning│    updated_at     │
                            │    temp_threshold_critical└───────────────────┘
                            │    settings (JSON) │
                            │    last_seen       │              │
                            │    created_at      │              │
                            │    updated_at      │              │
                            │    is_active       │              │
                            └─────────┬─────────┘              │
                                      │                        │
                    ┌─────────────────┼────────────────────────┘
                    │                 │
                    ▼                 ▼
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│      ALERTS       │       │  ALERT_THRESHOLDS │       │     REPORTS       │
├───────────────────┤       ├───────────────────┤       ├───────────────────┤
│ PK id (INT)       │       │ PK id (INT)       │       │ PK id (INT)       │
│ FK robot_id       │       │ FK robot_id       │       │ FK robot_id       │
│    alert_type     │       │    metric_type    │       │    title          │
│    severity       │       │    warning_threshold│     │    description    │
│    title          │       │    critical_threshold│    │    report_type    │
│    message        │       │    enabled        │       │    data (JSON)    │
│    source         │       │    created_at     │       │    file_path      │
│    value          │       │    updated_at     │       │    created_at     │
│    threshold      │       └───────────────────┘       │    created_by     │
│    acknowledged   │                                   └───────────────────┘
│    acknowledged_by│
│    acknowledged_at│       ┌───────────────────┐
│    resolved       │       │   SYSTEM_LOGS     │
│    resolved_at    │       ├───────────────────┤
│    details (JSON) │       │ PK id (INT)       │
│    created_at     │       │    level          │
└───────────────────┘       │    category       │
                            │    message        │
                            │ FK robot_id       │
                            │    details (JSON) │
                            │    timestamp      │
                            └───────────────────┘
```

## PostgreSQL Schema

### 1. Users Table

Stores user accounts with authentication and authorization data.

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,              -- UUID as string
    username VARCHAR(50) UNIQUE NOT NULL,    -- Login username
    email VARCHAR(100) UNIQUE NOT NULL,      -- Email address
    password_hash VARCHAR(255) NOT NULL,     -- Bcrypt hashed password
    role VARCHAR(20) DEFAULT 'viewer',       -- admin, operator, viewer
    is_active BOOLEAN DEFAULT TRUE,          -- Account status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Role Definitions:**
| Role | Permissions |
|------|-------------|
| `admin` | Full system access, user management, configuration |
| `operator` | Robot control, job management, alert handling |
| `viewer` | Read-only access to dashboards and reports |

### 2. Robots Table

Stores robot configuration, settings, and metadata.

```sql
CREATE TABLE robots (
    id SERIAL PRIMARY KEY,
    robot_id VARCHAR(50) UNIQUE NOT NULL,    -- Unique robot identifier (e.g., tonypi_01)
    name VARCHAR(100),                        -- Friendly name
    description TEXT,                         -- Robot description
    location JSONB,                           -- {x: float, y: float, z: float}
    status VARCHAR(20) DEFAULT 'offline',    -- online, offline, error, maintenance
    ip_address VARCHAR(45),                   -- Robot's IP address
    camera_url VARCHAR(255),                  -- Camera stream URL
    battery_threshold_low FLOAT DEFAULT 20.0,
    battery_threshold_critical FLOAT DEFAULT 10.0,
    temp_threshold_warning FLOAT DEFAULT 70.0,
    temp_threshold_critical FLOAT DEFAULT 80.0,
    settings JSONB,                           -- Additional custom settings
    last_seen TIMESTAMP WITH TIME ZONE,      -- Last communication timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_robots_robot_id ON robots(robot_id);
CREATE INDEX idx_robots_status ON robots(status);
CREATE INDEX idx_robots_is_active ON robots(is_active);
```

**Status Values:**
| Status | Description |
|--------|-------------|
| `online` | Robot is connected and operational |
| `offline` | Robot is not connected |
| `error` | Robot is experiencing errors |
| `maintenance` | Robot is under maintenance |

**Location JSON Structure:**
```json
{
  "x": 0.0,
  "y": 0.0,
  "z": 0.0,
  "heading": 0.0
}
```

### 3. Jobs Table

Tracks job execution and progress.

```sql
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    robot_id VARCHAR(50) NOT NULL,           -- Reference to robot
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    items_total INTEGER,                      -- Total items to process
    items_done INTEGER DEFAULT 0,             -- Completed items
    percent_complete FLOAT DEFAULT 0.0,
    last_item JSONB,                          -- Last processed item data
    status VARCHAR(20) DEFAULT 'active',     -- active, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_jobs_robot_id ON jobs(robot_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_start_time ON jobs(start_time);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
```

**Job Status Values:**
| Status | Description |
|--------|-------------|
| `active` | Job is currently running |
| `completed` | Job finished successfully |
| `failed` | Job terminated with errors |

### 4. Alerts Table

Stores system alerts and notifications.

```sql
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    robot_id VARCHAR(50),                    -- Nullable for system-wide alerts
    alert_type VARCHAR(50) NOT NULL,         -- temperature, battery, servo, system
    severity VARCHAR(20) NOT NULL,           -- critical, warning, info
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100),                      -- e.g., servo_1, cpu, battery
    value FLOAT,                              -- The value that triggered the alert
    threshold FLOAT,                          -- The threshold that was exceeded
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(50),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    details JSONB,                            -- Additional structured data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_alerts_robot_id ON alerts(robot_id);
CREATE INDEX idx_alerts_alert_type ON alerts(alert_type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
```

**Alert Types:**
| Type | Description |
|------|-------------|
| `temperature` | CPU/Servo temperature alerts |
| `battery` | Low battery warnings |
| `servo` | Servo motor issues |
| `system` | General system alerts |
| `network` | Connection issues |
| `performance` | High CPU/memory usage |

**Severity Levels:**
| Severity | Description | Color Code |
|----------|-------------|------------|
| `critical` | Immediate attention required | Red |
| `warning` | Potential issue | Yellow |
| `info` | Informational notice | Blue |

### 5. Alert Thresholds Table

Configurable alert thresholds per robot.

```sql
CREATE TABLE alert_thresholds (
    id SERIAL PRIMARY KEY,
    robot_id VARCHAR(50),                    -- NULL for global defaults
    metric_type VARCHAR(50) NOT NULL,        -- cpu, memory, temperature, battery, servo_temp
    warning_threshold FLOAT NOT NULL,
    critical_threshold FLOAT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_alert_thresholds_robot_id ON alert_thresholds(robot_id);
CREATE INDEX idx_alert_thresholds_metric_type ON alert_thresholds(metric_type);
```

**Default Thresholds:**
| Metric Type | Warning | Critical |
|-------------|---------|----------|
| `cpu` | 70% | 90% |
| `memory` | 75% | 90% |
| `temperature` | 70°C | 80°C |
| `battery` | 20% | 10% |
| `servo_temp` | 60°C | 75°C |

### 6. Reports Table

Stores generated reports with metadata.

```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    robot_id VARCHAR(50),                    -- Nullable for system reports
    report_type VARCHAR(50) NOT NULL,        -- performance, job, system, custom
    data JSONB,                               -- Report content/data
    file_path VARCHAR(500),                   -- Path to generated PDF
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)                   -- User/system that created
);

-- Indexes
CREATE INDEX idx_reports_robot_id ON reports(robot_id);
CREATE INDEX idx_reports_report_type ON reports(report_type);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_title ON reports(title);
```

**Report Types:**
| Type | Description |
|------|-------------|
| `performance` | System performance analysis |
| `job` | Job execution summary |
| `system` | Overall system health |
| `battery` | Battery health analysis |
| `custom` | User-defined reports |

### 7. System Logs Table

Stores application logs and events.

```sql
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,              -- INFO, WARNING, ERROR, CRITICAL
    category VARCHAR(50) NOT NULL,           -- mqtt, api, database, system
    message TEXT NOT NULL,
    robot_id VARCHAR(50),                    -- Nullable for system logs
    details JSONB,                            -- Additional structured data
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_category ON system_logs(category);
CREATE INDEX idx_system_logs_robot_id ON system_logs(robot_id);
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp);
```

**Log Categories:**
| Category | Description |
|----------|-------------|
| `mqtt` | MQTT communication events |
| `api` | API request/response logs |
| `database` | Database operations |
| `system` | General system events |
| `auth` | Authentication events |
| `command` | Robot command execution |

---

## InfluxDB Schema

### Organization & Bucket

```
Organization: tonypi
Bucket: robot_metrics (default retention: 7 days)
```

### Measurements

#### 1. sensors

Stores environmental and sensor data.

```
Measurement: sensors

Tags:
  - robot_id: string (e.g., "tonypi_01")
  - sensor_type: string (e.g., "temperature", "humidity", "imu")
  - unit: string (e.g., "°C", "%", "m/s²")

Fields:
  - value: float

Example Point:
sensors,robot_id=tonypi_01,sensor_type=temperature,unit=°C value=42.5 1642531200000000000
```

#### 2. performance

Stores system performance metrics.

```
Measurement: performance

Tags:
  - robot_id: string
  - metric_type: string (cpu, memory, disk, network)

Fields:
  - cpu_percent: float
  - memory_percent: float
  - memory_used: integer (bytes)
  - memory_total: integer (bytes)
  - disk_percent: float
  - disk_used: integer (bytes)
  - disk_total: integer (bytes)

Example Point:
performance,robot_id=tonypi_01 cpu_percent=45.2,memory_percent=62.1 1642531200000000000
```

#### 3. servos

Stores servo motor telemetry.

```
Measurement: servos

Tags:
  - robot_id: string
  - servo_id: string (e.g., "servo_1", "servo_2")

Fields:
  - position: integer (0-4095)
  - temperature: float (°C)
  - load: float (%)
  - voltage: float (V)
  - speed: integer

Example Point:
servos,robot_id=tonypi_01,servo_id=servo_1 position=2048,temperature=45.2 1642531200000000000
```

#### 4. battery

Stores battery status data.

```
Measurement: battery

Tags:
  - robot_id: string

Fields:
  - voltage: float (V)
  - percentage: float (%)
  - current: float (A)
  - charging: boolean

Example Point:
battery,robot_id=tonypi_01 voltage=12.3,percentage=85.5,charging=false 1642531200000000000
```

#### 5. imu

Stores IMU (Inertial Measurement Unit) data.

```
Measurement: imu

Tags:
  - robot_id: string

Fields:
  - accel_x: float (m/s²)
  - accel_y: float (m/s²)
  - accel_z: float (m/s²)
  - gyro_x: float (°/s)
  - gyro_y: float (°/s)
  - gyro_z: float (°/s)
  - mag_x: float (µT)
  - mag_y: float (µT)
  - mag_z: float (µT)

Example Point:
imu,robot_id=tonypi_01 accel_x=0.1,accel_y=-0.2,accel_z=9.8 1642531200000000000
```

### InfluxDB Queries Examples

**Get latest CPU usage:**
```flux
from(bucket: "robot_metrics")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "performance")
  |> filter(fn: (r) => r._field == "cpu_percent")
  |> filter(fn: (r) => r.robot_id == "tonypi_01")
  |> last()
```

**Average sensor readings over time:**
```flux
from(bucket: "robot_metrics")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "sensors")
  |> filter(fn: (r) => r.sensor_type == "temperature")
  |> aggregateWindow(every: 1h, fn: mean)
```

**Battery history:**
```flux
from(bucket: "robot_metrics")
  |> range(start: -7d)
  |> filter(fn: (r) => r._measurement == "battery")
  |> filter(fn: (r) => r._field == "percentage")
```

---

## Data Flow

### Write Path

```
┌──────────────┐    MQTT    ┌──────────────┐   Subscribe  ┌──────────────┐
│   TonyPi     │───────────►│   Mosquitto  │─────────────►│   Backend    │
│   Robot      │  Publish   │   Broker     │              │   (FastAPI)  │
└──────────────┘            └──────────────┘              └──────┬───────┘
                                                                 │
                                    ┌────────────────────────────┴─────────────┐
                                    │                                          │
                                    ▼                                          ▼
                           ┌──────────────┐                           ┌──────────────┐
                           │   InfluxDB   │                           │  PostgreSQL  │
                           │  (metrics)   │                           │  (metadata)  │
                           └──────────────┘                           └──────────────┘
```

### Read Path

```
┌──────────────┐   REST API  ┌──────────────┐
│   Frontend   │────────────►│   Backend    │
│   (React)    │             │   (FastAPI)  │
└──────────────┘             └──────┬───────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
           ┌──────────────┐                ┌──────────────┐
           │   InfluxDB   │                │  PostgreSQL  │
           │  (time data) │                │  (entities)  │
           └──────────────┘                └──────────────┘
```

---

## Database Initialization

### PostgreSQL Init Script

Located at `postgres/init/01_init.sql`:

```sql
-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (see schema above)
-- ...

-- Insert default robot
INSERT INTO robots (robot_id, name, status) 
VALUES ('tonypi_01', 'TonyPi Robot 01', 'offline')
ON CONFLICT (robot_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_robots_status ON robots(status);
-- ... (additional indexes)
```

### Default Data

**Default Robot:**
```json
{
  "robot_id": "tonypi_01",
  "name": "TonyPi Robot 01",
  "status": "offline"
}
```

**Default Users (created by init_users.py):**
| Username | Role | Default Password |
|----------|------|------------------|
| admin | admin | admin123 |
| operator | operator | operator123 |
| viewer | viewer | viewer123 |

---

## Backup & Recovery

### PostgreSQL Backup

```bash
# Full backup
docker exec tonypi_postgres pg_dump -U postgres tonypi_db > backup.sql

# Restore
docker exec -i tonypi_postgres psql -U postgres tonypi_db < backup.sql
```

### InfluxDB Backup

```bash
# Backup
docker exec tonypi_influxdb influx backup /var/lib/influxdb2/backup

# Restore
docker exec tonypi_influxdb influx restore /var/lib/influxdb2/backup
```

---

## Performance Considerations

### Indexing Strategy

- Primary keys and foreign keys are indexed automatically
- Additional indexes on frequently queried columns
- Composite indexes for common query patterns

### Data Retention

| Database | Data Type | Retention |
|----------|-----------|-----------|
| InfluxDB | Sensor data | 7 days (configurable) |
| InfluxDB | Performance metrics | 7 days (configurable) |
| PostgreSQL | Logs | 30 days (soft limit) |
| PostgreSQL | Alerts | Indefinite |
| PostgreSQL | Reports | Indefinite |

### Connection Pooling

- SQLAlchemy manages PostgreSQL connection pool
- Default pool size: 5 connections
- Max overflow: 10 connections
