# Database Design Documentation

This chapter presents the database architecture of the TonyPi Robot Monitoring System, which employs a dual-database strategy to optimize data storage and retrieval based on data characteristics. The system utilizes PostgreSQL for relational data requiring ACID transactions and InfluxDB for high-frequency time-series telemetry data.

---

## 1. InfluxDB Time-Series Database Design

### 1.1 Diagram Overview

**Diagram Name:** TonyPi Robot Monitoring System - InfluxDB Time-Series Database Design

The InfluxDB schema diagram illustrates the time-series database structure used for storing high-frequency sensor telemetry, system metrics, and robot operational data. InfluxDB was selected for its ability to handle approximately 10 data points per second per robot while providing efficient time-range queries and automatic data downsampling.

### 1.2 InfluxDB Concepts

Before explaining the schema, it is important to understand key InfluxDB concepts:

| Concept | Description |
|---------|-------------|
| **Organization** | Top-level namespace, similar to a database in traditional RDBMS |
| **Bucket** | Container for time-series data with a defined retention policy |
| **Measurement** | Equivalent to a table in SQL databases |
| **Tag** | Indexed metadata used for fast filtering and grouping |
| **Field** | Actual data values (not indexed, optimized for storage) |
| **Timestamp** | When the data point was recorded (automatically indexed) |

### 1.3 Schema Structure

The system uses a single organization named `tonypi` with one bucket called `robot_data`. This bucket contains six measurements:

#### 1.3.1 sensor_data Measurement

Stores general sensor readings from the robot's various sensors.

| Column Type | Name | Data Type | Description |
|-------------|------|-----------|-------------|
| Tag (Indexed) | robot_id | String | Unique identifier of the robot |
| Tag (Indexed) | sensor_type | String | Type of sensor reading |
| Field (Value) | value | Float | The sensor reading value |
| Field (Value) | unit | String | Unit of measurement |
| Timestamp | _time | RFC3339 | Recording timestamp |

**sensor_type values:**
- accelerometer_x, accelerometer_y, accelerometer_z
- gyroscope_x, gyroscope_y, gyroscope_z
- cpu_temperature
- light_level
- ultrasonic_distance

**Sample Flux Query:**
```flux
from(bucket: "robot_data")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> filter(fn: (r) => r.sensor_type == "cpu_temperature")
```

#### 1.3.2 servo_data Measurement

Stores individual servo motor telemetry for health monitoring.

| Column Type | Name | Data Type | Description |
|-------------|------|-----------|-------------|
| Tag (Indexed) | robot_id | String | Unique identifier of the robot |
| Tag (Indexed) | servo_id | String | Servo motor identifier (1-6) |
| Tag (Indexed) | servo_name | String | Human-readable servo name |
| Field (Value) | position | Integer | Current position (0-1023) |
| Field (Value) | temperature | Float | Temperature in Celsius |
| Field (Value) | voltage | Float | Voltage reading in Volts |
| Timestamp | _time | RFC3339 | Recording timestamp |

**servo_id values and corresponding names:**
- 1: Right Hip Yaw
- 2: Right Hip Pitch
- 3: Right Knee
- 4: Left Hip Yaw
- 5: Left Hip Pitch
- 6: Left Knee

#### 1.3.3 robot_status Measurement

Stores system resource utilization metrics from the Raspberry Pi.

| Column Type | Name | Data Type | Description |
|-------------|------|-----------|-------------|
| Tag (Indexed) | robot_id | String | Unique identifier of the robot |
| Field (Value) | cpu_percent | Float | CPU usage percentage (0-100) |
| Field (Value) | memory_percent | Float | Memory usage percentage (0-100) |
| Field (Value) | disk_percent | Float | Disk usage percentage (0-100) |
| Field (Value) | temperature | Float | System temperature in Celsius |
| Field (Value) | is_online | Boolean | Robot connectivity status |
| Field (Value) | ip_address | String | Current IP address |
| Timestamp | _time | RFC3339 | Recording timestamp |

**Publishing Frequency:** Every 5 seconds

#### 1.3.4 battery_status Measurement

Stores battery level and charging status for power monitoring.

| Column Type | Name | Data Type | Description |
|-------------|------|-----------|-------------|
| Tag (Indexed) | robot_id | String | Unique identifier of the robot |
| Field (Value) | voltage | Float | Battery voltage |
| Field (Value) | percentage | Float | Calculated battery percentage |
| Field (Value) | charging | Boolean | Whether battery is charging |
| Timestamp | _time | RFC3339 | Recording timestamp |

