# Database & Log Schema Documentation

## 1. PostgreSQL Tables

### Table: robots
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | Integer | PRIMARY KEY, INDEX | Auto-increment | Internal ID |
| robot_id | String | UNIQUE, INDEX, NOT NULL | - | Unique robot identifier (e.g., "tonypi_01") |
| name | String | NULLABLE | - | Human-friendly display name |
| description | String | NULLABLE | - | Robot description |
| location | JSON | NULLABLE | - | Position as {x, y, z} coordinates |
| status | String | - | 'offline' | Status: online/offline/error/maintenance |
| ip_address | String | NULLABLE | - | Robot's IP address |
| camera_url | String | NULLABLE | - | Camera stream URL |
| battery_threshold_low | Float | - | 20.0 | Warning threshold % |
| battery_threshold_critical | Float | - | 10.0 | Critical threshold % |
| temp_threshold_warning | Float | - | 70.0 | Temp warning °C |
| temp_threshold_critical | Float | - | 80.0 | Temp critical °C |
| settings | JSON | NULLABLE | - | Custom configuration |
| last_seen | DateTime(TZ) | NULLABLE | - | Last communication timestamp |
| created_at | DateTime(TZ) | - | NOW() | Record creation |
| updated_at | DateTime(TZ) | - | ON UPDATE | Last modification |
| is_active | Boolean | - | True | Soft delete flag |

### Table: alerts
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | Integer | PRIMARY KEY, INDEX | Auto-increment | Alert ID |
| robot_id | String | INDEX, NULLABLE | - | Associated robot |
| alert_type | String | INDEX, NOT NULL | - | Type: temperature/battery/servo_temp/cpu/memory |
| severity | String | INDEX, NOT NULL | - | Level: critical/warning/info |
| title | String | NOT NULL | - | Short summary |
| message | Text | NOT NULL | - | Detailed description |
| source | String | NULLABLE | - | Component (servo_1, cpu, battery) |
| value | Float | NULLABLE | - | Actual value that triggered alert |
| threshold | Float | NULLABLE | - | Threshold that was exceeded |
| acknowledged | Boolean | INDEX | False | User has seen it |
| acknowledged_by | String | NULLABLE | - | Username who acknowledged |
| acknowledged_at | DateTime(TZ) | NULLABLE | - | When acknowledged |
| resolved | Boolean | INDEX | False | Issue fixed |
| resolved_at | DateTime(TZ) | NULLABLE | - | When resolved |
| details | JSON | NULLABLE | - | Additional context |
| created_at | DateTime(TZ) | INDEX | NOW() | Alert creation time |

### Table: alert_thresholds
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | Integer | PRIMARY KEY, INDEX | Auto-increment | Threshold ID |
| robot_id | String | INDEX, NULLABLE | - | Robot (NULL = global) |
| metric_type | String | INDEX, NOT NULL | - | Metric: cpu/memory/temperature/battery/servo_temp |
| warning_threshold | Float | NOT NULL | - | Warning level |
| critical_threshold | Float | NOT NULL | - | Critical level |
| enabled | Boolean | - | True | Is threshold active |
| created_at | DateTime(TZ) | - | NOW() | Creation time |
| updated_at | DateTime(TZ) | - | ON UPDATE | Last update |

### Table: jobs
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | Integer | PRIMARY KEY, INDEX | Auto-increment | Job ID |
| robot_id | String | INDEX, NOT NULL | - | Robot executing job |
| start_time | DateTime(TZ) | NOT NULL | - | Job start time |
| end_time | DateTime(TZ) | NULLABLE | - | Job completion time |
| items_total | Integer | NULLABLE | - | Total items to process |
| items_done | Integer | - | 0 | Items completed |
| percent_complete | Float | - | 0.0 | Progress (0-100) |
| last_item | JSON | NULLABLE | - | Last processed item data |
| status | String | - | 'active' | Status: active/completed/cancelled/failed |
| task_name | String | NULLABLE | - | Task name (find_red_ball, patrol) |
| phase | String | NULLABLE | - | Current phase (scanning, searching, executing) |
| estimated_duration | Float | NULLABLE | - | Expected time (seconds) |
| action_duration | Float | NULLABLE | - | Actual time taken |
| success | Boolean | NULLABLE | - | Job succeeded |
| cancel_reason | String | NULLABLE | - | Cancellation reason |
| created_at | DateTime(TZ) | - | NOW() | Record creation |
| updated_at | DateTime(TZ) | - | ON UPDATE | Last modification |

### Table: reports
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | Integer | PRIMARY KEY, INDEX | Auto-increment | Report ID |
| title | String | INDEX, NOT NULL | - | Report title |
| description | Text | NULLABLE | - | Detailed description |
| robot_id | String | INDEX, NULLABLE | - | Associated robot |
| report_type | String | INDEX, NOT NULL | - | Type: performance/job/maintenance/custom |
| data | JSON | NULLABLE | - | Report content |
| file_path | String | NULLABLE | - | PDF file path |
| created_at | DateTime(TZ) | INDEX | NOW() | Generation time |
| created_by | String | NULLABLE | - | Creator (user/system/api) |

