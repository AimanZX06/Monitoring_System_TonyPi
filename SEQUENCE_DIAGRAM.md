# TonyPi Robot Monitoring System - Sequence Diagrams

This document contains sequence diagrams showing the interactions between system components.

## System Components

| Component | Technology | Description |
|-----------|------------|-------------|
| Frontend | React + TypeScript | Web dashboard for monitoring and control |
| Backend | FastAPI (Python) | REST API server |
| MQTT Broker | Mosquitto | Message broker for robot communication |
| InfluxDB | Time-series DB | Stores sensor telemetry data |
| PostgreSQL | Relational DB | Stores users, alerts, logs, reports |
| Grafana | Visualization | Dashboard panels and charts |
| Robot Client | Python | Runs on TonyPi robot hardware |

---

## 1. Robot Telemetry Data Flow

This diagram shows how sensor data flows from the robot to storage and visualization.

```mermaid
sequenceDiagram
    autonumber
    participant Robot as TonyPi Robot
    participant MQTT as MQTT Broker<br/>(Mosquitto)
    participant Backend as Backend API<br/>(FastAPI)
    participant InfluxDB as InfluxDB
    participant PostgreSQL as PostgreSQL
    participant Frontend as Frontend<br/>(React)
    participant Grafana as Grafana

    Note over Robot: Robot starts and connects to MQTT
    Robot->>MQTT: Connect to broker (port 1883)
    MQTT-->>Robot: Connection ACK
    
    loop Every 2-30 seconds
        Note over Robot: Collect telemetry data
        Robot->>Robot: Read sensors (IMU, ultrasonic, light)
        Robot->>Robot: Read servo status (position, temp, voltage)
        Robot->>Robot: Read system info (CPU, memory, temp)
        Robot->>Robot: Read battery status
        
        Note over Robot,MQTT: Publish telemetry to MQTT topics
        Robot->>MQTT: PUBLISH tonypi/sensors/{robot_id}
        Robot->>MQTT: PUBLISH tonypi/servos/{robot_id}
        Robot->>MQTT: PUBLISH tonypi/status/{robot_id}
        Robot->>MQTT: PUBLISH tonypi/battery
        Robot->>MQTT: PUBLISH tonypi/location
    end

    Note over Backend: Backend MQTT client subscribed to topics
    MQTT->>Backend: Message on tonypi/sensors/+
    Backend->>Backend: Parse & validate sensor data
    Backend->>InfluxDB: Write to sensor_data measurement
    
    MQTT->>Backend: Message on tonypi/servos/+
    Backend->>Backend: Parse & validate servo data
    Backend->>InfluxDB: Write to servo_data measurement
    Backend->>Backend: Check servo temperature thresholds
    
    alt Threshold exceeded
        Backend->>PostgreSQL: Create Alert record
        Backend->>PostgreSQL: Log system event
    end
    
    MQTT->>Backend: Message on tonypi/status/+
    Backend->>Backend: Parse status data
    Backend->>InfluxDB: Write to robot_status measurement
    Backend->>PostgreSQL: Update Robot record (last_seen, IP)
    Backend->>Backend: Check CPU/memory thresholds
    
    alt Threshold exceeded
        Backend->>PostgreSQL: Create Alert record
    end
    
    MQTT->>Backend: Message on tonypi/battery
    Backend->>Backend: Parse battery data
    Backend->>InfluxDB: Write to battery_status measurement
    Backend->>Backend: Check low battery threshold
    
    alt Low battery detected
        Backend->>PostgreSQL: Create Battery Alert
    end

    Note over Frontend: User views dashboard
    Frontend->>Backend: GET /api/v1/robot-data/status
    Backend->>InfluxDB: Query robot_status, battery_status
    InfluxDB-->>Backend: Return status data
    Backend-->>Frontend: Return RobotStatus[]
    
    Frontend->>Backend: GET /api/v1/robot-data/sensors
    Backend->>InfluxDB: Query sensor_data
    InfluxDB-->>Backend: Return sensor records
    Backend-->>Frontend: Return SensorData[]
    
    Frontend->>Grafana: Load embedded panels (iframe)
    Grafana->>InfluxDB: Query time-series data
    InfluxDB-->>Grafana: Return data points
    Grafana-->>Frontend: Render visualization
```

---

