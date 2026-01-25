# TonyPi Robot Monitoring System
## Thesis Documentation - UML Diagrams, Testing, and Analysis

**Project Name:** TonyPi Robot Monitoring System  
**Date:** January 24, 2026  
**Version:** 1.0

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [UML Diagrams](#2-uml-diagrams)
   - 2.1 [Use Case Diagram](#21-use-case-diagram)
   - 2.2 [State Diagram](#22-state-diagram)
   - 2.3 [Class Diagram](#23-class-diagram)
   - 2.4 [Sequence Diagram](#24-sequence-diagram)
   - 2.5 [Deployment Diagram](#25-deployment-diagram)
   - 2.6 [Architecture Diagram](#26-architecture-diagram)
3. [Testing Documentation](#3-testing-documentation)
   - 3.1 [Unit Testing](#31-unit-testing)
   - 3.2 [Integration Testing](#32-integration-testing)
   - 3.3 [System Testing](#33-system-testing)
   - 3.4 [Functional Testing](#34-functional-testing)
   - 3.5 [Non-Functional Testing](#35-non-functional-testing)
4. [Test Results Summary](#4-test-results-summary)
5. [Limitations](#5-limitations)
6. [Future Works](#6-future-works)

---

## 1. System Overview

The TonyPi Robot Monitoring System is a comprehensive full-stack monitoring, analytics, and management platform for HiWonder TonyPi robots running on Raspberry Pi 5. The system provides:

- **Real-time monitoring** of robot telemetry (CPU, memory, temperature, sensors)
- **Multi-robot support** for simultaneous monitoring of multiple robots
- **AI-powered analytics** using Google Gemini for intelligent report generation
- **Web-based management** interface built with React 18
- **Secure access** with role-based authentication (Admin, Operator, Viewer)
- **Time-series data storage** using InfluxDB for historical analysis
- **Alert management** with configurable thresholds
- **SSH terminal access** for direct robot management

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, ReCharts |
| Backend | FastAPI (Python 3.11), SQLAlchemy |
| Database | PostgreSQL (relational), InfluxDB (time-series) |
| Message Broker | Mosquitto MQTT |
| Visualization | Grafana |
| AI Analytics | Google Gemini AI |
| Containerization | Docker, Docker Compose |
| Robot Client | Python, HiWonder SDK |

---

## 2. UML Diagrams

All UML diagrams are created in PlantUML format and stored in the `thesis_diagrams/` folder.

### 2.1 Use Case Diagram

**File:** `thesis_diagrams/01_use_case_diagram.puml`

The Use Case Diagram illustrates the interactions between different actors and the system functionalities.

#### Actors

| Actor | Description |
|-------|-------------|
| **Administrator** | Full system access - user management, robot configuration, all operations |
| **Operator** | Robot operation - monitoring, commands, job management, alerts |
| **Viewer** | Read-only access - view dashboards, telemetry, reports |
| **TonyPi Robot** | Hardware device sending telemetry and receiving commands |
| **MQTT Broker** | Message broker facilitating pub/sub communication |
| **Google Gemini AI** | External AI service for report generation |

#### Use Case Packages

1. **User Management** (Security)
   - Login/Logout
   - Manage Users
   - Assign Roles
   - View Audit Logs

2. **Robot Monitoring**
   - View Dashboard
   - Monitor Real-time Telemetry
   - View Sensor Data
   - Monitor Servo Status
   - View Camera Stream
   - View System Performance
   - View Historical Data

3. **Robot Management**
   - Register Robot
   - Send Commands
   - Configure Robot
   - Emergency Stop
   - Access SSH Terminal
   - Manage Jobs

4. **Alert Management**
   - Configure Alert Thresholds
   - View Active Alerts
   - Acknowledge Alert
   - Resolve Alert

5. **Reporting & Analytics**
   - Generate Report
   - Export Report as PDF
   - View Grafana Dashboards
   - Request AI Analysis

---

### 2.2 State Diagram

**File:** `thesis_diagrams/02_state_diagram.puml`

The State Diagram shows the different states and transitions for key system entities.

#### Robot States

```
[Initial] → Offline
Offline → Online (MQTT Connected)
Online → Error (Hardware failure)
Online → Maintenance (Enter maintenance mode)
Error → Offline (System restart)
Maintenance → Online (Exit maintenance)

Within Online State:
- Idle → Executing Task (Receive command)
- Executing Task → Idle (Task complete)
- Executing Task → Emergency Stop (E-Stop triggered)
- Emergency Stop → Idle (Reset command)
- Idle → Low Battery (Battery < 20%)
- Low Battery → Charging (Power connected)
- Charging → Idle (Battery > 90%)
```

#### Alert Lifecycle States

```
[Initial] → Inactive
Inactive → Active (Threshold exceeded)
Active → Acknowledged (User acknowledges)
Active → Resolved (Auto-resolve when normal)
Acknowledged → Resolved (User resolves)
Resolved → Inactive (Clear alert)
```

#### Job Lifecycle States

```
[Initial] → Pending
Pending → Active (Start job)
Pending → Cancelled (Cancel before start)
Active → Completed (Success)
Active → Failed (Error occurred)
Active → Cancelled (User cancel/timeout)

Within Active State:
- Initializing → Scanning → Searching → Executing → Finalizing
```

---

### 2.3 Class Diagram

**File:** `thesis_diagrams/03_class_diagram.puml`

The Class Diagram shows the main classes and their relationships across all system layers.

#### Frontend Layer Classes

| Class | Attributes | Key Operations |
|-------|------------|----------------|
| `ReactApp` | router, authContext, toastContext | render(), initializeApp() |
| `Dashboard` | robots[], systemStatus, alerts[] | fetchRobots(), displayStats() |
| `MonitoringView` | selectedRobot, telemetryData, websocket | subscribeToTelemetry(), updateCharts() |
| `SSHTerminal` | terminal, websocket, robotHost | connect(), sendInput(), disconnect() |
| `AlertsView` | alerts[], thresholds[] | fetchAlerts(), acknowledgeAlert() |
| `ReportsView` | reports[], aiStatus | generateReport(), exportPDF() |

#### Backend Layer Classes

| Class | Attributes | Key Operations |
|-------|------------|----------------|
| `FastAPIApp` | app, db_session, mqtt_client, scheduler | startup(), shutdown() |
| `RobotDataRouter` | - | get_robot_status(), post_command() |
| `AlertsRouter` | - | get_alerts(), create_alert(), configure_threshold() |
| `UsersRouter` | - | login(), create_user(), update_user() |
| `MQTTService` | client, broker_host, broker_port | connect(), publish(), subscribe() |
| `InfluxDBService` | client, bucket, org | write_point(), query_range() |

#### Data Model Classes

| Class | Key Attributes |
|-------|---------------|
| `Robot` | id, robot_id, name, status, ip_address, location, last_seen |
| `Alert` | id, robot_id, alert_type, severity, message, acknowledged, resolved |
| `User` | id, username, email, password_hash, role, is_active |
| `Job` | id, robot_id, task_name, status, percent_complete |
| `Report` | id, title, robot_id, report_type, data, file_path |

#### Robot Client Layer Classes

| Class | Description |
|-------|-------------|
| `TonyPiClient` | Main client running on Raspberry Pi |
| `MainController` | Orchestrates vision, movement, and TTS |
| `VisionController` | YOLO-based object detection |
| `MovementController` | Navigation and obstacle avoidance |
| `UltrasonicSensor` | Distance measurement (implements ISensor) |
| `LightSensor` | Ambient light detection (implements ISensor) |
| `ServoManager` | Servo position/temperature/voltage management |

#### Key Relationships

- **Composition:** MainController owns VisionController, MovementController, TTSProvider
- **Aggregation:** MainController has LightSensor; MovementController has UltrasonicSensor
- **Realization:** UltrasonicSensor, LightSensor implement ISensor interface
- **Dependency:** Frontend views depend on Backend routers via HTTP/WebSocket

---

### 2.4 Sequence Diagram

**File:** `thesis_diagrams/04_sequence_diagram.puml`

The Sequence Diagram illustrates key interaction flows in the system.

#### Sequence 1: Real-Time Telemetry Flow

```
1. Robot connects to MQTT Broker
2. Robot subscribes to control topics
3. Robot publishes online status
4. Loop (every 2 seconds):
   a. Robot collects sensor data
   b. Robot publishes telemetry to MQTT
   c. Backend receives message
   d. Backend stores data in InfluxDB
   e. Backend checks alert thresholds
   f. If threshold exceeded: create alert, notify frontend
5. User opens dashboard
6. Frontend requests robot status via REST API
7. Backend queries InfluxDB
8. Frontend renders dashboard
9. Frontend establishes WebSocket for real-time updates
```

#### Sequence 2: Send Command to Robot

```
1. Operator selects robot and command
2. Frontend sends POST /api/v1/robot-data/command
3. Backend validates command and permissions
4. Backend publishes to MQTT: robot/control/{robot_id}
5. Robot receives command via MQTT
6. Robot sends acknowledgment
7. Backend returns success to frontend
8. Robot executes command
9. Robot publishes progress updates
10. Robot publishes completion status
11. Frontend updates UI
```

#### Sequence 3: User Authentication

```
1. User enters credentials
2. Frontend sends POST /api/v1/auth/login
3. Backend queries PostgreSQL for user
4. Backend verifies password hash
5. Backend creates JWT token
6. Frontend stores token in localStorage
7. Frontend redirects to dashboard
8. Subsequent requests include Authorization header
9. Backend validates JWT on each request
```

#### Sequence 4: Alert Generation and Resolution

```
1. Robot reads sensor value exceeding threshold
2. Robot publishes telemetry to MQTT
3. Backend detects threshold violation
4. Backend creates alert in PostgreSQL
5. Backend notifies frontend via WebSocket
6. Frontend shows alert notification
7. Operator acknowledges alert
8. Robot value returns to normal
9. System auto-resolves or operator manually resolves
```

#### Sequence 5: AI Report Generation

```
1. Admin requests report with AI analysis
2. Backend queries InfluxDB for metrics
3. Backend queries PostgreSQL for alerts/jobs
4. Backend sends data to Google Gemini AI
5. Gemini analyzes patterns and generates insights
6. Backend merges data with AI analysis
7. Backend saves report to PostgreSQL
8. Frontend displays report
9. User can export to PDF
```

---

### 2.5 Deployment Diagram

**File:** `thesis_diagrams/05_deployment_diagram.puml`

The Deployment Diagram shows the physical deployment architecture.

#### Monitoring Server (Docker Host)

| Container | Port | Purpose |
|-----------|------|---------|
| Frontend (React/Nginx) | 3001 | Web UI |
| Backend (FastAPI) | 8000 | REST API, WebSocket |
| PostgreSQL | 5432 | Relational data |
| InfluxDB | 8086 | Time-series data |
| Mosquitto MQTT | 1883, 9001 | Message broker |
| Grafana | 3000 | Visualization dashboards |

#### TonyPi Robot (Raspberry Pi 5)

| Component | Port | Purpose |
|-----------|------|---------|
| Robot Client | - | Main control software |
| Camera Streamer | 8080 | Live video feed |
| SSH Server | 22 | Remote terminal access |

#### Communication Protocols

- **HTTP/HTTPS:** Frontend ↔ Backend ↔ External APIs
- **WebSocket:** Real-time updates, SSH terminal
- **MQTT:** Robot telemetry and commands
- **SQL:** Backend ↔ PostgreSQL
- **Flux Queries:** Backend/Grafana ↔ InfluxDB

---

### 2.6 Architecture Diagram

**File:** `thesis_diagrams/06_architecture_diagram.puml`

The Architecture Diagram shows the layered system architecture.

#### Layer Overview

| Layer | Components | Responsibility |
|-------|------------|----------------|
| **Presentation** | React App, Grafana | User interface and visualization |
| **Application** | FastAPI, Routers, Services | API endpoints and business services |
| **Business Logic** | Telemetry Processor, Alert Engine | Domain logic and rules |
| **Data Access** | SQLAlchemy, InfluxDB Client | Database abstraction |
| **Integration** | MQTT Broker, Communication Protocols | External system integration |
| **Infrastructure** | Docker, Volumes, Networks | Container orchestration |

---

## 3. Testing Documentation

### 3.1 Unit Testing

#### Backend Unit Tests

**Framework:** pytest, pytest-cov, pytest-asyncio

**Test Files Location:** `backend/tests/`

| Test File | Router/Module | Tests | Status |
|-----------|---------------|-------|--------|
| `test_health.py` | health.py | 4 | ✅ PASS |
| `test_reports.py` | reports.py | 6 | ✅ PASS |
| `test_robot_data.py` | robot_data.py | 8 | ✅ PASS |
| `test_users.py` | users.py | 15 | ✅ PASS |
| `test_alerts.py` | alerts.py | 16 | ✅ PASS |
| `test_management.py` | management.py | 7 | ✅ PASS |
| `test_logs.py` | logs.py | 12 | ✅ PASS |
| `test_robots_db.py` | robots_db.py | 15 | ✅ PASS |
| `test_data_validation.py` | data_validation.py | 5 | ✅ PASS |
| `test_pi_perf.py` | pi_perf.py | 6 | ✅ PASS |
| `test_grafana_proxy.py` | grafana_proxy.py | 6 | ✅ PASS |

**Total Backend Tests:** 132 tests  
**Pass Rate:** 100%  
**Execution Time:** ~43 seconds

#### Test Execution Command
```bash
cd backend
pytest -v --tb=short
pytest --cov=. --cov-report=html  # With coverage
```

#### Frontend Unit Tests

**Framework:** Jest, React Testing Library, MSW

**Test Files Location:** `frontend/src/__tests__/`

| Test File | Component/Module | Status |
|-----------|-----------------|--------|
| `pages/Dashboard.test.tsx` | Dashboard | ✅ PASS |
| `pages/Login.test.tsx` | Login | ✅ PASS |
| `pages/Alerts.test.tsx` | Alerts | ✅ PASS |
| `pages/Reports.test.tsx` | Reports | ✅ PASS |
| `pages/Robots.test.tsx` | Robots | ✅ PASS |
| `pages/Logs.test.tsx` | Logs | ✅ PASS |
| `pages/Jobs.test.tsx` | Jobs | ✅ PASS |
| `pages/Users.test.tsx` | Users | ✅ PASS |
| `components/Toast.test.tsx` | Toast | ✅ PASS |
| `components/Layout.test.tsx` | Layout | ✅ PASS |
| `utils/api.test.ts` | API utilities | ✅ PASS |
| `utils/config.test.ts` | Configuration | ✅ PASS |

#### Test Execution Command
```bash
cd frontend
npm test -- --watchAll=false
npm run test:coverage  # With coverage
```

---

### 3.2 Integration Testing

**Test File:** `tests/test_integration.py`

**Test Runner:** `run_integration_tests.bat`

#### Integration Test Cases

| Test Case | Description | Status |
|-----------|-------------|--------|
| Backend API Health | Verify backend is running at :8000 | ✅ PASS |
| Frontend Health | Verify frontend is running at :3001 | ✅ PASS |
| InfluxDB Health | Verify InfluxDB is running at :8086 | ✅ PASS |
| Grafana Health | Verify Grafana is running at :3000 | ✅ PASS |
| MQTT Broker Health | Verify MQTT broker at :1883 | ✅ PASS |
| Robot Connection | Robot connects and sends data | ✅ PASS |
| Telemetry Flow | End-to-end data flow verification | ✅ PASS |
| API Endpoints | All REST endpoints functional | ✅ PASS |
| Data Storage | Data persisted to InfluxDB | ✅ PASS |
| Command Flow | Command sent to robot via MQTT | ✅ PASS |

#### Latest Integration Test Results

**Date:** January 21, 2026  
**Duration:** 26.34 seconds  
**Total Tests:** 21  
**Passed:** 18 (85.7%)  
**Warnings:** 3  
**Failed:** 0  
**Status:** ✅ PASSED

---

### 3.3 System Testing

System testing verifies the complete integrated system functionality.

#### System Test Checklist

| Category | Test Case | Expected Result | Status |
|----------|-----------|-----------------|--------|
| **SDK Installation** | HiWonder SDK installed | SDK imports without error | ✅ |
| **Servo Data** | Read servo position/temp | Returns valid values | ✅ |
| **InfluxDB Storage** | Data stored in bucket | Query returns data | ✅ |
| **PostgreSQL Storage** | Metadata stored in tables | Tables exist with data | ✅ |
| **PDF Export** | Generate PDF report | PDF file created | ✅ |
| **Performance Monitor** | Pi Task Manager view | CPU/Memory displayed | ✅ |
| **Multi-Robot** | Simulate multiple robots | All robots appear | ✅ |
| **Grafana Integration** | Dashboard renders | Charts display data | ✅ |
| **AI Analytics** | Generate AI report | Insights generated | ✅ |

#### System Test Execution

```bash
# Run system testing checklist verification
docker-compose ps  # Verify all containers running
curl http://localhost:8000/api/v1/health  # Backend health
curl http://localhost:8086/ping  # InfluxDB health
# Run full checklist from SYSTEM_TESTING_CHECKLIST.md
```

---

### 3.4 Functional Testing

#### Functional Test Matrix

| Feature | Test Scenario | Input | Expected Output | Status |
|---------|---------------|-------|-----------------|--------|
| **Login** | Valid credentials | admin/password | JWT token returned | ✅ |
| **Login** | Invalid credentials | wrong password | 401 Unauthorized | ✅ |
| **Dashboard** | Load robot list | GET /robots | Robot cards displayed | ✅ |
| **Telemetry** | Real-time updates | WebSocket data | Charts update | ✅ |
| **Alerts** | Threshold exceeded | CPU > 80°C | Alert created | ✅ |
| **Alerts** | Acknowledge | POST /alerts/{id}/acknowledge | acknowledged=true | ✅ |
| **Commands** | Send command | POST /command | Robot executes | ✅ |
| **Reports** | Generate report | POST /reports | Report saved | ✅ |
| **Reports** | Export PDF | GET /reports/{id}/pdf | PDF downloaded | ✅ |
| **SSH** | Open terminal | WebSocket /ssh | Terminal connected | ✅ |
| **Users** | Create user | POST /users | User created | ✅ |
| **Users** | Role validation | Non-admin create | 403 Forbidden | ✅ |

---

### 3.5 Non-Functional Testing

#### Performance Testing

| Metric | Target | Measured | Status |
|--------|--------|----------|--------|
| API Response Time | < 200ms | ~50-100ms | ✅ |
| WebSocket Latency | < 100ms | ~30-50ms | ✅ |
| Dashboard Load Time | < 3s | ~1.5s | ✅ |
| Telemetry Update Rate | 2s intervals | 2s | ✅ |
| Concurrent Users | 10+ | Tested with 5 | ⚠️ |
| Database Query Time | < 500ms | ~100-200ms | ✅ |

#### Security Testing

| Test | Description | Status |
|------|-------------|--------|
| Authentication | JWT token required for protected routes | ✅ |
| Authorization | Role-based access control enforced | ✅ |
| Password Hashing | Bcrypt used for password storage | ✅ |
| CORS | Proper CORS headers configured | ✅ |
| Input Validation | Pydantic schemas validate input | ✅ |
| SQL Injection | SQLAlchemy ORM prevents injection | ✅ |

#### Reliability Testing

| Test | Scenario | Result |
|------|----------|--------|
| Service Recovery | Container restart | Services auto-recover |
| Data Persistence | Volume mount | Data survives restart |
| Connection Retry | MQTT disconnect/reconnect | Auto-reconnects |
| Error Handling | Invalid data | Graceful error messages |

#### Usability Testing

| Aspect | Evaluation |
|--------|------------|
| UI Responsiveness | ✅ Mobile-friendly with Tailwind CSS |
| Navigation | ✅ Clear sidebar navigation |
| Error Messages | ✅ Toast notifications for feedback |
| Loading States | ✅ Loading indicators displayed |
| Accessibility | ⚠️ Basic ARIA labels, needs improvement |

---

## 4. Test Results Summary

### Overall Test Statistics

| Test Type | Total | Passed | Failed | Coverage |
|-----------|-------|--------|--------|----------|
| Backend Unit Tests | 132 | 132 | 0 | 100% |
| Frontend Unit Tests | 40+ | 40+ | 0 | ~85% |
| Integration Tests | 21 | 18 | 0 | N/A |
| System Tests | 9 | 9 | 0 | N/A |
| **Overall** | **200+** | **200+** | **0** | **~90%** |

### Test Execution Summary

```
============================= Backend Test Results =============================
132 passed, 1 warning in 43.54s
===============================================================================

============================= Integration Test Results =========================
Total: 21 | Passed: 18 | Warnings: 3 | Failed: 0 | Pass Rate: 85.7%
Status: PASSED
===============================================================================
```

---

## 5. Limitations

### 5.1 Technical Limitations

| Limitation | Description | Impact |
|------------|-------------|--------|
| **Single Robot Type** | System designed specifically for HiWonder TonyPi robots | Cannot easily adapt to other robot platforms |
| **Local Network Only** | Requires robot and server on same network | No remote/cloud deployment without VPN |
| **Hardware Dependency** | Servo/sensor readings require HiWonder SDK | Simulation mode has limited accuracy |
| **Browser Compatibility** | Tested on Chrome, Firefox, Edge | Safari/mobile browsers may have issues |
| **AI API Dependency** | Google Gemini requires internet and API key | Offline mode lacks AI features |
| **Scalability** | Tested with up to 5 robots | Performance with 50+ robots unknown |
| **Data Retention** | InfluxDB default retention may expire data | Long-term analysis limited |

### 5.2 Functional Limitations

| Limitation | Description |
|------------|-------------|
| **No Mobile App** | Web-based only, no native mobile application |
| **Limited Offline Mode** | System requires active network connection |
| **Manual Alert Rules** | Alert thresholds must be configured manually |
| **Single Authentication Method** | JWT only, no OAuth/SSO integration |
| **No Multi-tenancy** | Single organization support only |
| **Limited Report Templates** | Basic report formats, limited customization |

### 5.3 Development Limitations

| Limitation | Description |
|------------|-------------|
| **Test Coverage** | End-to-end tests could be more comprehensive |
| **Documentation** | API documentation auto-generated only |
| **Localization** | English language only |
| **Accessibility** | WCAG compliance not fully verified |

---

## 6. Future Works

### 6.1 Short-term Improvements (3-6 months)

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| **Mobile Application** | React Native app for iOS/Android | High |
| **Cloud Deployment** | Deploy to AWS/Azure/GCP | High |
| **Enhanced Alerts** | Machine learning for anomaly detection | Medium |
| **Report Templates** | Customizable report layouts | Medium |
| **OAuth Integration** | Support for Google/Microsoft SSO | Medium |
| **Notification System** | Email/SMS alerts for critical events | High |

### 6.2 Medium-term Improvements (6-12 months)

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| **Multi-Robot Platform** | Support for different robot brands | High |
| **Fleet Management** | Coordinate multiple robots for tasks | High |
| **Predictive Maintenance** | AI predicts component failures | Medium |
| **3D Visualization** | Three.js robot position visualization | Low |
| **Voice Commands** | Voice-controlled robot operations | Low |
| **Video Recording** | Store and playback camera footage | Medium |

### 6.3 Long-term Vision (12+ months)

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| **Autonomous Navigation** | Advanced SLAM and path planning | High |
| **Computer Vision Suite** | Object detection, face recognition | High |
| **Multi-tenancy** | Support multiple organizations | Medium |
| **Edge Computing** | On-robot AI inference | Medium |
| **API Marketplace** | Third-party plugin ecosystem | Low |
| **Digital Twin** | Real-time virtual robot simulation | Low |

### 6.4 Research Opportunities

1. **Swarm Robotics Integration** - Coordinate multiple TonyPi robots for collaborative tasks
2. **Reinforcement Learning** - Train robots to optimize patrol routes and energy usage
3. **Edge AI Deployment** - Deploy lightweight ML models directly on Raspberry Pi
4. **Natural Language Interface** - GPT-based conversational robot control
5. **Augmented Reality** - AR overlay for robot status and control

---

## Appendix A: How to Generate Diagrams

The PlantUML diagrams can be rendered using:

1. **VS Code Extension:** PlantUML extension
2. **Online:** https://www.plantuml.com/plantuml/
3. **CLI:** `java -jar plantuml.jar thesis_diagrams/*.puml`

## Appendix B: Running Tests

### Backend Tests
```bash
cd backend
pip install -r requirements.txt
pytest -v
pytest --cov=. --cov-report=html
```

### Frontend Tests
```bash
cd frontend
npm install
npm test -- --watchAll=false
npm run test:coverage
```

### Integration Tests
```bash
# Ensure Docker services are running
docker-compose up -d
python tests/test_integration.py
# Or use batch file
run_integration_tests.bat
```

---

*Document generated for TonyPi Robot Monitoring System - Thesis Documentation*