### Table: system_logs
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | Integer | PRIMARY KEY, INDEX | Auto-increment | Log ID |
| level | String | INDEX, NOT NULL | - | Level: INFO/WARNING/ERROR/CRITICAL |
| category | String | INDEX, NOT NULL | - | Category: mqtt/api/database/system/command/robot/alert |
| message | Text | NOT NULL | - | Event description |
| robot_id | String | INDEX, NULLABLE | - | Associated robot |
| details | JSON | NULLABLE | - | Additional context |
| timestamp | DateTime(TZ) | INDEX | NOW() | Event time |

### Table: users
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | PRIMARY KEY, INDEX | UUID | User ID |
| username | String(50) | UNIQUE, INDEX, NOT NULL | - | Login username |
| email | String(100) | UNIQUE, INDEX, NOT NULL | - | Email address |
| password_hash | String(255) | NOT NULL | - | Bcrypt hashed password |
| role | String(20) | - | 'viewer' | Role: admin/operator/viewer |
| is_active | Boolean | - | True | Account active |
| created_at | DateTime(TZ) | - | NOW() | Account creation |
| updated_at | DateTime(TZ) | - | ON UPDATE | Last modification |

---

## 2. InfluxDB Measurements (Time-Series Schema)

**Bucket:** robot_data  
**Organization:** tonypi

### Measurement: sensor_data
| Tag | Field | Type | Unit | Range |
|-----|-------|------|------|-------|
| robot_id | - | String | - | - |
| sensor_type | - | String | - | accelerometer_x/y/z, gyroscope_x/y/z, ultrasonic_distance, cpu_temperature, light_sensor_dark, light_level, light_status |
| - | value | Float | varies | varies by sensor |
| - | unit | String | - | m/s², deg/s, cm, C, % |

**Valid sensor types and ranges:**
| Sensor Type | Unit | Min | Max |
|-------------|------|-----|-----|
| accelerometer_x/y/z | m/s² | -20 | 20 |
| gyroscope_x/y/z | deg/s | -500 | 500 |
| ultrasonic_distance | cm | 0 | 500 |
| cpu_temperature | C | 0 | 100 |
| light_sensor_dark | bool | 0 | 1 |
| light_level | % | 0 | 100 |

### Measurement: servo_data
| Tag | Field | Type | Unit | Range |
|-----|-------|------|------|-------|
| robot_id | - | String | - | - |
| servo_id | - | String | - | 1-20 |
| servo_name | - | String | - | - |
| alert_level | - | String | - | normal/warning/critical |
| - | position | Float | degrees | -180 to 180 |
| - | temperature | Float | C | 0 to 100 |
| - | voltage | Float | V | 0 to 15 |
| - | torque_enabled | Boolean | - | - |

### Measurement: vision_data
| Tag | Field | Type | Description |
|-----|-------|------|-------------|
| robot_id | - | String | Robot identifier |
| state | - | String | IDLE/SEARCHING/ACTING |
| detection | - | String | true/false |
| label | - | String | Detected object label |
| nav_cmd | - | String | LOCKED/TURN_LEFT/TURN_RIGHT/SCANNING |
| - | has_detection | Boolean | Detection present |
| - | is_locked | Boolean | Target locked |
| - | confidence | Float | 0-1 |
| - | bbox_x1/y1/x2/y2 | Integer | Bounding box coords |
| - | bbox_area | Integer | Calculated area |
| - | center_x | Integer | Center X coordinate |
| - | nav_error | Float | Navigation error |

### Measurement: robot_logs
| Tag | Field | Type | Description |
|-----|-------|------|-------------|
| robot_id | - | String | Robot identifier |
| level | - | String | DEBUG/INFO/WARNING/ERROR/CRITICAL |
| source | - | String | Source module |
| - | message | String | Log message content |
| - | level_num | Integer | Numeric level (0-4) |

### Measurement: battery_status
| Tag | Field | Type | Unit | Range |
|-----|-------|------|------|-------|
| robot_id | - | String | - | - |
| charging | - | String | - | true/false |
| - | percentage | Float | % | 0-100 |
| - | voltage | Float | V | 0-15 |
| - | is_charging | Boolean | - | - |

### Measurement: robot_location
| Tag | Field | Type | Unit |
|-----|-------|------|------|
| robot_id | - | String | - |
| - | x | Float | meters |
| - | y | Float | meters |
| - | z | Float | meters |

---

## 3. Log Format

**Python Logging Format (Backend & Robot Client):**
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

**Example Output:**
```
2026-01-23 10:30:45,123 - TonyPi-Client - INFO - Connected to MQTT broker at localhost:1883
2026-01-23 10:30:46,456 - InfluxClient - WARNING - Sensor cpu_temperature value 105 out of range
2026-01-23 10:30:47,789 - TonyPi-Client - ERROR - Failed to send command to robot
```

**Log Levels (severity order):**
| Level | Numeric | Description |
|-------|---------|-------------|
| DEBUG | 0 | Detailed diagnostic info |
| INFO | 1 | Normal operations |
| WARNING | 2 | Potential issues |
| ERROR | 3 | Errors that don't stop operation |
| CRITICAL | 4 | Severe errors, system unstable |

**System Log Categories:**
- mqtt - MQTT broker events
- api - REST API requests/responses
- database - Database operations
- system - System-level events
- command - Robot commands
- robot - Robot status updates
- alert - Alert generation
- report - Report generation
- servo - Servo events
- vision - Camera/detection events
- battery - Battery events
- sensor - Sensor readings
- job - Job/task progress
- movement - Robot movement