## 2. User Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    participant User as User
    participant Frontend as Frontend<br/>(React)
    participant Backend as Backend API<br/>(FastAPI)
    participant PostgreSQL as PostgreSQL

    User->>Frontend: Enter username & password
    Frontend->>Backend: POST /api/v1/auth/login
    
    Backend->>PostgreSQL: Query User by username
    PostgreSQL-->>Backend: Return User record
    
    Backend->>Backend: Verify password hash (bcrypt)
    
    alt Password valid
        Backend->>Backend: Generate JWT token
        Backend-->>Frontend: Return {access_token, user}
        Frontend->>Frontend: Store token in localStorage
        Frontend->>Frontend: Update AuthContext
        Frontend-->>User: Redirect to Dashboard
    else Password invalid
        Backend-->>Frontend: 401 Unauthorized
        Frontend-->>User: Show error message
    end
    
    Note over Frontend: Subsequent API requests
    Frontend->>Backend: GET /api/v1/... (with Bearer token)
    Backend->>Backend: Verify JWT token
    Backend->>Backend: Extract user from token
    Backend-->>Frontend: Return protected data
```

---

## 3. Robot Command Flow

This diagram shows how commands are sent from the frontend to the robot.

```mermaid
sequenceDiagram
    autonumber
    participant User as User
    participant Frontend as Frontend<br/>(React)
    participant Backend as Backend API<br/>(FastAPI)
    participant MQTT as MQTT Broker
    participant Robot as TonyPi Robot
    participant PostgreSQL as PostgreSQL

    User->>Frontend: Click "Move Forward" button
    Frontend->>Backend: POST /api/v1/robot-data/command
    Note right of Frontend: {type: "move", direction: "forward",<br/>robot_id: "tonypi_01"}
    
    Backend->>Backend: Validate command
    Backend->>MQTT: PUBLISH tonypi/commands/{robot_id}
    MQTT-->>Backend: Publish ACK
    Backend-->>Frontend: {success: true, topic: "...", command: {...}}
    
    MQTT->>Robot: Deliver command message
    Robot->>Robot: Parse command JSON
    Robot->>Robot: Execute movement action
    
    Robot->>MQTT: PUBLISH tonypi/commands/response
    Note right of Robot: {robot_id, command_id, success,<br/>message, new_location}
    
    MQTT->>Backend: Message on tonypi/commands/response
    Backend->>PostgreSQL: Log command execution (SystemLog)
    
    Note over Frontend: Real-time update via polling/websocket
    Frontend->>Backend: GET /api/v1/robot-data/latest/{robot_id}
    Backend-->>Frontend: Updated robot position
    Frontend-->>User: Update UI with new location
```

---

## 4. QR Code Scan & Job Progress Flow

```mermaid
sequenceDiagram
    autonumber
    participant Robot as TonyPi Robot
    participant MQTT as MQTT Broker
    participant Backend as Backend API
    participant JobStore as Job Store<br/>(In-Memory)
    participant PostgreSQL as PostgreSQL
    participant Frontend as Frontend

    Note over Robot: Robot scans QR code
    Robot->>MQTT: PUBLISH tonypi/scan/{robot_id}
    Note right of Robot: {robot_id, qr: "QR12345", timestamp}
    
    MQTT->>Backend: Message on tonypi/scan/+
    Backend->>Backend: Lookup item in mock_items database
    
    alt Item found
        Backend->>MQTT: PUBLISH tonypi/items/{robot_id}
        Note right of Backend: {robot_id, qr, found: true, item: {...}}
        Backend->>JobStore: record_item(robot_id, item_info)
        Backend->>PostgreSQL: Log QR scan event
    else Item not found
        Backend->>MQTT: PUBLISH tonypi/items/{robot_id}
        Note right of Backend: {robot_id, qr, found: false, message: "..."}
    end
    
    MQTT->>Robot: Item info message
    Robot->>Robot: Process item information
    Robot->>Robot: Update local job progress
    Robot->>MQTT: PUBLISH tonypi/job/{robot_id}
    Note right of Robot: {robot_id, percent: 42, status: "working"}
    
    MQTT->>Backend: Message on tonypi/job/+
    Backend->>JobStore: set_progress(robot_id, percent)
    
    alt Job completed
        Backend->>JobStore: finish_job(robot_id)
        Backend->>PostgreSQL: Log job completion
    end
    
    Note over Frontend: User views job progress
    Frontend->>Backend: GET /api/v1/robot-data/job-summary/{robot_id}
    Backend->>JobStore: get_summary(robot_id)
    JobStore-->>Backend: {percent, status, items_processed, ...}
    Backend-->>Frontend: Return job summary
    Frontend-->>Frontend: Update progress bar UI
