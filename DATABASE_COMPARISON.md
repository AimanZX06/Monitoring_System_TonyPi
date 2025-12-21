# PostgreSQL vs InfluxDB - Usage Comparison

**Date:** December 2025  
**Purpose:** Explain the different roles and usage of PostgreSQL and InfluxDB in the TonyPi Monitoring System

---

## 🎯 **Core Principle: Right Tool for Right Data**

The system uses **two databases** because they serve **different purposes**:

- **InfluxDB** = Time-series data (metrics that change over time)
- **PostgreSQL** = Relational data (structured records with relationships)

---

## 📊 **InfluxDB - Time-Series Database**

### **Purpose**
Store **time-series metrics** - data points that change frequently over time and need to be queried by time ranges.

### **What Data is Stored**

#### 1. **Robot Performance Metrics** (`robot_status` measurement)
```json
{
  "time": "2025-12-05T10:30:00Z",
  "robot_id": "tonypi_01",
  "system_cpu_percent": 45.2,
  "system_memory_percent": 62.5,
  "system_disk_usage": 78.3,
  "system_temperature": 55.8,
  "system_uptime": 86400
}
```
- **Update Frequency:** Every 5-30 seconds
- **Data Type:** Numeric metrics over time
- **Query Pattern:** "Show CPU usage for last hour"

#### 2. **Sensor Data** (`sensors` measurement)
```json
{
  "time": "2025-12-05T10:30:00Z",
  "robot_id": "tonypi_01",
  "accelerometer_x": 0.5,
  "accelerometer_y": -0.2,
  "accelerometer_z": 9.8,
  "gyroscope_x": 0.1,
  "distance": 25.5,
  "light_level": 750
}
```
- **Update Frequency:** Every 2-5 seconds
- **Data Type:** Continuous sensor readings
- **Query Pattern:** "Show accelerometer data for last 10 minutes"

#### 3. **Battery Data** (`battery` measurement)
```json
{
  "time": "2025-12-05T10:30:00Z",
  "robot_id": "tonypi_01",
  "battery_level": 85.5,
  "voltage": 12.3,
  "current": 0.5
}
```
- **Update Frequency:** Every 5 seconds
- **Data Type:** Battery metrics over time
- **Query Pattern:** "Show battery level trend for last 24 hours"

#### 4. **Location Data** (`location` measurement)
```json
{
  "time": "2025-12-05T10:30:00Z",
  "robot_id": "tonypi_01",
  "x": 1.5,
  "y": 2.3,
  "z": 0.1
}
```
- **Update Frequency:** Every 5 seconds
- **Data Type:** Position coordinates over time
- **Query Pattern:** "Show robot movement path for last hour"

### **Characteristics**
- ✅ **High Write Volume:** Thousands of data points per day
- ✅ **Time-Based Queries:** "Last hour", "Last 24 hours", "Last week"
- ✅ **Downsampling:** Automatic data compression for old data
- ✅ **Retention Policies:** Auto-delete old data after retention period
- ✅ **No Relationships:** Each data point is independent
- ✅ **Optimized for Time-Series:** Fast queries by time range