**Voltage Range (3S LiPo Battery):**
- Full: 12.6V (3 cells × 4.2V)
- Nominal: 11.1V (3 cells × 3.7V)
- Empty: 9.0V (3 cells × 3.0V)

#### 1.3.5 robot_location Measurement

Stores position tracking data in 3D coordinates.

| Column Type | Name | Data Type | Description |
|-------------|------|-----------|-------------|
| Tag (Indexed) | robot_id | String | Unique identifier of the robot |
| Field (Value) | x | Float | X-axis coordinate |
| Field (Value) | y | Float | Y-axis coordinate |
| Field (Value) | z | Float | Z-axis coordinate |
| Timestamp | _time | RFC3339 | Recording timestamp |

#### 1.3.6 vision_data Measurement

Stores computer vision detection results.

| Column Type | Name | Data Type | Description |
|-------------|------|-----------|-------------|
| Tag (Indexed) | robot_id | String | Unique identifier of the robot |
| Tag (Indexed) | detection_type | String | Type of detection performed |
| Field (Value) | label | String | Detected object label |
| Field (Value) | confidence | Float | Detection confidence (0.0-1.0) |
| Field (Value) | x | Integer | Bounding box X coordinate (pixels) |
| Field (Value) | y | Integer | Bounding box Y coordinate (pixels) |
| Field (Value) | width | Integer | Bounding box width (pixels) |
| Field (Value) | height | Integer | Bounding box height (pixels) |
| Timestamp | _time | RFC3339 | Recording timestamp |

**detection_type values:**
- qr_code
- color
- face
- object

### 1.4 Design Rationale

InfluxDB was chosen for time-series data due to:

1. **High Write Throughput:** Capable of handling ~10 points/second per robot without performance degradation.
2. **Efficient Time-Range Queries:** Optimized for queries like "last 1 hour of sensor data."
3. **Automatic Downsampling:** Built-in support for reducing data granularity over time.
4. **Built-in Aggregations:** Native support for mean, sum, count, and other statistical functions.
5. **Retention Policies:** Automatic data expiration (default: 30 days) to manage storage.

### 1.5 Data Write Rate

| Data Type | Approximate Frequency |
|-----------|----------------------|
| Sensor data | ~10 points/second |
| Servo data | ~2 points/second |
| Robot status | ~0.2 points/second (every 5 seconds) |
| Battery status | ~0.1 points/second (every 10 seconds) |
| Location data | On movement activity |
| Vision data | On detection events |

---

## 2. PostgreSQL Database Design (Entity Relationship Diagram)

### 2.1 Diagram Overview

**Diagram Name:** TonyPi Robot Monitoring System - PostgreSQL Database Design (Entity Relationship Diagram)

The PostgreSQL ERD illustrates the relational database schema used for structured data that requires ACID transactions, complex relationships, and referential integrity. PostgreSQL stores user accounts, robot configurations, alerts, jobs, reports, and system logs.

### 2.2 ERD Legend

| Symbol | Meaning |
|--------|---------|
| **bold** | NOT NULL constraint |
| <<PK>> | Primary Key |
| <<FK>> | Foreign Key |
| <<UNIQUE>> | Unique Constraint |
| SERIAL | Auto-increment integer |
| TIMESTAMPTZ | Timestamp with timezone |
| JSONB | Binary JSON (indexed) |

### 2.3 Entity Descriptions

#### 2.3.1 users Table

Stores user account information for system authentication and authorization.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | VARCHAR(36) | PK | UUID primary key |
| username | VARCHAR(50) | NOT NULL, UNIQUE | Login username |
| email | VARCHAR(100) | NOT NULL, UNIQUE | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| role | VARCHAR(20) | NOT NULL | User role (admin/operator/viewer) |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| created_at | TIMESTAMPTZ | | Account creation timestamp |
| updated_at | TIMESTAMPTZ | | Last modification timestamp |

**Role Values and Permissions:**
- **admin:** Full system access including user management
- **operator:** Can control robots and acknowledge alerts
- **viewer:** Read-only access to monitoring data

#### 2.3.2 robots Table