```

---

## 5. Alert Management Flow

```mermaid
sequenceDiagram
    autonumber
    participant MQTT as MQTT Broker
    participant Backend as Backend API
    participant PostgreSQL as PostgreSQL
    participant Frontend as Frontend
    participant User as User

    Note over MQTT,Backend: Automatic alert creation from telemetry
    MQTT->>Backend: Status data with high CPU (92%)
    Backend->>Backend: Check CPU threshold (critical: 90%)
    
    Backend->>PostgreSQL: Query existing alert (last 5 min)
    PostgreSQL-->>Backend: No recent duplicate
    
    Backend->>PostgreSQL: INSERT Alert
    Note right of Backend: {robot_id, alert_type: "cpu",<br/>severity: "critical", value: 92}
    Backend->>PostgreSQL: INSERT SystemLog
    
    Note over Frontend: User views alerts page
    Frontend->>Backend: GET /api/v1/alerts?resolved=false
    Backend->>PostgreSQL: Query unresolved alerts
    PostgreSQL-->>Backend: Return Alert[]
    Backend-->>Frontend: Return alerts list
    Frontend-->>User: Display alert cards
    
    User->>Frontend: Click "Acknowledge" button
    Frontend->>Backend: POST /api/v1/alerts/{id}/acknowledge
    Backend->>PostgreSQL: UPDATE Alert SET acknowledged=true
    PostgreSQL-->>Backend: Updated record
    Backend-->>Frontend: Return success
    Frontend-->>User: Update alert status UI
    
    User->>Frontend: Click "Resolve" button
    Frontend->>Backend: POST /api/v1/alerts/{id}/resolve
    Backend->>PostgreSQL: UPDATE Alert SET resolved=true
    PostgreSQL-->>Backend: Updated record
    Backend-->>Frontend: Return success
    Frontend-->>User: Remove from active alerts
    
    Note over Frontend: Configure thresholds
    User->>Frontend: Set CPU warning=70, critical=85
    Frontend->>Backend: POST /api/v1/alerts/thresholds
    Backend->>PostgreSQL: UPSERT AlertThreshold
    PostgreSQL-->>Backend: Return threshold record
    Backend-->>Frontend: Return created threshold
```

---

## 6. Report Generation Flow

```mermaid
sequenceDiagram
    autonumber
    participant User as User
    participant Frontend as Frontend
    participant Backend as Backend API
    participant InfluxDB as InfluxDB
    participant PostgreSQL as PostgreSQL
    participant Gemini as Gemini AI<br/>(Optional)

    User->>Frontend: Select report type & time range
    User->>Frontend: Click "Generate Report"
    
    Frontend->>Backend: POST /api/v1/reports/generate
    Note right of Frontend: {report_type: "performance",<br/>time_range: "24h", robot_id: "..."}
    
    Backend->>InfluxDB: Query sensor_data (24h)
    InfluxDB-->>Backend: Return sensor records
    
    Backend->>InfluxDB: Query servo_data (24h)
    InfluxDB-->>Backend: Return servo records
    
    Backend->>InfluxDB: Query battery_status (24h)
    InfluxDB-->>Backend: Return battery records
    
    Backend->>PostgreSQL: Query alerts (24h)
    PostgreSQL-->>Backend: Return alert records
    
    Backend->>Backend: Calculate statistics<br/>(avg, min, max, trends)
    
    alt AI Analysis enabled
        Backend->>Gemini: Send metrics for analysis
        Gemini-->>Backend: Return AI insights & recommendations
        Backend->>Backend: Merge AI analysis into report
    end
    
    Backend->>PostgreSQL: INSERT Report record
    PostgreSQL-->>Backend: Return report with ID
    Backend-->>Frontend: Return generated report
    
    Frontend-->>User: Display report summary
    
    User->>Frontend: Click "Download PDF"
    Frontend->>Backend: GET /api/v1/reports/{id}/pdf
    Backend->>Backend: Generate PDF from report data
    Backend-->>Frontend: Return PDF blob
    Frontend-->>User: Download PDF file
