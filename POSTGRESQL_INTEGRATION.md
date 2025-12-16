# PostgreSQL Integration - Complete Implementation Guide

## 🎯 Overview

PostgreSQL is now **FULLY INTEGRATED** into the TonyPi Monitoring System to store:
- ✅ Job tracking data (persistent across restarts)
- ✅ Robot configurations and metadata
- ✅ System logs and events
- ✅ Operational history

All data is now **durable and persistent**, surviving backend restarts!

---

## 📊 What's Stored in PostgreSQL

### 1. Jobs Table (`jobs`)
Stores all job tracking information:

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-incrementing job ID |
| robot_id | String | Robot identifier |
| start_time | DateTime | Job start timestamp |
| end_time | DateTime | Job completion timestamp (nullable) |
| items_total | Integer | Total items to process |
| items_done | Integer | Items processed so far |
| percent_complete | Float | Completion percentage |
| last_item | JSON | Last processed item data |
| status | String | active, completed, failed |
| created_at | DateTime | Record creation time |
| updated_at | DateTime | Last update time |

**Example Data:**
```json
{
  "id": 1,
  "robot_id": "tonypi_raspberrypi",
  "start_time": "2025-12-05T10:30:00Z",
  "end_time": "2025-12-05T10:45:00Z",
  "items_total": 100,
  "items_done": 100,
  "percent_complete": 100.0,
  "status": "completed"
}
```

### 2. Robots Table (`robots`)
Stores robot configurations and metadata:

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-incrementing robot ID |
| robot_id | String (Unique) | Robot identifier |
| name | String | Human-readable name |
| description | String | Robot description |
| location | String | Physical location |
| status | String | online, offline, error, maintenance |
| battery_threshold_low | Float | Low battery warning (default: 20%) |
| battery_threshold_critical | Float | Critical battery (default: 10%) |
| temp_threshold_warning | Float | Temperature warning (default: 70°C) |
| temp_threshold_critical | Float | Critical temperature (default: 80°C) |
| settings | JSON | Additional custom settings |
| last_seen | DateTime | Last activity timestamp |
| created_at | DateTime | Registration time |
| updated_at | DateTime | Last update time |
| is_active | Boolean | Active/deleted flag |

**Example Data:**
```json
{
  "id": 1,
  "robot_id": "tonypi_raspberrypi",
  "name": "TonyPi Lab Robot",
  "location": "Lab Room A",
  "status": "online",
  "battery_threshold_low": 20.0,
  "temp_threshold_warning": 70.0,
  "last_seen": "2025-12-05T10:50:00Z"
}
```

### 3. System Logs Table (`system_logs`)
Stores all system events and logs:

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-incrementing log ID |
| level | String | INFO, WARNING, ERROR, CRITICAL |
| category | String | mqtt, api, database, system |
| message | Text | Log message |
| robot_id | String | Related robot (nullable) |
| details | JSON | Additional structured data |
| timestamp | DateTime | Log timestamp |

**Example Data:**
```json
{
  "id": 1,
  "level": "INFO",
  "category": "mqtt",
  "message": "Robot connected",
  "robot_id": "tonypi_raspberrypi",
  "timestamp": "2025-12-05T10:00:00Z"
}
```

---

## 🚀 Setup Instructions

### Step 1: Restart Backend to Initialize Database

The backend will **automatically create all tables** on startup!

```bash
# Restart backend to initialize PostgreSQL
docker compose restart backend
```

Watch the logs:
```bash
docker compose logs backend --follow
```

You should see:
```
✅ Database tables created successfully!
```

### Step 2: Verify Tables Were Created

```bash
# Connect to PostgreSQL
docker exec -it tonypi_postgres psql -U postgres -d tonypi_db

# List tables
\dt

# You should see:
#  public | jobs        | table | postgres
#  public | robots      | table | postgres
#  public | system_logs | table | postgres

# View table structure
\d jobs
\d robots
\d system_logs

# Exit
\q
```

### Step 3: Test the Integration

Once the backend restarts:

1. **Start your robot client** - Jobs will be automatically stored in PostgreSQL
2. **Check the new API endpoints**:
   - http://localhost:8000/api/robots-db/robots - List all robots
   - http://localhost:8000/api/robots-db/logs - View system logs
   - http://localhost:8000/api/robots-db/jobs/history - Job history
   - http://localhost:8000/api/robots-db/stats - Database statistics

---

## 🔌 New API Endpoints

### Robot Management

**GET /api/robots-db/robots**
- Get all registered robots
- Returns: List of robots with configurations

**GET /api/robots-db/robots/{robot_id}**
- Get specific robot details
- Returns: Robot configuration and metadata

**POST /api/robots-db/robots**
- Create new robot
- Body:
```json
{
  "robot_id": "tonypi_02",
  "name": "TonyPi 2",
  "location": "Warehouse A",
  "battery_threshold_low": 25.0
}
```

**PUT /api/robots-db/robots/{robot_id}**
- Update robot configuration
- Body: (all fields optional)
```json
{
  "name": "Updated Name",
  "location": "New Location",
  "temp_threshold_warning": 75.0
}
```

**DELETE /api/robots-db/robots/{robot_id}**
- Soft delete robot (sets is_active=False)
- Returns: Success message

### System Logs

**GET /api/robots-db/logs**
- Get system logs with filters
- Query params:
  - `limit` (default: 100)
  - `level` (INFO, WARNING, ERROR, CRITICAL)
  - `category` (mqtt, api, database, system)
  - `robot_id`