Stores registered robot configurations and current status.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| robot_id | VARCHAR(100) | NOT NULL, UNIQUE | Unique robot identifier |
| name | VARCHAR(100) | | Human-readable robot name |
| description | TEXT | | Robot description |
| location | JSONB | | Current position {"x": 0.0, "y": 0.0, "z": 0.0} |
| status | VARCHAR(20) | DEFAULT 'offline' | Operational status |
| ip_address | VARCHAR(45) | | Robot's IP address |
| camera_url | VARCHAR(255) | | Camera stream URL |
| battery_threshold_low | FLOAT | DEFAULT 20.0 | Low battery warning threshold (%) |
| battery_threshold_critical | FLOAT | DEFAULT 10.0 | Critical battery threshold (%) |
| temp_threshold_warning | FLOAT | DEFAULT 70.0 | Temperature warning threshold (°C) |
| temp_threshold_critical | FLOAT | DEFAULT 80.0 | Critical temperature threshold (°C) |
| settings | JSONB | | Custom robot settings |
| last_seen | TIMESTAMPTZ | | Last telemetry timestamp |
| created_at | TIMESTAMPTZ | | Registration timestamp |
| updated_at | TIMESTAMPTZ | | Last modification timestamp |
| is_active | BOOLEAN | DEFAULT TRUE | Robot active status |

**Status Values:**
- **online:** Robot is connected and operational
- **offline:** Robot is not connected
- **error:** Robot is experiencing issues
- **maintenance:** Robot is under maintenance

#### 2.3.3 alerts Table

Stores system alerts generated when thresholds are exceeded.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| robot_id | VARCHAR(100) | FK | Reference to robots table |
| alert_type | VARCHAR(50) | NOT NULL | Type of alert |
| severity | VARCHAR(20) | NOT NULL | Alert severity level |
| title | VARCHAR(255) | NOT NULL | Alert title |
| message | TEXT | NOT NULL | Detailed alert message |
| source | VARCHAR(100) | | Component that generated alert |
| value | FLOAT | | Triggering metric value |
| threshold | FLOAT | | Threshold that was exceeded |
| acknowledged | BOOLEAN | DEFAULT FALSE | Whether alert was acknowledged |
| acknowledged_by | VARCHAR(50) | | Username who acknowledged |
| acknowledged_at | TIMESTAMPTZ | | Acknowledgment timestamp |
| resolved | BOOLEAN | DEFAULT FALSE | Whether alert was resolved |
| resolved_at | TIMESTAMPTZ | | Resolution timestamp |
| details | JSONB | | Additional alert details |
| created_at | TIMESTAMPTZ | | Alert creation timestamp |

**Alert Types:**
- temperature, battery, servo_temp, servo_voltage, cpu, memory, emergency_stop

**Severity Levels:**
- **critical:** Requires immediate attention
- **warning:** Potential issue to monitor
- **info:** Informational notification

#### 2.3.4 alert_thresholds Table

Stores configurable alert threshold settings per robot.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| robot_id | VARCHAR(100) | FK | Reference to robots table |
| metric_type | VARCHAR(50) | NOT NULL | Type of metric being monitored |
| warning_threshold | FLOAT | NOT NULL | Warning level threshold |
| critical_threshold | FLOAT | NOT NULL | Critical level threshold |
| enabled | BOOLEAN | DEFAULT TRUE | Whether threshold is active |
| created_at | TIMESTAMPTZ | | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last modification timestamp |

#### 2.3.5 jobs Table

Tracks robot task execution with progress and outcomes.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| robot_id | VARCHAR(100) | FK, NOT NULL | Reference to robots table |
| start_time | TIMESTAMPTZ | NOT NULL | Job start timestamp |
| end_time | TIMESTAMPTZ | | Job completion timestamp |
| items_total | INTEGER | | Total items to process |
| items_done | INTEGER | DEFAULT 0 | Items completed |
| percent_complete | FLOAT | DEFAULT 0.0 | Completion percentage |
| last_item | JSONB | | Last processed item data |
| status | VARCHAR(20) | DEFAULT 'active' | Job status |
| task_name | VARCHAR(255) | | Name of the task |
| phase | VARCHAR(50) | | Current execution phase |
| estimated_duration | FLOAT | | Estimated time in seconds |
| action_duration | FLOAT | | Actual action time |
| success | BOOLEAN | | Job outcome |
| cancel_reason | TEXT | | Reason if cancelled |
| created_at | TIMESTAMPTZ | | Record creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update timestamp |