```

---

## 7. Vision Detection Flow

```mermaid
sequenceDiagram
    autonumber
    participant Camera as Camera Module
    participant Robot as TonyPi Robot
    participant MQTT as MQTT Broker
    participant Backend as Backend API
    participant InfluxDB as InfluxDB
    participant PostgreSQL as PostgreSQL

    Note over Camera,Robot: Continuous vision processing
    loop Every frame
        Camera->>Robot: Capture frame
        Robot->>Robot: Run object detection model
        
        alt Object detected
            Robot->>Robot: Calculate bounding box & confidence
            Robot->>Robot: Determine navigation command
            
            Robot->>MQTT: PUBLISH tonypi/vision/{robot_id}
            Note right of Robot: {detection: true, label: "ball",<br/>confidence: 0.95, bbox: {...},<br/>nav_cmd: "TURN_LEFT"}
        else No detection
            Robot->>MQTT: PUBLISH tonypi/vision/{robot_id}
            Note right of Robot: {detection: false,<br/>state: "SEARCHING"}
        end
    end
    
    MQTT->>Backend: Message on tonypi/vision/+
    Backend->>Backend: Parse vision data
    Backend->>InfluxDB: Write to vision_data measurement
    
    alt Significant detection
        Backend->>PostgreSQL: Log vision event (SystemLog)
    end
```

---

## 8. System Startup Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Docker as Docker Compose
    participant MQTT as Mosquitto
    participant InfluxDB as InfluxDB
    participant PostgreSQL as PostgreSQL
    participant Grafana as Grafana
    participant Backend as Backend API
    participant Frontend as Frontend
    participant Robot as TonyPi Robot

    Note over Docker: docker-compose up -d
    
    Docker->>MQTT: Start Mosquitto container
    MQTT->>MQTT: Load config, open ports 1883, 9001
    MQTT-->>Docker: Healthy
    
    par Database Initialization
        Docker->>InfluxDB: Start InfluxDB container
        InfluxDB->>InfluxDB: Initialize org, bucket, admin user
        InfluxDB-->>Docker: Healthy (ping OK)
    and
        Docker->>PostgreSQL: Start PostgreSQL container
        PostgreSQL->>PostgreSQL: Run init scripts (01_init.sql)
        PostgreSQL->>PostgreSQL: Create tables, extensions
        PostgreSQL-->>Docker: Healthy (pg_isready)
    end
    
    Docker->>Grafana: Start Grafana container
    Grafana->>Grafana: Load provisioned dashboards
    Grafana->>InfluxDB: Test datasource connection
    Grafana->>PostgreSQL: Test datasource connection
    Grafana-->>Docker: Healthy
    
    Docker->>Backend: Start FastAPI container
    Backend->>Backend: Load environment variables
    Backend->>PostgreSQL: Wait for DB connection (retry loop)
    PostgreSQL-->>Backend: Connection successful
    Backend->>Backend: Run SQLAlchemy create_all()
    Backend->>Backend: Initialize default users
    Backend->>MQTT: Start MQTT client
    MQTT-->>Backend: Connected, subscribed to topics
    Backend-->>Docker: Healthy (/api/v1/health)
    
    Docker->>Frontend: Start React container
    Frontend->>Frontend: npm start / serve build
    Frontend->>Backend: Test API connection
    Backend-->>Frontend: Health check OK
    Frontend-->>Docker: Healthy
    
    Note over Robot: Separate from Docker (on Raspberry Pi)
    Robot->>Robot: python tonypi_client.py --broker <host>
    Robot->>MQTT: Connect to broker
    MQTT-->>Robot: Connection ACK
    Robot->>Robot: Subscribe to command topics
    Robot->>MQTT: PUBLISH initial status
    MQTT->>Backend: Status message received
    Backend->>PostgreSQL: Create/update Robot record
    
    Note over Docker: System ready for monitoring
```

---

## 9. Servo Monitoring Detail

```mermaid
sequenceDiagram
    autonumber
    participant Robot as TonyPi Robot
    participant SDK as HiWonder SDK
    participant MQTT as MQTT Broker
    participant Backend as Backend API
    participant InfluxDB as InfluxDB
    participant Frontend as Frontend

    Note over Robot: Read servo status (every 3 seconds)
    
    loop For each servo (1-6)
        Robot->>SDK: get_bus_servo_pulse(servo_id)
        SDK-->>Robot: Position (pulse value)
        Robot->>Robot: Convert pulse to degrees
        
        Robot->>SDK: get_bus_servo_temp(servo_id)
        SDK-->>Robot: Temperature (°C)
        
        Robot->>SDK: get_bus_servo_vin(servo_id)
        SDK-->>Robot: Voltage (mV)
        Robot->>Robot: Convert to Volts
        
        Robot->>Robot: Determine alert_level
        Note right of Robot: normal (<50°C)<br/>warning (50-70°C)<br/>critical (>70°C)
    end
    
    Robot->>MQTT: PUBLISH tonypi/servos/{robot_id}
    Note right of Robot: {robot_id, servos: {<br/>  servo_1: {id, name, position,<br/>    temperature, voltage, alert_level}<br/>  ...<br/>}, servo_count: 6}
    
    MQTT->>Backend: Message on tonypi/servos/+
    
    loop For each servo in message
        Backend->>Backend: Validate servo data
        Backend->>InfluxDB: write_servo_data()
        
        alt Temperature > threshold
            Backend->>Backend: _check_and_create_alert()
        end
        
        alt Voltage < threshold
            Backend->>Backend: _check_and_create_alert()
        end
    end
    
    Frontend->>Backend: GET /api/v1/robot-data/servos/{robot_id}
    Backend->>InfluxDB: Query servo_data (5m)
    InfluxDB-->>Backend: Return servo records
    Backend->>Backend: Group by servo, get latest values
    Backend-->>Frontend: Return servo status object
    Frontend-->>Frontend: Render servo status cards
```