### **Query Language**
- **Flux** (InfluxDB's query language)
- Example: `from(bucket: "robot_data") |> range(start: -1h) |> filter(fn: (r) => r.robot_id == "tonypi_01")`

### **Used By**
- Performance monitoring dashboard
- Real-time charts (Recharts)
- Grafana visualizations
- Historical trend analysis
- CSV/JSON exports

---

## 🗄️ **PostgreSQL - Relational Database**

### **Purpose**
Store **structured relational data** - records that need relationships, transactions, and complex queries.

### **What Data is Stored**

#### 1. **Jobs Table** (`jobs`)
```sql
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    robot_id VARCHAR NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    items_total INTEGER,
    items_done INTEGER,
    percent_complete FLOAT,
    status VARCHAR,
    created_at TIMESTAMP
);
```
- **Update Frequency:** When job starts/ends/updates
- **Data Type:** Job records with relationships
- **Query Pattern:** "Get all completed jobs for robot X"
- **Relationships:** Links to `robots` table via `robot_id`

#### 2. **Robots Table** (`robots`)
```sql
CREATE TABLE robots (
    id SERIAL PRIMARY KEY,
    robot_id VARCHAR UNIQUE,
    name VARCHAR,
    description TEXT,
    status VARCHAR,
    battery_threshold_low FLOAT,
    temp_threshold_warning FLOAT,
    settings JSONB,
    created_at TIMESTAMP
);
```
- **Update Frequency:** When robot is registered/configured
- **Data Type:** Configuration and metadata
- **Query Pattern:** "Get robot configuration", "List all active robots"
- **Relationships:** Referenced by `jobs`, `reports`, `system_logs`

#### 3. **Reports Table** (`reports`)
```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    robot_id VARCHAR,
    report_type VARCHAR,
    data JSONB,
    created_at TIMESTAMP
);
```
- **Update Frequency:** When report is generated
- **Data Type:** Generated report metadata
- **Query Pattern:** "Get all performance reports for last month"
- **Relationships:** Links to `robots` table

#### 4. **System Logs Table** (`system_logs`)
```sql
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR,  -- INFO, WARNING, ERROR, CRITICAL
    category VARCHAR,  -- mqtt, api, database, system
    message TEXT,
    robot_id VARCHAR,
    details JSONB,
    timestamp TIMESTAMP
);
```
- **Update Frequency:** When system events occur
- **Data Type:** Event logs with categories
- **Query Pattern:** "Get all errors for robot X", "Show system events by category"
- **Relationships:** Links to `robots` table

### **Characteristics**
- ✅ **ACID Transactions:** Data integrity guaranteed
- ✅ **Relationships:** Foreign keys, joins between tables
- ✅ **Complex Queries:** SQL with joins, aggregations, filters
- ✅ **Structured Data:** Tables with defined schemas
- ✅ **Low Write Volume:** Hundreds of records per day
- ✅ **Persistence:** Data survives forever (unless deleted)

### **Query Language**
- **SQL** (Structured Query Language)
- Example: `SELECT * FROM jobs WHERE robot_id = 'tonypi_01' AND status = 'completed'`

### **Used By**
- Job tracking system
- Robot configuration management
- Report storage and history
- System event logging
- User management (future)

---

## 🔄 **Data Flow Comparison**

### **InfluxDB Data Flow**
```
Robot (Raspberry Pi)
    ↓ (publishes every 5 seconds)
MQTT Broker
    ↓ (subscribes)
Backend MQTT Handler
    ↓ (writes time-series data)
InfluxDB
    ↓ (queries by time range)
Backend API
    ↓ (returns time-series data)
Frontend Charts / Grafana
```

**Example:**
- Robot sends CPU usage: 45% at 10:00:00
- Robot sends CPU usage: 47% at 10:00:05
- Robot sends CPU usage: 46% at 10:00:10
- **Result:** Time-series chart showing CPU trend

### **PostgreSQL Data Flow**
```
User Action / System Event
    ↓ (creates/updates record)
Backend API
    ↓ (SQL INSERT/UPDATE)
PostgreSQL
    ↓ (SQL SELECT with joins)
Backend API
    ↓ (returns structured data)
Frontend UI
```

**Example:**
- Job starts → INSERT into `jobs` table
- Job updates → UPDATE `jobs` table
- Job completes → UPDATE `jobs` table with end_time
- **Result:** Job record with complete history

---

## 📊 **Side-by-Side Comparison**

| Feature | InfluxDB | PostgreSQL |
|---------|----------|------------|
| **Data Type** | Time-series metrics | Relational records |
| **Write Frequency** | High (every few seconds) | Low (on events) |
| **Query Pattern** | Time-range queries | Complex SQL with joins |
| **Data Structure** | Measurements with fields/tags | Tables with relationships |
| **Retention** | Automatic downsampling | Manual deletion |
| **Relationships** | None (independent points) | Foreign keys, joins |
| **Transactions** | Not applicable | ACID compliant |
| **Use Case** | "Show CPU over last hour" | "Get all jobs for robot X" |
| **Query Language** | Flux | SQL |
| **Optimization** | Time-series queries | General-purpose queries |

---

## 🎯 **When to Use Which Database**

### **Use InfluxDB When:**
- ✅ Data changes frequently over time
- ✅ You need to query by time ranges
- ✅ Data points are independent (no relationships)
- ✅ You need automatic downsampling/retention
- ✅ High write volume (thousands per day)
- ✅ Examples: CPU usage, sensor readings, temperature

### **Use PostgreSQL When:**
- ✅ Data has relationships (jobs → robots, reports → robots)
- ✅ You need ACID transactions
- ✅ You need complex queries with joins
- ✅ Data is structured and relational
- ✅ Low write volume (hundreds per day)
- ✅ Examples: Job records, robot configs, reports, logs

---

## 💡 **Real-World Examples**

### **Example 1: CPU Monitoring**

**InfluxDB:**
```python
# Store: CPU usage every 5 seconds
influx_client.write_sensor_data(
    measurement="robot_status",
    tags={"robot_id": "tonypi_01"},
    fields={"system_cpu_percent": 45.2}
)
# Result: Time-series of CPU values
```

**PostgreSQL:**
```python
# Store: Robot configuration (thresholds)
robot = Robot(
    robot_id="tonypi_01",
    temp_threshold_warning=70.0,
    temp_threshold_critical=80.0
)
db.add(robot)
# Result: Configuration record
```

### **Example 2: Job Tracking**

**InfluxDB:**
```python
# NOT used for jobs - jobs are discrete events, not time-series
```

**PostgreSQL:**
```python
# Store: Job record
job = Job(
    robot_id="tonypi_01",
    start_time=datetime.now(),
    items_total=100,
    items_done=0,
    status="active"
)
db.add(job)
# Result: Job record with relationships
```

### **Example 3: Report Generation**

**InfluxDB:**
```python
# Query: Get performance data for report
perf_data = influx_client.query_data(
    measurement="robot_status",
    time_range="24h",
    filters={"robot_id": "tonypi_01"}
)
# Result: Time-series data for analysis
```

**PostgreSQL:**
```python
# Store: Generated report metadata
report = Report(
    title="Performance Report",
    robot_id="tonypi_01",
    report_type="performance",
    data={"avg_cpu": 45.2, "avg_mem": 62.5}
)
db.add(report)
# Result: Report record for history
```

---

## 🔗 **How They Work Together**

### **Complementary Usage**

1. **InfluxDB provides the data:**
   - Real-time metrics
   - Historical trends
   - Time-series analysis

2. **PostgreSQL provides the context:**
   - Which robot the data belongs to
   - Job history and status
   - Configuration and settings
   - Report history

### **Example: Generating a Report**

```python
# 1. Query InfluxDB for time-series data
perf_data = influx_client.query_data(
    measurement="robot_status",
    time_range="24h",
    filters={"robot_id": "tonypi_01"}
)

# 2. Calculate averages
avg_cpu = calculate_average(perf_data, "system_cpu_percent")

# 3. Store report in PostgreSQL
report = Report(
    title="Performance Report",
    robot_id="tonypi_01",
    report_type="performance",
    data={"avg_cpu": avg_cpu}
)
db.add(report)
```

**Result:**
- InfluxDB: Provides the raw time-series data
- PostgreSQL: Stores the generated report for history

---

## 📈 **Data Volume Comparison**

### **InfluxDB**
- **Writes per day:** ~17,280 data points per robot (every 5 seconds)
- **Storage:** Optimized for time-series compression
- **Retention:** Automatic downsampling of old data

### **PostgreSQL**
- **Writes per day:** ~10-100 records (jobs, reports, logs)
- **Storage:** Standard relational storage
- **Retention:** Manual deletion (data persists)

---

## ✅ **Summary**

### **InfluxDB = Time-Series Metrics**
- **What:** CPU, memory, temperature, sensors, battery, location
- **When:** Data changes every few seconds
- **Why:** Optimized for time-range queries
- **How:** Flux queries by time range

### **PostgreSQL = Relational Records**
- **What:** Jobs, robots, reports, system logs
- **When:** Data changes on events (job start, report generation)
- **Why:** Need relationships and ACID transactions
- **How:** SQL queries with joins

### **Together They Provide:**
- ✅ Real-time monitoring (InfluxDB)
- ✅ Historical analysis (InfluxDB)
- ✅ Job tracking (PostgreSQL)
- ✅ Configuration management (PostgreSQL)
- ✅ Report history (PostgreSQL)
- ✅ System logging (PostgreSQL)

---

## 🎯 **Key Takeaway**

**InfluxDB** and **PostgreSQL** are **complementary**, not competing:
- **InfluxDB** handles the **"what happened over time"** (metrics)
- **PostgreSQL** handles the **"what are the records"** (jobs, configs, reports)

Both are essential for a complete monitoring system!