**Status Values:**
- **active:** Job is currently running
- **completed:** Job finished successfully
- **cancelled:** Job was manually stopped
- **failed:** Job encountered an error

**Phase Values:**
- **scanning:** Initial environment scanning
- **searching:** Looking for target
- **executing:** Performing main task
- **done:** Execution complete

#### 2.3.6 reports Table

Stores generated reports with AI analysis results.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| title | VARCHAR(255) | NOT NULL | Report title |
| description | TEXT | | Report description |
| robot_id | VARCHAR(100) | FK | Reference to robots table |
| report_type | VARCHAR(50) | NOT NULL | Type of report |
| data | JSONB | | Report content and metrics |
| file_path | VARCHAR(255) | | Path to exported PDF |
| created_at | TIMESTAMPTZ | | Generation timestamp |
| created_by | VARCHAR(100) | FK | Reference to users table |

**Report Types:**
- **performance:** System performance analysis
- **job:** Task execution summary
- **maintenance:** Hardware health analysis
- **custom:** User-defined reports

**Data JSONB Contents:**
The data column contains metrics, statistical analysis, and AI-generated insights from Google Gemini when available.

#### 2.3.7 system_logs Table

Stores system event logs for auditing and debugging.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PK | Auto-increment primary key |
| level | VARCHAR(20) | NOT NULL | Log severity level |
| category | VARCHAR(50) | NOT NULL | Log category/source |
| message | TEXT | NOT NULL | Log message content |
| robot_id | VARCHAR(100) | FK (optional) | Reference to robots table |
| details | JSONB | | Additional log details |
| timestamp | TIMESTAMPTZ | | Event timestamp |

**Log Levels:**
- INFO, WARNING, ERROR, CRITICAL

**Categories:**
- mqtt, api, database, system, command, robot, alert, auth, etc.

### 2.4 Entity Relationships

The ERD shows the following relationships:

| Relationship | Description | Cardinality |
|--------------|-------------|-------------|
| robots → alerts | A robot triggers multiple alerts | One-to-Many |
| robots → alert_thresholds | A robot has multiple threshold configurations | One-to-Many |
| robots → jobs | A robot executes multiple jobs | One-to-Many |
| robots → reports | A robot is subject of multiple reports | One-to-Many |
| robots → system_logs | A robot generates multiple log entries | One-to-Many |
| users → alerts | A user acknowledges multiple alerts | One-to-Many |
| users → reports | A user creates multiple reports | One-to-Many |

### 2.5 Design Rationale

PostgreSQL was chosen for relational data due to:

1. **ACID Transactions:** Ensures data consistency for critical operations like user authentication and alert management.
2. **Complex JOINs:** Efficient querying across related tables (e.g., reports with user and robot information).
3. **Referential Integrity:** Foreign key constraints maintain data consistency.
4. **JSONB Support:** Flexible schema for storing variable-structure data like settings and report content.
5. **Mature Ecosystem:** Robust tooling, backup solutions, and community support.

---

## 3. Dual-Database Architecture Summary

The TonyPi Robot Monitoring System employs a strategic dual-database architecture:

| Database | Data Type | Write Frequency | Use Cases |
|----------|-----------|-----------------|-----------|
| **InfluxDB** | Time-series telemetry | High (~10/sec) | Sensor data, metrics, real-time monitoring |
| **PostgreSQL** | Structured relational | Low (on events) | Users, robots, alerts, jobs, reports, logs |

### 3.1 Data Flow

1. **Robot → MQTT → Backend → InfluxDB:** High-frequency sensor telemetry
2. **Robot → MQTT → Backend → PostgreSQL:** Alerts generated from threshold checks
3. **Frontend → Backend → PostgreSQL:** User actions, job management, reports
4. **Grafana → InfluxDB:** Visualization queries for dashboards
5. **Grafana → PostgreSQL:** Report data and configuration queries

### 3.2 Benefits of Dual-Database Approach

1. **Performance Optimization:** Each database is optimized for its specific workload
2. **Scalability:** Time-series data can scale independently from relational data
3. **Cost Efficiency:** Automatic data retention in InfluxDB reduces storage costs
4. **Query Efficiency:** Time-range queries on InfluxDB are faster than equivalent SQL queries
5. **Data Integrity:** PostgreSQL provides strong consistency for critical business data