---

## 10. Emergency Stop Flow

```mermaid
sequenceDiagram
    autonumber
    participant User as User
    participant Frontend as Frontend
    participant Backend as Backend API
    participant MQTT as MQTT Broker
    participant Robot as TonyPi Robot
    participant SDK as HiWonder SDK

    Note over User: Emergency situation detected
    User->>Frontend: Click EMERGENCY STOP button
    
    Frontend->>Backend: POST /api/v1/management/robots/{robot_id}/emergency-stop
    
    Backend->>Backend: Create stop command
    Backend->>MQTT: PUBLISH tonypi/commands/{robot_id}
    Note right of Backend: {type: "stop", emergency: true}
    
    Backend->>MQTT: PUBLISH tonypi/commands/broadcast
    Note right of Backend: Broadcast to all robots
    
    Backend-->>Frontend: {success: true, message: "Emergency stop sent"}
    Frontend-->>User: Show confirmation
    
    MQTT->>Robot: Deliver stop command
    Robot->>Robot: Set running = false
    Robot->>SDK: stopActionGroup()
    SDK-->>Robot: Actions stopped
    
    Robot->>MQTT: PUBLISH tonypi/commands/response
    Note right of Robot: {success: true, message: "Robot stopped"}
    
    Robot->>MQTT: PUBLISH tonypi/status/{robot_id}
    Note right of Robot: {status: "stopped"}
```

---

## Data Storage Summary

### InfluxDB Measurements (Time-Series)
| Measurement | Tags | Fields |
|-------------|------|--------|
| sensor_data | robot_id, sensor_type | value, unit |
| servo_data | robot_id, servo_id, servo_name, alert_level | position, temperature, voltage, torque_enabled |
| battery_status | robot_id, charging | percentage, voltage, is_charging |
| robot_location | robot_id | x, y, z |
| robot_status | robot_id, status_type | status, ip_address, camera_url, system_* |
| vision_data | robot_id, state, detection, label, nav_cmd | has_detection, confidence, bbox_*, center_x, is_locked |
| robot_logs | robot_id, level, source | message, level_num |

### PostgreSQL Tables (Relational)
| Table | Purpose |
|-------|---------|
| users | User accounts and authentication |
| robots | Robot registry and metadata |
| alerts | Alert records with thresholds |
| alert_thresholds | Configurable thresholds per metric |
| system_logs | System event logs |
| reports | Generated report records |
| jobs | Job definitions and status |

---

## MQTT Topics Summary

| Topic Pattern | Direction | Description |
|---------------|-----------|-------------|
| tonypi/sensors/{robot_id} | Robot → Backend | Sensor telemetry |
| tonypi/servos/{robot_id} | Robot → Backend | Servo status |
| tonypi/status/{robot_id} | Robot → Backend | System status |
| tonypi/battery | Robot → Backend | Battery status |
| tonypi/location | Robot → Backend | Location updates |
| tonypi/vision/{robot_id} | Robot → Backend | Vision detections |
| tonypi/logs/{robot_id} | Robot → Backend | Log messages |
| tonypi/commands/{robot_id} | Backend → Robot | Commands to specific robot |
| tonypi/commands/broadcast | Backend → Robot | Commands to all robots |
| tonypi/commands/response | Robot → Backend | Command execution results |
| tonypi/scan/{robot_id} | Robot → Backend | QR code scan events |
| tonypi/items/{robot_id} | Backend → Robot | Item lookup responses |
| tonypi/job/{robot_id} | Robot → Backend | Job progress updates |