Example:
```
GET /api/robots-db/logs?level=ERROR&limit=50
GET /api/robots-db/logs?robot_id=tonypi_raspberrypi&category=mqtt
```

### Job History

**GET /api/robots-db/jobs/history**
- Get job history from database
- Query params:
  - `limit` (default: 50)
  - `robot_id` (optional filter)

Example:
```
GET /api/robots-db/jobs/history?robot_id=tonypi_raspberrypi&limit=100
```

### Database Statistics

**GET /api/robots-db/stats**
- Get real-time database statistics
- Returns:
```json
{
  "total_robots": 1,
  "online_robots": 1,
  "offline_robots": 0,
  "total_jobs": 5,
  "active_jobs": 1,
  "completed_jobs_today": 4
}
```

---

## 💾 Data Persistence Benefits

### Before (In-Memory)
❌ Job data lost on backend restart
❌ No historical data
❌ No robot configuration storage
❌ No system logs

### After (PostgreSQL)
✅ Job data persists across restarts
✅ Complete job history available
✅ Robot configurations saved
✅ System logs searchable
✅ Analytics and reporting possible

---

## 🔄 How It Works

### Job Tracking Flow

1. **Robot starts job** → MQTT message received
2. **Backend creates job** → Inserted into PostgreSQL `jobs` table
3. **Robot processes items** → `items_done` and `percent_complete` updated in database
4. **Job completes** → `end_time` set, `status` = 'completed'
5. **Frontend queries** → Reads from database (survives restarts!)

### Robot Registration Flow

1. **Robot sends status** → MQTT `tonypi/status/{robot_id}`
2. **Backend receives** → Checks if robot exists in database
3. **If new** → Creates robot record with defaults
4. **If existing** → Updates `last_seen` timestamp
5. **Frontend queries** → Gets robot from database

### System Logging Flow

1. **Event occurs** → API call, MQTT message, error, etc.
2. **Backend logs** → Inserts into `system_logs` table
3. **Searchable** → Filter by level, category, robot_id, time
4. **Debugging** → View error history and patterns

---

## 📈 Database Queries Examples

### Check Job Progress

```sql
SELECT robot_id, status, percent_complete, items_done, items_total
FROM jobs
WHERE status = 'active'
ORDER BY start_time DESC;
```

### Get Today's Completed Jobs

```sql
SELECT robot_id, items_total, 
       EXTRACT(EPOCH FROM (end_time - start_time))/60 as duration_minutes
FROM jobs
WHERE status = 'completed'
  AND DATE(end_time) = CURRENT_DATE
ORDER BY end_time DESC;
```

### Find Robot Performance Issues

```sql
SELECT robot_id, COUNT(*) as error_count
FROM system_logs
WHERE level = 'ERROR'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY robot_id
ORDER BY error_count DESC;
```

### Robot Activity Summary

```sql
SELECT robot_id, status, last_seen,
       NOW() - last_seen as time_since_activity
FROM robots
WHERE is_active = true
ORDER BY last_seen DESC;
```

---

## 🛠️ Manual Database Initialization (Optional)

If you want to manually initialize the database:

```bash
# Run initialization script
docker exec -it tonypi_backend python scripts/init_db.py

# Or with table drop (CAUTION: deletes all data!)
docker exec -it tonypi_backend python scripts/init_db.py --drop
```

---

## 🔍 Verification Checklist

### ✅ After Backend Restart

- [ ] Backend logs show "✅ Database tables created successfully!"
- [ ] Tables exist in PostgreSQL (`\dt` shows 3 tables)
- [ ] API endpoint http://localhost:8000/api/robots-db/stats returns data
- [ ] Robot status updates create/update robot records
- [ ] Job tracking creates records in `jobs` table
- [ ] System logs are being recorded

### Test Commands

```bash
# 1. Check backend is running
curl http://localhost:8000/api/health

# 2. Check database stats
curl http://localhost:8000/api/robots-db/stats

# 3. List robots
curl http://localhost:8000/api/robots-db/robots

# 4. View recent logs
curl http://localhost:8000/api/robots-db/logs?limit=10

# 5. Check job history
curl http://localhost:8000/api/robots-db/jobs/history
```

---

## 📊 Integration with Existing Features

### Dashboard
- Now shows stats from PostgreSQL
- Job counts are accurate and persistent
- Robot counts from database

### Jobs Page
- Can query job history from database
- Shows completed jobs even after restart
- Filterable by robot and date

### Robots Page
- Reads robot list from PostgreSQL
- Shows configuration and thresholds
- Can edit robot settings via API

### Reports
- Can generate reports from historical data
- Job performance analytics
- Robot utilization reports

---

## 🔐 Database Connection

Configuration in `docker-compose.yml`:

```yaml
postgres:
  environment:
    POSTGRES_DB: tonypi_db
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres

backend:
  environment:
    POSTGRES_URL: postgresql://postgres:postgres@postgres:5432/tonypi_db
```

Connection pool managed by SQLAlchemy with automatic session handling.

---

## 🎉 Summary

**PostgreSQL Integration Status: ✅ COMPLETE**

What's Now Stored:
- ✅ Job tracking data (persistent)
- ✅ Robot configurations
- ✅ System logs
- ✅ Operational history

Benefits:
- 📊 Data survives restarts
- 🔍 Searchable history
- 📈 Analytics ready
- ⚙️ Configurable robots
- 🐛 Better debugging

All automatic on backend startup - **NO MANUAL SETUP REQUIRED!**

Just restart the backend and everything is ready! 🚀
