# TonyPi Robot Monitoring System - Complete Thesis Documentation

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Use Case Diagram](#4-use-case-diagram)
5. [Class Diagram](#5-class-diagram)
6. [Sequence Diagrams](#6-sequence-diagrams)
7. [State Diagrams](#7-state-diagrams)
8. [Database Design](#8-database-design)
9. [User Interface Design](#9-user-interface-design)
10. [MQTT Communication Protocol](#10-mqtt-communication-protocol)
11. [API Endpoints](#11-api-endpoints)
12. [Security Architecture](#12-security-architecture)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Testing](#14-testing)
    - [Unit Testing](#141-unit-testing)
    - [User Acceptance Testing (UAT)](#142-user-acceptance-testing-uat)
    - [System Usability Scale (SUS)](#143-system-usability-scale-sus)

---

## 1. System Overview

### 1.1 Introduction

The **TonyPi Robot Monitoring System** is a comprehensive full-stack web application designed for real-time monitoring, control, and management of HiWonder TonyPi humanoid robots powered by Raspberry Pi. The system provides real-time telemetry data collection, interactive visualization, remote control capabilities, alert management, and AI-powered analytics through a modern web interface.

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| **Real-time Monitoring** | Live sensor data streaming via MQTT protocol |
| **Interactive Dashboard** | System overview with robot status, health metrics, and performance indicators |
| **Data Visualization** | Time-series charts using InfluxDB and Grafana |
| **Remote Management** | Send commands and configure robots remotely |
| **Alert System** | Automated threshold-based alerts with acknowledgment workflow |
| **Reporting System** | Automated and custom reports with AI-powered analytics (Google Gemini) |
| **Job Tracking** | Monitor job progress and item scanning |
| **User Management** | Role-based access control (Admin, Operator, Viewer) |
| **Responsive UI** | Modern React TypeScript interface with dark/light theme |
| **Containerized Deployment** | Complete Docker-based microservices infrastructure |

### 1.3 System Components

The system consists of 7 main components:

1. **Web Frontend** (React + TypeScript) - Modern user interface
2. **Backend API** (FastAPI/Python) - REST API server
3. **MQTT Broker** (Eclipse Mosquitto) - Message queuing for robot communication
4. **Time-series Database** (InfluxDB) - Sensor and performance data storage
5. **Relational Database** (PostgreSQL) - Users, robots, alerts, reports storage
6. **Visualization** (Grafana) - Advanced data visualization dashboards
7. **Robot Client** (Python) - Runs on TonyPi robot (Raspberry Pi)

---

## 2. Technology Stack

### 2.1 Complete Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TECHNOLOGY STACK                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         FRONTEND LAYER                                   │    │
│  │  • React 18              • TypeScript 5.x        • TailwindCSS 3.x      │    │
│  │  • React Router 6        • Axios                 • Lucide React         │    │
│  │  • Context API           • MQTT.js               • Recharts             │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                     │                                            │
│                              HTTP/REST │ WebSocket                               │
│                                     ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         BACKEND LAYER                                    │    │
│  │  • FastAPI 0.104+        • Python 3.11+          • SQLAlchemy 2.x       │    │
│  │  • Pydantic 2.x          • Paho-MQTT             • python-jose (JWT)    │    │
│  │  • Passlib (bcrypt)      • HTTPx                 • InfluxDB Client      │    │
│  │  • Google Gemini AI      • Uvicorn               • Alembic              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                     │                                            │
│                                     ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                          DATA LAYER                                      │    │
│  │  • PostgreSQL 15         (Relational data - Users, Robots, Alerts)      │    │
│  │  • InfluxDB 2.7          (Time-series - Sensors, Performance metrics)   │    │
│  │  • Eclipse Mosquitto 2.0 (MQTT Message Broker)                          │    │
│  │  • Grafana 10.0          (Data visualization)                           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                     │                                            │
│                              MQTT Protocol                                       │
│                                     ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         ROBOT CLIENT LAYER                               │    │
│  │  • Python 3.11+          • Paho-MQTT             • psutil               │    │
│  │  • HiWonder SDK          • RPi.GPIO (optional)   • OpenCV (optional)    │    │
│  │  • Raspberry Pi 5        • Camera Module         • Servo Motors (x6)    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                       INFRASTRUCTURE LAYER                               │    │
│  │  • Docker & Docker Compose  • Bridge Network     • Volume Persistence   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack Summary Table

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 18.x | User interface framework |
| **Frontend** | TypeScript | 5.x | Type-safe JavaScript |
| **Frontend** | TailwindCSS | 3.x | Utility-first CSS styling |
| **Frontend** | React Router | 6.x | Client-side routing |
| **Frontend** | Axios | 1.5.x | HTTP client |
| **Frontend** | MQTT.js | 5.x | WebSocket MQTT client |
| **Frontend** | Recharts | 2.8.x | Data visualization charts |
| **Frontend** | Lucide React | 0.4.x | Icon library |
| **Backend** | FastAPI | 0.104.x | Modern Python web framework |
| **Backend** | Python | 3.11+ | Runtime environment |
| **Backend** | SQLAlchemy | 2.x | ORM for database operations |
| **Backend** | Pydantic | 2.x | Data validation |
| **Backend** | Paho-MQTT | 1.6.x | MQTT client library |
| **Backend** | python-jose | 3.3.x | JWT token handling |
| **Backend** | Passlib | 1.7.x | Password hashing (bcrypt) |
| **Backend** | InfluxDB Client | 1.38.x | Time-series database client |
| **Database** | PostgreSQL | 15 | Relational database |
| **Database** | InfluxDB | 2.7 | Time-series database |
| **Messaging** | Eclipse Mosquitto | 2.0 | MQTT broker |
| **Visualization** | Grafana | 10.0 | Dashboard & charts |
| **AI** | Google Gemini | Latest | AI-powered analytics |
| **Infrastructure** | Docker | Latest | Containerization |
| **Infrastructure** | Docker Compose | 2.x | Container orchestration |
| **Robot** | Raspberry Pi | 5 | Robot hardware platform |
| **Robot** | HiWonder SDK | - | TonyPi robot control |

### 2.3 Frontend Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0",
    "typescript": "^4.9.5",
    "axios": "^1.5.0",
    "mqtt": "^5.3.0",
    "recharts": "^2.8.0",
    "lucide-react": "^0.400.0",
    "@headlessui/react": "^1.7.17",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  }
}
```

### 2.4 Backend Dependencies (requirements.txt)

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
influxdb-client==1.38.0
paho-mqtt==1.6.1
python-dotenv==1.0.0
httpx==0.25.2
python-multipart==0.0.6
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
```

### 2.5 Robot Client Dependencies

```
paho-mqtt>=1.6.1
psutil>=5.9.0
asyncio-mqtt>=0.11.0
# Optional hardware integration:
# RPi.GPIO>=0.7.1
# gpiozero>=1.6.2
# picamera2>=0.3.0
# opencv-python>=4.7.0
```

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │
│  │   Web Browser    │    │  TonyPi Robot    │    │   Mobile Device  │          │
│  │   (React App)    │    │  (Python Client) │    │   (Future)       │          │
│  └────────┬─────────┘    └────────┬─────────┘    └──────────────────┘          │
│           │                       │                                             │
└───────────┼───────────────────────┼─────────────────────────────────────────────┘
            │ HTTP/REST             │ MQTT
            │ WebSocket             │
┌───────────┴───────────────────────┴─────────────────────────────────────────────┐
│                           APPLICATION LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │
│  │   React Frontend │    │   FastAPI        │    │   Grafana        │          │
│  │   (Port 3001)    │◄──►│   Backend        │◄──►│   Dashboard      │          │
│  │                  │    │   (Port 8000)    │    │   (Port 3000)    │          │
│  └──────────────────┘    └────────┬─────────┘    └────────┬─────────┘          │
│                                   │                       │                     │
└───────────────────────────────────┼───────────────────────┼─────────────────────┘
                                    │                       │
┌───────────────────────────────────┼───────────────────────┼─────────────────────┐
│                           SERVICE LAYER                   │                      │
├───────────────────────────────────────────────────────────┼─────────────────────┤
│  ┌──────────────────┐                                     │                     │
│  │   Eclipse        │                                     │                     │
│  │   Mosquitto      │◄────────────────────────────────────┘                     │
│  │   MQTT Broker    │                                                           │
│  │   (Port 1883,    │                                                           │
│  │    9001-WS)      │                                                           │
│  └──────────────────┘                                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────────────┐
│                           DATA LAYER                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐                                   │
│  │   PostgreSQL     │    │   InfluxDB       │                                   │
│  │   (Port 5432)    │    │   (Port 8086)    │                                   │
│  │                  │    │                  │                                   │
│  │   - Users        │    │   - Time-series  │                                   │
│  │   - Robots       │    │   - Sensor data  │                                   │
│  │   - Jobs         │    │   - Performance  │                                   │
│  │   - Alerts       │    │   - Metrics      │                                   │
│  │   - Reports      │    │                  │                                   │
│  │   - Logs         │    │                  │                                   │
│  └──────────────────┘    └──────────────────┘                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Architecture

#### 3.2.1 Frontend Architecture (React Application)

```
frontend/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── GrafanaPanel.tsx     # Embedded Grafana visualizations
│   │   ├── Layout.tsx           # App layout wrapper
│   │   └── Toast.tsx            # Notification toasts
│   ├── contexts/                # React Context providers
│   │   ├── AuthContext.tsx      # Authentication state
│   │   ├── NotificationContext.tsx
│   │   └── ThemeContext.tsx     # Dark/Light theme
│   ├── pages/                   # Page components
│   │   ├── Dashboard.tsx        # Overview dashboard
│   │   ├── Monitoring.tsx       # Performance monitoring
│   │   ├── Robots.tsx           # Robot management
│   │   ├── Sensors.tsx          # Sensor data display
│   │   ├── Servos.tsx           # Servo monitoring
│   │   ├── Jobs.tsx             # Job tracking
│   │   ├── Alerts.tsx           # Alert management
│   │   ├── Logs.tsx             # System logs
│   │   ├── Reports.tsx          # Report generation
│   │   ├── Users.tsx            # User management (admin)
│   │   └── Login.tsx            # Authentication
│   ├── utils/                   # Utility functions
│   │   ├── api.ts               # API service layer
│   │   ├── config.ts            # Configuration
│   │   ├── grafana.ts           # Grafana integration
│   │   └── useMqtt.ts           # MQTT WebSocket hook
│   └── types/                   # TypeScript definitions
│       └── index.ts
```

#### 3.2.2 Backend Architecture (FastAPI Application)

```
backend/
├── main.py                      # Application entry point
├── database/
│   ├── database.py              # PostgreSQL connection
│   └── influx_client.py         # InfluxDB client
├── models/                      # SQLAlchemy models
│   ├── user.py
│   ├── robot.py
│   ├── job.py
│   ├── alert.py
│   ├── report.py
│   └── system_log.py
├── routers/                     # API route handlers
│   ├── health.py                # Health checks
│   ├── robot_data.py            # Robot telemetry
│   ├── robots_db.py             # Robot CRUD
│   ├── pi_perf.py               # Pi performance metrics
│   ├── alerts.py                # Alert management
│   ├── logs.py                  # System logging
│   ├── reports.py               # Report generation
│   ├── users.py                 # User management
│   ├── management.py            # Robot control commands
│   ├── grafana_proxy.py         # Grafana API proxy
│   └── data_validation.py       # Input validation
├── mqtt/
│   └── mqtt_client.py           # MQTT client handler
├── services/
│   └── gemini_analytics.py      # AI-powered analytics
└── utils/
    └── auth.py                  # JWT authentication
```

### 3.3 Data Flow Diagrams

#### 3.3.1 Real-Time Telemetry Flow

```
┌─────────────┐    MQTT     ┌──────────────┐   Write    ┌──────────────┐
│  TonyPi     │────────────►│   MQTT       │───────────►│   InfluxDB   │
│  Robot      │  telemetry  │   Broker     │            │              │
└─────────────┘             └──────┬───────┘            └──────────────┘
                                   │                           │
                                   │ Subscribe                 │ Query
                                   ▼                           ▼
                           ┌──────────────┐   Query    ┌──────────────┐
                           │   Backend    │◄───────────│   Grafana    │
                           │   (FastAPI)  │            │              │
                           └──────┬───────┘            └──────────────┘
                                  │
                                  │ REST API
                                  ▼
                           ┌──────────────┐
                           │   Frontend   │
                           │   (React)    │
                           └──────────────┘
```

#### 3.3.2 Command & Control Flow

```
┌──────────────┐   REST API   ┌──────────────┐   MQTT Publish  ┌──────────────┐
│   Frontend   │─────────────►│   Backend    │────────────────►│   MQTT       │
│   (React)    │  /command    │   (FastAPI)  │                 │   Broker     │
└──────────────┘              └──────────────┘                 └──────┬───────┘
                                                                      │
                                                                      │ Subscribe
                                                                      ▼
                                                               ┌──────────────┐
                                                               │   TonyPi     │
                                                               │   Robot      │
                                                               └──────────────┘
```

### 3.4 Network Architecture

#### Docker Network Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    tonypi_network (bridge)                       │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  frontend   │  │  backend    │  │  grafana    │             │
│  │  :3000      │  │  :8000      │  │  :3000      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  mosquitto  │  │  postgres   │  │  influxdb   │             │
│  │  :1883,9001 │  │  :5432      │  │  :8086      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

External Port Mappings:
- 3001 → frontend:3000
- 8000 → backend:8000
- 3000 → grafana:3000
- 1883 → mosquitto:1883
- 9001 → mosquitto:9001
- 5432 → postgres:5432
- 8086 → influxdb:8086
```

---

## 4. Use Case Diagram

### 4.1 Actors

| Actor | Description |
|-------|-------------|
| **Admin** | Full system access including user management, system configuration, and all monitoring features |
| **Operator** | Can monitor robots, send commands, manage alerts, and generate reports |
| **Viewer** | Read-only access to dashboards, monitoring data, and reports |
| **TonyPi Robot** | The physical robot client that sends telemetry and receives commands |
| **System (Backend)** | Automated processes for data processing, alert generation, and threshold monitoring |
| **Gemini AI** | External AI service for analytics and report generation |

### 4.2 Use Case Diagram (Simplified View)

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │              TonyPi Monitoring System                        │
                    │                                                              │
    ┌─────────┐     │  ┌──────────────────────────────────────────────────────┐   │
    │  Admin  │─────┼─►│  🔐 Authentication (Login, Logout, Profile)          │   │
    └─────────┘     │  └──────────────────────────────────────────────────────┘   │
         │          │                                                              │
         │          │  ┌──────────────────────────────────────────────────────┐   │
         ├─────────┼─►│  👥 User Management (CRUD Users, Assign Roles)        │   │
         │          │  └──────────────────────────────────────────────────────┘   │
         │          │                                                              │
         │          │  ┌──────────────────────────────────────────────────────┐   │
         ├─────────┼─►│  🤖 Robot Management (Register, Configure, Delete)    │   │
         │          │  └──────────────────────────────────────────────────────┘   │
         │          │                                                              │
         │          │  ┌──────────────────────────────────────────────────────┐   │
         ├─────────┼─►│  🎮 Robot Control (Commands, Emergency Stop)          │   │
         │          │  └──────────────────────────────────────────────────────┘   │
         │          │                                                              │
         │          │  ┌──────────────────────────────────────────────────────┐   │
    ┌────┴────┐    │  │  📊 Monitoring (Dashboard, Sensors, Servos)           │   │
    │ Operator │────┼─►└──────────────────────────────────────────────────────┘   │
    └────┬────┘    │                                                              │
         │          │  ┌──────────────────────────────────────────────────────┐   │
         ├─────────┼─►│  🚨 Alerts (View, Acknowledge, Resolve, Thresholds)   │   │
         │          │  └──────────────────────────────────────────────────────┘   │
         │          │                                                              │
         │          │  ┌──────────────────────────────────────────────────────┐   │     ┌─────────────┐
         ├─────────┼─►│  📑 Reports (Generate, View, Download, AI Analysis)   │───┼────►│  Gemini AI  │
         │          │  └──────────────────────────────────────────────────────┘   │     └─────────────┘
         │          │                                                              │
    ┌────┴────┐    │  ┌──────────────────────────────────────────────────────┐   │
    │  Viewer  │────┼─►│  📋 Logs (View, Filter)                              │   │
    └─────────┘    │  └──────────────────────────────────────────────────────┘   │
                    │                                                              │
                    │  ┌──────────────────────────────────────────────────────┐   │
                    │  │  📦 Jobs (Track Progress, View Summary)               │   │
                    │  └──────────────────────────────────────────────────────┘   │
                    │                                                              │
                    └──────────────────────────────────────────────────────────────┘
                                              ▲
                                              │ MQTT
                                              │
                                     ┌────────┴────────┐
                                     │   TonyPi Robot  │
                                     │  (Telemetry &   │
                                     │   Commands)     │
                                     └─────────────────┘
```

### 4.3 Access Control Matrix

| Use Case Category | Admin | Operator | Viewer |
|-------------------|:-----:|:--------:|:------:|
| **Authentication** | ✅ | ✅ | ✅ |
| **User Management** | ✅ | ❌ | ❌ |
| **Robot Registration** | ✅ | ❌ | ❌ |
| **Robot Configuration** | ✅ | ❌ | ❌ |
| **View Robots** | ✅ | ✅ | ✅ |
| **Robot Control** | ✅ | ✅ | ❌ |
| **Emergency Stop** | ✅ | ✅ | ❌ |
| **Shutdown Robot** | ✅ | ❌ | ❌ |
| **View Monitoring Data** | ✅ | ✅ | ✅ |
| **View Alerts** | ✅ | ✅ | ✅ |
| **Acknowledge/Resolve Alerts** | ✅ | ✅ | ❌ |
| **Configure Thresholds** | ✅ | ❌ | ❌ |
| **Generate Reports** | ✅ | ✅ | ❌ |
| **View Reports** | ✅ | ✅ | ✅ |
| **Download PDF** | ✅ | ✅ | ✅ |
| **View Logs** | ✅ | ✅ | ✅ |
| **Filter/Export Logs** | ✅ | ✅ | ❌ |
| **View Jobs** | ✅ | ✅ | ✅ |

### 4.4 Detailed Use Case Descriptions

#### 4.4.1 Authentication Use Cases

| Use Case | Actor(s) | Description | Preconditions | Postconditions |
|----------|----------|-------------|---------------|----------------|
| **UC1: Login** | All Users | User authenticates with username/password | Valid account exists | JWT token issued, session created |
| **UC2: Logout** | All Users | User ends their session | User is logged in | Token invalidated, session ended |
| **UC3: View Profile** | All Users | User views their account details | User is logged in | Profile information displayed |

#### 4.4.2 Robot Control Use Cases

| Use Case | Actor(s) | Description | Preconditions | Postconditions |
|----------|----------|-------------|---------------|----------------|
| **Send Movement Command** | Admin, Operator | Send move/turn command | Robot online | Command sent via MQTT |
| **Emergency Stop** | Admin, Operator | Immediately stop robot | Robot online | Robot stops all actions |
| **Request Status** | Admin, Operator | Query robot's current state | Robot online | Status returned |
| **Send Head Commands** | Admin, Operator | Control head nod/shake | Robot online | Action executed |
| **Shutdown Robot** | Admin | Remotely shutdown robot | Robot online, Admin | Robot shuts down |

#### 4.4.3 Monitoring Use Cases

| Use Case | Actor(s) | Description | Preconditions | Postconditions |
|----------|----------|-------------|---------------|----------------|
| **View Dashboard** | All Users | View main overview page | User logged in | Dashboard displayed |
| **View System Performance** | All Users | View CPU, Memory, Disk, Temp | User logged in | Performance metrics shown |
| **View Sensor Data** | All Users | View IMU, light, ultrasonic data | User logged in | Sensor charts displayed |
| **View Servo Status** | All Users | View servo positions, temps | User logged in | Servo status cards shown |
| **View Camera Stream** | All Users | Watch live camera feed | Robot has camera | Video stream displayed |
| **View Battery Status** | All Users | View battery level/voltage | User logged in | Battery info displayed |

---

## 5. Class Diagram

### 5.1 Complete Class Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE MODELS (PostgreSQL)                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────┐                                                             │
│  │   <<abstract>>  │                                                             │
│  │      Base       │                                                             │
│  │─────────────────│                                                             │
│  │ +metadata       │                                                             │
│  └────────┬────────┘                                                             │
│           │                                                                       │
│     ┌─────┴─────┬─────────┬─────────┬─────────┬─────────┬─────────┐             │
│     ▼           ▼         ▼         ▼         ▼         ▼         ▼             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐│
│  │ Robot  │ │  User  │ │  Job   │ │ Report │ │ Alert  │ │AlertTh │ │SystemLog ││
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘│
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SERVICES                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────┐    ┌─────────────────────────┐                      │
│  │   DatabaseConnection    │    │      InfluxClient       │                      │
│  │─────────────────────────│    │─────────────────────────│                      │
│  │ -POSTGRES_URL: String   │    │ -url: String            │                      │
│  │ -engine: Engine         │    │ -token: String          │                      │
│  │ -SessionLocal           │    │ -org: String            │                      │
│  │─────────────────────────│    │ -bucket: String         │                      │
│  │ +get_db(): Generator    │    │─────────────────────────│                      │
│  └─────────────────────────┘    │ +write_sensor_data()    │                      │
│                                  │ +write_servo_data()     │                      │
│                                  │ +query_recent_data()    │                      │
│                                  │ +get_latest_status()    │                      │
│                                  └─────────────────────────┘                      │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                              MQTT & AI SERVICES                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────┐    ┌─────────────────────────┐                      │
│  │      MQTTClient         │    │    GeminiAnalytics      │                      │
│  │─────────────────────────│    │─────────────────────────│                      │
│  │ -broker_host: String    │    │ -api_key: String        │                      │
│  │ -broker_port: int       │    │ -model: GenerativeModel │                      │
│  │ -client: mqtt.Client    │    │─────────────────────────│                      │
│  │─────────────────────────│    │ +is_available(): bool   │                      │
│  │ +on_connect()           │    │ +analyze_performance()  │                      │
│  │ +on_message()           │    │ +analyze_job_data()     │                      │
│  │ +handle_sensor_data()   │    │ +generate_summary()     │                      │
│  │ +handle_servo_data()    │    └─────────────────────────┘                      │
│  │ +publish_command()      │                                                      │
│  │ +start() / +stop()      │                                                      │
│  └─────────────────────────┘                                                      │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                              API ROUTERS (FastAPI)                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────┐                                                      │
│  │     <<interface>>       │                                                      │
│  │        Router           │                                                      │
│  │─────────────────────────│                                                      │
│  │ +router: APIRouter      │                                                      │
│  └───────────┬─────────────┘                                                      │
│              │                                                                    │
│    ┌─────────┼─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐       │
│    ▼         ▼         ▼         ▼         ▼         ▼         ▼         ▼       │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │Health│ │Robot │ │Report│ │Alerts│ │ Logs │ │Users │ │Manage│ │Robots│         │
│ │Router│ │Data  │ │Router│ │Router│ │Router│ │Router│ │Router│ │DB    │         │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                         ROBOT CLIENT (Raspberry Pi)                               │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────────────┐    ┌─────────────────────────┐              │
│  │      TonyPiRobotClient          │    │     <<external>>        │              │
│  │─────────────────────────────────│    │     HiwonderSDK         │              │
│  │ -mqtt_broker: String            │    │─────────────────────────│              │
│  │ -robot_id: String               │    │ +board: Board           │              │
│  │ -client: mqtt.Client            │    │ +controller: Controller │              │
│  │ -is_connected: bool             │    │ +sonar: Sonar           │              │
│  │ -hardware_available: bool       │    │─────────────────────────│              │
│  │ -servo_data: dict               │    │ +runActionGroup()       │              │
│  │─────────────────────────────────│    │ +stopActionGroup()      │              │
│  │ +on_connect()                   │    │ +executeMovement()      │              │
│  │ +on_message()                   │    └─────────────────────────┘              │
│  │ +handle_move_command()          │              ▲                               │
│  │ +handle_stop_command()          │              │ uses                          │
│  │ +get_system_info()              │──────────────┘                               │
│  │ +get_cpu_temperature()          │                                              │
│  │ +read_sensors()                 │    ┌─────────────────────────┐              │
│  │ +get_servo_status()             │    │      LightSensor        │              │
│  │ +send_sensor_data()             │───►│─────────────────────────│              │
│  │ +send_servo_data()              │    │ -pin: int               │              │
│  │ +send_battery_status()          │    │ -initialized: bool      │              │
│  │ +connect() / +disconnect()      │    │─────────────────────────│              │
│  │ +run()                          │    │ +is_dark(): bool        │              │
│  └─────────────────────────────────┘    │ +get_light_level(): int │              │
│                                          └─────────────────────────┘              │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Entity Class Details

#### Robot Entity

| Attribute | Type | Description |
|-----------|------|-------------|
| id | int | Primary key |
| robot_id | String | Unique robot identifier (e.g., tonypi_01) |
| name | String | Friendly name |
| description | String | Robot description |
| location | JSON | Position coordinates {x, y, z} |
| status | String | online, offline, error, maintenance |
| ip_address | String | Robot's IP address |
| camera_url | String | Camera stream URL |
| battery_threshold_low | float | Low battery warning (default: 20%) |
| battery_threshold_critical | float | Critical battery (default: 10%) |
| temp_threshold_warning | float | Temperature warning (default: 70°C) |
| temp_threshold_critical | float | Critical temperature (default: 80°C) |
| settings | JSON | Additional custom settings |
| last_seen | DateTime | Last communication timestamp |
| created_at | DateTime | Record creation time |
| updated_at | DateTime | Last update time |
| is_active | bool | Active status |

#### User Entity

| Attribute | Type | Description |
|-----------|------|-------------|
| id | String (UUID) | Primary key |
| username | String | Login username (unique) |
| email | String | Email address (unique) |
| password_hash | String | Bcrypt hashed password |
| role | String | admin, operator, viewer |
| is_active | bool | Account status |
| created_at | DateTime | Account creation time |
| updated_at | DateTime | Last update time |

#### Alert Entity

| Attribute | Type | Description |
|-----------|------|-------------|
| id | int | Primary key |
| robot_id | String | Reference to robot |
| alert_type | String | temperature, battery, servo, system |
| severity | String | critical, warning, info |
| title | String | Alert title |
| message | String | Alert message |
| source | String | e.g., servo_1, cpu, battery |
| value | float | Value that triggered the alert |
| threshold | float | Threshold that was exceeded |
| acknowledged | bool | Whether acknowledged |
| acknowledged_by | String | User who acknowledged |
| acknowledged_at | DateTime | Acknowledgment time |
| resolved | bool | Whether resolved |
| resolved_at | DateTime | Resolution time |
| details | JSON | Additional structured data |
| created_at | DateTime | Alert creation time |

---

## 6. Sequence Diagrams

### 6.1 Robot Telemetry Data Flow

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  TonyPi   │     │   MQTT    │     │  Backend  │     │ InfluxDB  │     │PostgreSQL │
│  Robot    │     │  Broker   │     │  (FastAPI)│     │           │     │           │
└─────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
      │                 │                 │                 │                 │
      │  1. Connect     │                 │                 │                 │
      │────────────────►│                 │                 │                 │
      │  Connection ACK │                 │                 │                 │
      │◄────────────────│                 │                 │                 │
      │                 │                 │                 │                 │
      │════════════════════════════════════════════════════════════════════════
      │                     LOOP: Every 2-30 seconds                          
      │════════════════════════════════════════════════════════════════════════
      │                 │                 │                 │                 │
      │  2. Read sensors│                 │                 │                 │
      │  (IMU, temp,    │                 │                 │                 │
      │   battery)      │                 │                 │                 │
      │                 │                 │                 │                 │
      │  3. PUBLISH     │                 │                 │                 │
      │  tonypi/sensors │                 │                 │                 │
      │────────────────►│                 │                 │                 │
      │                 │  4. Message     │                 │                 │
      │                 │────────────────►│                 │                 │
      │                 │                 │  5. Write data  │                 │
      │                 │                 │────────────────►│                 │
      │                 │                 │                 │                 │
      │                 │                 │  6. Check       │                 │
      │                 │                 │  thresholds     │                 │
      │                 │                 │─────────────────│                 │
      │                 │                 │                 │                 │
      │                 │                 │  [IF threshold exceeded]          │
      │                 │                 │  7. Create Alert│                 │
      │                 │                 │────────────────────────────────►  │
      │                 │                 │                 │                 │
      │════════════════════════════════════════════════════════════════════════
```

### 6.2 User Authentication Flow

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│   User    │     │  Frontend │     │  Backend  │     │PostgreSQL │
│           │     │  (React)  │     │  (FastAPI)│     │           │
└─────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
      │                 │                 │                 │
      │  1. Enter       │                 │                 │
      │  credentials    │                 │                 │
      │────────────────►│                 │                 │
      │                 │                 │                 │
      │                 │  2. POST        │                 │
      │                 │  /api/v1/auth/  │                 │
      │                 │  login          │                 │
      │                 │────────────────►│                 │
      │                 │                 │                 │
      │                 │                 │  3. Query User  │
      │                 │                 │────────────────►│
      │                 │                 │  User record    │
      │                 │                 │◄────────────────│
      │                 │                 │                 │
      │                 │                 │  4. Verify      │
      │                 │                 │  password hash  │
      │                 │                 │─────────────────│
      │                 │                 │                 │
      │                 │                 │  5. Generate    │
      │                 │                 │  JWT token      │
      │                 │                 │─────────────────│
      │                 │                 │                 │
      │                 │  6. Return      │                 │
      │                 │  {access_token, │                 │
      │                 │   user}         │                 │
      │                 │◄────────────────│                 │
      │                 │                 │                 │
      │                 │  7. Store token │                 │
      │                 │  in localStorage│                 │
      │                 │─────────────────│                 │
      │                 │                 │                 │
      │  8. Redirect    │                 │                 │
      │  to Dashboard   │                 │                 │
      │◄────────────────│                 │                 │
      │                 │                 │                 │
```

### 6.3 Robot Command Flow

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│   User    │     │  Frontend │     │  Backend  │     │   MQTT    │     │  TonyPi   │
│           │     │  (React)  │     │  (FastAPI)│     │  Broker   │     │  Robot    │
└─────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
      │                 │                 │                 │                 │
      │  1. Click       │                 │                 │                 │
      │  "Move Forward" │                 │                 │                 │
      │────────────────►│                 │                 │                 │
      │                 │                 │                 │                 │
      │                 │  2. POST        │                 │                 │
      │                 │  /command       │                 │                 │
      │                 │  {type: "move"} │                 │                 │
      │                 │────────────────►│                 │                 │
      │                 │                 │                 │                 │
      │                 │                 │  3. PUBLISH     │                 │
      │                 │                 │  tonypi/commands│                 │
      │                 │                 │────────────────►│                 │
      │                 │                 │                 │                 │
      │                 │                 │                 │  4. Deliver     │
      │                 │                 │                 │  command        │
      │                 │                 │                 │────────────────►│
      │                 │                 │                 │                 │
      │                 │                 │                 │                 │  5. Execute
      │                 │                 │                 │                 │  movement
      │                 │                 │                 │                 │─────────
      │                 │                 │                 │                 │
      │                 │                 │                 │  6. PUBLISH     │
      │                 │                 │                 │  response       │
      │                 │                 │                 │◄────────────────│
      │                 │                 │                 │                 │
      │                 │  7. {success}   │                 │                 │
      │                 │◄────────────────│                 │                 │
      │                 │                 │                 │                 │
      │  8. Update UI   │                 │                 │                 │
      │◄────────────────│                 │                 │                 │
      │                 │                 │                 │                 │
```

### 6.4 Report Generation Flow

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│   User    │     │  Frontend │     │  Backend  │     │ InfluxDB  │     │ Gemini AI │
│           │     │  (React)  │     │  (FastAPI)│     │           │     │           │
└─────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
      │                 │                 │                 │                 │
      │  1. Select      │                 │                 │                 │
      │  report type    │                 │                 │                 │
      │────────────────►│                 │                 │                 │
      │                 │                 │                 │                 │
      │                 │  2. POST        │                 │                 │
      │                 │  /reports/      │                 │                 │
      │                 │  generate       │                 │                 │
      │                 │────────────────►│                 │                 │
      │                 │                 │                 │                 │
      │                 │                 │  3. Query       │                 │
      │                 │                 │  sensor_data    │                 │
      │                 │                 │────────────────►│                 │
      │                 │                 │  data records   │                 │
      │                 │                 │◄────────────────│                 │
      │                 │                 │                 │                 │
      │                 │                 │  4. Query       │                 │
      │                 │                 │  servo_data     │                 │
      │                 │                 │────────────────►│                 │
      │                 │                 │  data records   │                 │
      │                 │                 │◄────────────────│                 │
      │                 │                 │                 │                 │
      │                 │                 │  5. Calculate   │                 │
      │                 │                 │  statistics     │                 │
      │                 │                 │─────────────────│                 │
      │                 │                 │                 │                 │
      │                 │                 │  [IF AI enabled]│                 │
      │                 │                 │  6. Send for    │                 │
      │                 │                 │  analysis       │                 │
      │                 │                 │────────────────────────────────►  │
      │                 │                 │  AI insights    │                 │
      │                 │                 │◄────────────────────────────────  │
      │                 │                 │                 │                 │
      │                 │  7. Return      │                 │                 │
      │                 │  report         │                 │                 │
      │                 │◄────────────────│                 │                 │
      │                 │                 │                 │                 │
      │  8. Display     │                 │                 │                 │
      │  report         │                 │                 │                 │
      │◄────────────────│                 │                 │                 │
```

### 6.5 System Startup Sequence

```
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│  Docker   │  │Mosquitto  │  │ InfluxDB  │  │PostgreSQL │  │  Backend  │  │ Frontend  │
│ Compose   │  │           │  │           │  │           │  │           │  │           │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │              │              │              │
      │  1. Start    │              │              │              │              │
      │  Mosquitto   │              │              │              │              │
      │─────────────►│              │              │              │              │
      │              │  Init        │              │              │              │
      │              │─────────────│              │              │              │
      │              │  Healthy    │              │              │              │
      │◄─────────────│              │              │              │              │
      │              │              │              │              │              │
      │  2. Start databases (parallel)            │              │              │
      │─────────────────────────────►│            │              │              │
      │─────────────────────────────────────────►│              │              │
      │              │              │  Init       │  Init        │              │
      │              │              │─────────────│─────────────│              │
      │              │              │  Healthy    │  Healthy     │              │
      │◄─────────────────────────────│◄───────────│              │              │
      │              │              │              │              │              │
      │  3. Start Backend           │              │              │              │
      │──────────────────────────────────────────────────────────►│             │
      │              │              │              │              │              │
      │              │              │              │  Wait for DB │              │
      │              │              │              │◄─────────────│              │
      │              │              │              │  DB Ready    │              │
      │              │              │              │─────────────►│              │
      │              │              │              │              │              │
      │              │  Connect     │              │              │              │
      │              │◄─────────────────────────────────────────  │              │
      │              │  Subscribed  │              │              │              │
      │              │─────────────────────────────────────────►│              │
      │              │              │              │              │              │
      │              │              │              │              │  Healthy     │
      │◄───────────────────────────────────────────────────────  │              │
      │              │              │              │              │              │
      │  4. Start Frontend          │              │              │              │
      │────────────────────────────────────────────────────────────────────────►│
      │              │              │              │              │              │
      │              │              │              │              │  Test API    │
      │              │              │              │              │◄─────────────│
      │              │              │              │              │  Health OK   │
      │              │              │              │              │─────────────►│
      │              │              │              │              │              │
      │              │              │              │              │              │  Ready
      │◄────────────────────────────────────────────────────────────────────────│
      │              │              │              │              │              │
```

---

## 7. State Diagrams

### 7.1 Robot State Machine

```
                    ┌─────────────┐
                    │   Offline   │
                    └──────┬──────┘
                           │ Power On
                           ▼
                    ┌─────────────┐
            ┌───────│ Connecting  │───────┐
            │       └──────┬──────┘       │
   Timeout  │              │ Success      │ Retry
            ▼              ▼              │
     ┌──────────┐   ┌─────────────┐       │
     │ Offline  │   │   Online    │◄──────┘
     └──────────┘   └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌─────────────┐
       │   Idle   │ │ Working  │ │ Maintenance │
       └────┬─────┘ └────┬─────┘ └──────┬──────┘
            │            │              │
            │    ┌───────┴───────┐      │
            │    ▼               ▼      │
            │ ┌──────┐    ┌─────────┐   │
            └►│ Idle │◄───│  Error  │◄──┘
              └──────┘    └─────────┘
```

**State Transitions:**

| From State | To State | Trigger/Event | Guard Condition |
|------------|----------|---------------|-----------------|
| Offline | Connecting | Power on / Boot complete | Network available |
| Connecting | Online | MQTT connection success | Credentials valid |
| Connecting | Offline | Connection timeout | After max retries |
| Online | Idle | Connection established | No pending jobs |
| Online | Working | Job assigned | Job available |
| Idle | Working | Start job command | Valid job parameters |
| Working | Idle | Job completed | All items processed |
| Working | Error | Job failure | Exception occurred |
| Idle | Offline | Disconnect command | Graceful shutdown |
| Idle | Maintenance | Maintenance request | Authorized user |
| Maintenance | Idle | Maintenance complete | Diagnostics passed |
| Error | Idle | Error cleared | Issue resolved |
| Error | Offline | Critical failure | System unrecoverable |
| Any | Offline | Connection lost | Network failure |

### 7.2 Job State Machine

```
    ┌─────────────┐
    │   Pending   │
    └──────┬──────┘
           │ Start Job
           ▼
    ┌─────────────┐
┌───│   Active    │───┐
│   └──────┬──────┘   │
│          │          │
│   ┌──────┴──────┐   │
│   │             │   │
▼   ▼             ▼   ▼
┌──────┐    ┌──────────┐
│Paused│    │Completed │
└──┬───┘    └──────────┘
   │
   │ Cancel
   ▼
┌──────────┐    ┌────────┐
│Cancelled │    │ Failed │
└──────────┘    └────────┘
```

**Job States:**

| State | Description |
|-------|-------------|
| **Pending** | Job created but not yet started |
| **Active** | Job is currently being executed |
| **Paused** | Job execution temporarily halted |
| **Completed** | Job finished successfully |
| **Failed** | Job terminated due to error |
| **Cancelled** | Job was manually cancelled |

### 7.3 Alert State Machine

```
┌──────────┐
│ Created  │
└────┬─────┘
     │ Auto-transition
     ▼
┌──────────┐      ┌──────────────┐
│  Active  │─────►│ Acknowledged │
└────┬─────┘      └──────┬───────┘
     │                   │
     │ Auto-resolve      │ Issue fixed
     ▼                   ▼
┌──────────┐◄─────────────┘
│ Resolved │
└──────────┘
```

**Alert Severity Levels:**

| Severity | Description | Response Time |
|----------|-------------|---------------|
| **Critical** | Immediate attention required | < 5 minutes |
| **Warning** | Attention needed soon | < 30 minutes |
| **Info** | Informational notification | Review when convenient |

### 7.4 User Session State Machine

```
┌────────────┐
│ Logged Out │◄──────────────────────────┐
└─────┬──────┘                           │
      │ Login attempt                    │ Logout
      ▼                                  │
┌──────────────┐                         │
│Authenticating│                         │
└──────┬───────┘                         │
       │                                 │
  ┌────┴────┐                            │
  │         │                            │
  ▼         ▼                            │
┌────┐  ┌───────────────┐                │
│Lock│  │ Authenticated │────────────────┘
└────┘  └───────┬───────┘
                │ Token expired
                ▼
        ┌───────────────┐
        │Session Expired│
        └───────────────┘
```

### 7.5 System Health State Machine

```
┌──────────┐
│ Offline  │
└────┬─────┘
     │ Partial startup
     ▼
┌──────────┐       ┌──────────┐
│ Critical │◄─────►│ Degraded │
└──────────┘       └────┬─────┘
                        │
                        ▼
                  ┌──────────┐
                  │ Healthy  │
                  └──────────┘
```

**Health Check Components:**
- Database connectivity (PostgreSQL)
- Time-series database (InfluxDB)
- Message broker (MQTT/Mosquitto)
- Visualization service (Grafana)
- Backend API services

---

## 8. Database Design

### 8.1 Database Architecture Overview

The system uses a **dual-database architecture**:
- **PostgreSQL**: Relational database for structured data (users, robots, jobs, alerts, reports, logs)
- **InfluxDB**: Time-series database for high-frequency sensor and performance data

### 8.2 Entity Relationship Diagram (ERD)

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
└───────────────────┘       │    settings (JSON)│       │    status         │
                            │    last_seen      │       │    created_at     │
                            │    created_at     │       │    updated_at     │
                            │    updated_at     │       └───────────────────┘
                            │    is_active      │
                            └─────────┬─────────┘
                                      │
                    ┌─────────────────┼────────────────────────┐
                    │                 │                        │
                    ▼                 ▼                        ▼
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

### 8.3 PostgreSQL Schema

#### Users Table

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

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### Robots Table

```sql
CREATE TABLE robots (
    id SERIAL PRIMARY KEY,
    robot_id VARCHAR(50) UNIQUE NOT NULL,    -- Unique robot identifier
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

CREATE INDEX idx_robots_robot_id ON robots(robot_id);
CREATE INDEX idx_robots_status ON robots(status);
```

#### Alerts Table

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

CREATE INDEX idx_alerts_robot_id ON alerts(robot_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
```

### 8.4 InfluxDB Schema

#### Organization & Bucket

```
Organization: tonypi
Bucket: robot_metrics (default retention: 7 days)
```

#### Measurements

| Measurement | Tags | Fields |
|-------------|------|--------|
| **sensors** | robot_id, sensor_type, unit | value: float |
| **performance** | robot_id, metric_type | cpu_percent, memory_percent, disk_percent |
| **servos** | robot_id, servo_id | position, temperature, voltage, load |
| **battery** | robot_id | voltage, percentage, current, charging |
| **imu** | robot_id | accel_x/y/z, gyro_x/y/z, mag_x/y/z |
| **vision_data** | robot_id, state, detection, label | has_detection, confidence, bbox_* |
| **robot_logs** | robot_id, level, source | message, level_num |

#### Example InfluxDB Queries (Flux)

```flux
// Get latest CPU usage
from(bucket: "robot_metrics")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "performance")
  |> filter(fn: (r) => r._field == "cpu_percent")
  |> filter(fn: (r) => r.robot_id == "tonypi_01")
  |> last()

// Average sensor readings over time
from(bucket: "robot_metrics")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "sensors")
  |> filter(fn: (r) => r.sensor_type == "temperature")
  |> aggregateWindow(every: 1h, fn: mean)
```

### 8.5 Default Thresholds

| Metric Type | Warning | Critical |
|-------------|---------|----------|
| `cpu` | 70% | 90% |
| `memory` | 75% | 90% |
| `temperature` | 70°C | 80°C |
| `battery` | 20% | 10% |
| `servo_temp` | 60°C | 75°C |

---

## 9. User Interface Design

### 9.1 Design Principles

1. **Clarity**: Clear visual hierarchy and intuitive navigation
2. **Responsiveness**: Mobile-first design, adapts to all screen sizes
3. **Accessibility**: Color contrast compliance, keyboard navigation
4. **Real-time**: Live updates with visual feedback
5. **Consistency**: Unified design language across all pages

### 9.2 Color Palette

#### Light Theme

| Element | Color | Hex Code |
|---------|-------|----------|
| Primary | Blue | `#3B82F6` |
| Secondary | Purple | `#8B5CF6` |
| Background | Slate/Blue gradient | `#F8FAFC → #EFF6FF` |
| Surface | White | `#FFFFFF` |
| Text Primary | Gray 900 | `#111827` |
| Success | Green | `#10B981` |
| Warning | Yellow | `#F59E0B` |
| Error | Red | `#EF4444` |

#### Dark Theme

| Element | Color | Hex Code |
|---------|-------|----------|
| Primary | Blue | `#60A5FA` |
| Secondary | Purple | `#A78BFA` |
| Background | Gray 900 | `#111827` |
| Surface | Gray 800 | `#1F2937` |
| Text Primary | White | `#FFFFFF` |
| Success | Green | `#34D399` |
| Warning | Yellow | `#FBBF24` |
| Error | Red | `#F87171` |

### 9.3 Application Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              HEADER (sticky)                                     │
│  ┌────────────┐                                    ┌─────┬──────┬──────┬──────┐ │
│  │ 🤖 TonyPi  │                                    │ 🌙  │ Time │ WiFi │ User │ │
│  │  Monitor   │                                    │     │      │      │ Menu │ │
│  └────────────┘                                    └─────┴──────┴──────┴──────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│                          TAB NAVIGATION (sticky)                                 │
│  ┌──────────┬─────────────┬─────────┬────────┬────────┬──────┬──────┬────────┐ │
│  │ Overview │ Performance │ Sensors │ Robots │ Servos │ Jobs │ Logs │ Reports│ │
│  └──────────┴─────────────┴─────────┴────────┴────────┴──────┴──────┴────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                              MAIN CONTENT AREA                                  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │                        Page-specific content                            │   │
│  │                                                                         │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 9.4 Key Pages

#### Dashboard Page
- Stats cards (Active Robots, Active Jobs, Completed Today, Items Processed)
- System status indicators
- Robot status with selector
- Recent sensor data feed

#### Monitoring/Performance Page
- Circular gauge components for CPU, Memory, Disk
- Color-coded thresholds (green → yellow → red)
- Embedded Grafana panels for historical data

#### Sensors Page
- Sensor type filter tabs (All, Temperature, Humidity, IMU, Sonar)
- Real-time value display with units
- IMU data visualization (accelerometer, gyroscope)

#### Servos Page
- Visual servo position indicators
- Temperature and load display
- Color-coded warnings for high temperatures

#### Alerts Page
- Alert severity statistics
- Filter by severity and status
- Acknowledge/Resolve actions
- Alert threshold configuration

#### Reports Page
- Report type selection
- AI-powered analytics option (Google Gemini)
- Report history with view/delete actions

### 9.5 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, hamburger menu |
| Tablet | 640px - 1024px | 2-column grid |
| Desktop | > 1024px | Full layout, sidebar navigation |

---

## 10. MQTT Communication Protocol

### 10.1 Topic Structure

```
tonypi/
├── sensors/{robot_id}          # Sensor telemetry (Robot → Server)
├── servos/{robot_id}           # Servo status (Robot → Server)
├── status/{robot_id}           # Robot status (Robot → Server)
├── battery                     # Battery status (Robot → Server)
├── location                    # Location updates (Robot → Server)
├── vision/{robot_id}           # Vision detections (Robot → Server)
├── logs/{robot_id}             # Log messages (Robot → Server)
├── commands/{robot_id}         # Commands (Server → Robot)
├── commands/broadcast          # Broadcast commands (Server → All Robots)
├── commands/response           # Command responses (Robot → Server)
├── scan/{robot_id}             # QR scan events (Robot → Server)
├── items/{robot_id}            # Item lookup responses (Server → Robot)
└── job/{robot_id}              # Job progress (Robot → Server)
```

### 10.2 Message Payloads

#### Sensor Data
```json
{
  "robot_id": "tonypi_01",
  "sensor_type": "temperature",
  "value": 24.5,
  "unit": "°C",
  "timestamp": "2025-01-19T10:30:00Z"
}
```

#### Servo Status
```json
{
  "robot_id": "tonypi_01",
  "servos": {
    "servo_1": {
      "id": 1,
      "name": "Right Hip",
      "position": 45.0,
      "temperature": 42.5,
      "voltage": 7.2,
      "alert_level": "normal"
    }
  },
  "servo_count": 6,
  "timestamp": "2025-01-19T10:30:00Z"
}
```

#### Robot Command
```json
{
  "type": "move",
  "direction": "forward",
  "speed": 0.5,
  "robot_id": "tonypi_01",
  "command_id": "cmd_12345",
  "timestamp": "2025-01-19T10:30:00Z"
}
```

#### Battery Status
```json
{
  "robot_id": "tonypi_01",
  "voltage": 12.3,
  "percentage": 85,
  "charging": false,
  "timestamp": "2025-01-19T10:30:00Z"
}
```

---

## 11. API Endpoints

### 11.1 API Overview

| Category | Base Path | Description |
|----------|-----------|-------------|
| Health | `/api/v1/health` | System health checks |
| Robots | `/api/v1/robots` | Robot CRUD operations |
| Robot Data | `/api/v1/robot-data` | Telemetry and status |
| Performance | `/api/v1/pi` | Pi system metrics |
| Alerts | `/api/v1/alerts` | Alert management |
| Logs | `/api/v1/logs` | System logs |
| Reports | `/api/v1/reports` | Report generation |
| Users | `/api/v1/users` | User management |
| Auth | `/api/v1/auth` | Authentication |
| Commands | `/api/v1/management` | Robot control |

### 11.2 Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | System health status |
| `/api/v1/auth/login` | POST | User authentication |
| `/api/v1/robots` | GET/POST | List/Create robots |
| `/api/v1/robots/{id}` | GET/PUT/DELETE | Robot CRUD |
| `/api/v1/robot-data/status` | GET | Real-time robot status |
| `/api/v1/robot-data/sensors` | GET | Sensor readings |
| `/api/v1/pi/performance` | GET | Pi system metrics |
| `/api/v1/alerts` | GET/POST | Alert management |
| `/api/v1/alerts/{id}/acknowledge` | POST | Acknowledge alert |
| `/api/v1/reports` | GET/POST | Report CRUD |
| `/api/v1/reports/generate` | POST | AI report generation |
| `/api/v1/management/command` | POST | Send robot command |
| `/api/v1/management/emergency-stop` | POST | Emergency stop |

---

## 12. Security Architecture

### 12.1 Authentication & Authorization

```
┌────────────────────────────────────────────────────────────────┐
│                    Security Layers                              │
├────────────────────────────────────────────────────────────────┤
│  1. JWT Token Authentication                                    │
│     - Tokens issued on login                                    │
│     - Stored in client localStorage                             │
│     - Included in Authorization header                          │
│                                                                 │
│  2. Role-Based Access Control (RBAC)                           │
│     - Admin: Full system access                                │
│     - Operator: Robot control & monitoring                     │
│     - Viewer: Read-only access                                 │
│                                                                 │
│  3. CORS Configuration                                         │
│     - Allowed origins: localhost:3001, frontend:3000           │
│     - Credentials enabled                                       │
│                                                                 │
│  4. Password Security                                          │
│     - Bcrypt hashing                                           │
│     - Salted passwords                                         │
└────────────────────────────────────────────────────────────────┘
```

### 12.2 Default Users

| Username | Role | Default Password |
|----------|------|------------------|
| admin | Admin | admin123 |
| operator | Operator | operator123 |
| viewer | Viewer | viewer123 |

---

## 13. Deployment Architecture

### 13.1 Docker Compose Services

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| mosquitto | eclipse-mosquitto:2.0 | 1883, 9001 | MQTT broker |
| influxdb | influxdb:2.7 | 8086 | Time-series database |
| postgres | postgres:15 | 5432 | Relational database |
| grafana | grafana/grafana:10.0.0 | 3000 | Visualization |
| backend | Custom FastAPI | 8000 | REST API |
| frontend | Custom React | 3001 | Web interface |

### 13.2 Service Dependencies

```
               ┌──────────────┐
               │   frontend   │
               └──────┬───────┘
                      │ depends_on
                      ▼
               ┌──────────────┐
               │   backend    │
               └──────┬───────┘
                      │ depends_on
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  postgres    │ │  influxdb    │ │  mosquitto   │
└──────────────┘ └──────────────┘ └──────────────┘
        ▲
        │ depends_on
┌──────────────┐
│   grafana    │
└──────────────┘
```

### 13.3 Environment Configuration

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
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883
```

### 13.4 Quick Start Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Stop all services
docker-compose down

# Reset everything (including data)
docker-compose down -v
```

---

## Appendix A: PlantUML Diagrams

All PlantUML source files are available in the repository:

- `CLASS_DIAGRAM_PLANTUML.puml` - Complete class diagram
- `SEQUENCE_DIAGRAM_PLANTUML.puml` - Sequence diagrams
- `STATE_DIAGRAM_PLANTUML.puml` - State machine diagrams
- `USE_CASE_DIAGRAM_PLANTUML.puml` - Use case diagrams
- `DATABASE_DESIGN_PLANTUML.puml` - Database ERD

To render PlantUML diagrams:
1. Use online editor: http://www.plantuml.com/plantuml/uml/
2. VS Code extension: "PlantUML"
3. Command line: `java -jar plantuml.jar diagram.puml`

---

## Appendix B: References

- FastAPI Documentation: https://fastapi.tiangolo.com/
- React Documentation: https://react.dev/
- InfluxDB Documentation: https://docs.influxdata.com/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- MQTT Protocol: https://mqtt.org/
- Eclipse Mosquitto: https://mosquitto.org/
- Grafana Documentation: https://grafana.com/docs/
- Docker Documentation: https://docs.docker.com/
- TailwindCSS: https://tailwindcss.com/
- Google Gemini AI: https://ai.google.dev/

---

## 14. Testing

This section documents the testing strategy, methodologies, and procedures used to ensure the quality of the TonyPi Robot Monitoring System.

### Testing Pyramid

```
        /\
       /  \        UAT & SUS (few) - User Acceptance & Usability
      /----\
     /      \      Integration Tests (some) - API & Service integration
    /--------\
   /          \    Unit Tests (many) - Individual functions & components
  --------------
```

### 14.1 Unit Testing

Unit testing focuses on testing individual code units (functions, methods, components) in isolation.

#### 14.1.1 Testing Architecture

| Component | Framework | Config File | Test Location |
|-----------|-----------|-------------|---------------|
| Backend (Python) | pytest | `backend/pytest.ini` | `backend/tests/` |
| Frontend (React) | Jest + React Testing Library | `frontend/package.json` | `frontend/src/__tests__/` |

#### 14.1.2 Backend Test Structure

```
backend/
├── pytest.ini              # Pytest configuration
├── tests/
│   ├── __init__.py
│   ├── conftest.py         # Shared fixtures
│   ├── test_health.py      # Health endpoint tests
│   ├── test_reports.py     # Reports API tests
│   └── test_robot_data.py  # Robot data tests
```

#### 14.1.3 Frontend Test Structure

```
frontend/src/
├── setupTests.ts           # Jest global setup
├── App.test.tsx            # Main app tests
├── __tests__/
│   ├── components/         # Component tests
│   │   └── Toast.test.tsx
│   ├── pages/              # Page tests
│   │   └── Reports.test.tsx
│   └── utils/              # Utility tests
│       ├── api.test.ts
│       └── config.test.ts
```

#### 14.1.4 Test Markers (Backend)

Tests are categorized using pytest markers:

```python
@pytest.mark.unit        # Fast, no external dependencies
@pytest.mark.integration # May require database/services
@pytest.mark.slow        # Long-running tests
@pytest.mark.api         # API endpoint tests
```

#### 14.1.5 Available Test Fixtures

| Fixture | Description |
|---------|-------------|
| `test_db` | Fresh SQLite in-memory database per test |
| `client` | FastAPI TestClient with database override |
| `client_no_db` | TestClient without database |
| `mock_mqtt_client` | Mocked MQTT client |
| `mock_influx_client` | Mocked InfluxDB client |
| `sample_robot_data` | Sample robot data dict |
| `sample_sensor_data` | Sample sensor data list |
| `sample_report_data` | Sample report data dict |

#### 14.1.6 Example Backend Unit Test

```python
"""
Tests for health check endpoints.
Run with: pytest tests/test_health.py -v
"""
import pytest
from fastapi.testclient import TestClient

class TestHealthEndpoints:
    """Tests for the health check API endpoints."""

    @pytest.mark.unit
    def test_health_check_returns_200(self, client: TestClient):
        """Test that health endpoint returns 200 OK."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    @pytest.mark.unit
    def test_health_check_response_format(self, client: TestClient):
        """Test that health endpoint returns expected format."""
        response = client.get("/api/v1/health")
        data = response.json()
        
        assert "status" in data
        assert data["status"] in ["healthy", "ok", "online"]
```

#### 14.1.7 Example Frontend Unit Test

```tsx
/**
 * Tests for Reports page.
 * Run with: npm test -- Reports.test.tsx
 */
import { render, screen, waitFor } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import Reports from '../../pages/Reports';
import { apiService } from '../../utils/api';

jest.mock('../../utils/api', () => ({
  apiService: {
    getReports: jest.fn(),
    getRobotStatus: jest.fn(),
  },
}));

describe('Reports Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the reports page', async () => {
    render(<Reports />);
    
    await waitFor(() => {
      expect(screen.getByText(/Reports/i)).toBeInTheDocument();
    });
  });

  it('displays reports list after loading', async () => {
    (apiService.getReports as jest.Mock).mockResolvedValue([
      { id: 1, title: 'Performance Report', robot_id: 'test_robot_001' }
    ]);
    
    render(<Reports />);
    
    await waitFor(() => {
      expect(screen.getByText('Performance Report')).toBeInTheDocument();
    });
  });
});
```

#### 14.1.8 Running Tests

**Backend Tests:**

```bash
cd backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_health.py

# Run tests by marker
pytest -m unit          # Only unit tests
pytest -m "not slow"    # Skip slow tests

# Run with coverage report
pytest --cov=. --cov-report=html
```

**Frontend Tests:**

```bash
cd frontend

# Run tests in watch mode
npm test

# Run all tests once (CI mode)
npm run test:ci

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- Reports.test.tsx
```

#### 14.1.9 Test Coverage Report Example

```
---------- coverage: platform win32, python 3.11.0 ----------
Name                          Stmts   Miss  Cover
-------------------------------------------------
main.py                          45      5    89%
routers/health.py                12      0   100%
routers/reports.py               78     12    85%
routers/robot_data.py            95     20    79%
-------------------------------------------------
TOTAL                           230     37    84%
```

---

### 14.2 User Acceptance Testing (UAT)

User Acceptance Testing is the final phase where actual end users verify that the system meets their business requirements.

#### 14.2.1 UAT Overview

| Aspect | Description |
|--------|-------------|
| **Purpose** | Validate the system meets business requirements |
| **Performed By** | End users, stakeholders, or domain experts |
| **Environment** | Production-like or staging environment |
| **Focus** | Business processes and user workflows |
| **Outcome** | Go/No-Go decision for production deployment |

#### 14.2.2 UAT vs Unit Testing Comparison

| Aspect | Unit Testing | User Acceptance Testing (UAT) |
|--------|--------------|------------------------------|
| **Who performs** | Developers | End users / Stakeholders |
| **What is tested** | Individual code units | Complete business workflows |
| **Purpose** | Code works correctly | System meets user needs |
| **When** | During development | Before production release |
| **Test cases** | Technical, automated | Business scenarios, manual |
| **Environment** | Development/CI | Staging/Pre-production |

#### 14.2.3 Test Environment Setup

| Component | Requirement | Verification |
|-----------|-------------|---------------|
| Docker | Running with all containers up | `docker-compose ps` |
| Backend API | Accessible at `http://localhost:8000` | Visit `/docs` endpoint |
| Frontend | Accessible at `http://localhost:3001` | Open in browser |
| PostgreSQL | Database with seed data | Check logs |
| InfluxDB | Time-series database running | Check Grafana datasource |
| MQTT Broker | Mosquitto running | Check port 1883 |

#### 14.2.4 Test User Accounts

| Username | Password | Role | Use For Testing |
|----------|----------|------|-----------------|
| `admin` | `admin123` | Admin | Admin-only features |
| `operator` | `operator123` | Operator | Operator features |
| `viewer` | `viewer123` | Viewer | View-only features |

#### 14.2.5 UAT Test Scenarios Summary

| Epic | Test ID | Description | Tester Role |
|------|---------|-------------|-------------|
| Authentication | UAT-1.1 | User Login | All Users |
| Authentication | UAT-1.2 | User Logout | All Users |
| User Management | UAT-1.3 | Create/Edit/Delete Users | Admin |
| Dashboard | UAT-2.1 | View Dashboard | All Users |
| Performance | UAT-2.2 | View Performance Metrics | Operator, Admin |
| Sensors | UAT-2.3 | View Sensor Data | All Users |
| Servos | UAT-2.4 | View Servo Status | Operator, Admin |
| Camera | UAT-2.5 | View Camera Stream | All Users |
| Robot Control | UAT-3.1 | Send Robot Command | Operator, Admin |
| Robot Control | UAT-3.2 | Emergency Stop | Operator, Admin |
| Alerts | UAT-4.1 | View and Manage Alerts | Operator, Admin |
| Alerts | UAT-4.2 | Configure Alert Thresholds | Admin |
| Reports | UAT-5.1 | Generate Report | Operator, Admin |
| Reports | UAT-5.2 | View and Download Report | All Users |
| Jobs | UAT-6.1 | View Job Progress | All Users |
| Logs | UAT-7.1 | View and Filter Logs | Operator, Admin |
| Robots | UAT-8.1 | View and Manage Robots | Admin, All |

#### 14.2.6 Sample UAT Test Case - User Login (UAT-1.1)

| Field | Value |
|-------|-------|
| **Test ID** | UAT-1.1 |
| **User Story** | US-1.3: As a User, I want to log in securely |
| **Tester Role** | All Users (Admin, Operator, Viewer) |
| **Preconditions** | Application running, user account exists |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to `http://localhost:3001` | Login page displayed | |
| 2 | Enter valid username: `admin` | Username accepted | |
| 3 | Enter valid password: `admin123` | Password field masked | |
| 4 | Click "Sign In" button | Loading indicator shown | |
| 5 | Wait for redirect | Dashboard page displayed | |
| 6 | Refresh the page (F5) | Session persists | |

**Negative Test:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Enter invalid password: `wrongpassword` | Error message displayed | |
| 2 | Leave username empty, click Sign In | Validation error shown | |

#### 14.2.7 UAT Execution Checklist

**Pre-UAT Checklist:**
- [ ] Test environment is set up and accessible
- [ ] All test user accounts are created
- [ ] Test data (robots, historical data) is available
- [ ] UAT testers are identified and briefed
- [ ] Test scenarios are reviewed and understood

**Post-UAT Checklist:**
- [ ] All test scenarios executed
- [ ] All critical defects resolved and retested
- [ ] Known issues documented
- [ ] UAT results compiled
- [ ] Sign-off obtained from stakeholders

#### 14.2.8 Defect Severity Definitions

| Severity | Definition | Example |
|----------|------------|---------|
| **Critical** | System unusable, no workaround | Cannot login, application crashes |
| **High** | Major feature broken, blocks user | Cannot generate reports |
| **Medium** | Feature partially broken, workaround exists | Filter doesn't work |
| **Low** | Minor issue, cosmetic | Typo, alignment issue |

#### 14.2.9 UAT Sign-Off Document Template

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              UAT SIGN-OFF DOCUMENT - TonyPi Monitoring System                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  PROJECT:        TonyPi Robot Monitoring System                              ║
║  VERSION:        1.0                                                          ║
║  UAT PERIOD:     [Start Date] to [End Date]                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                            TEST SUMMARY                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total Test Scenarios:        17                                              ║
║  ✅ Passed:                   ___                                            ║
║  ❌ Failed:                   ___                                            ║
║  Pass Rate:                   ___%                                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         DEPLOYMENT APPROVAL                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ☐ APPROVED FOR PRODUCTION DEPLOYMENT                                        ║
║  ☐ NOT APPROVED - Requires resolution                                        ║
║                                                                               ║
║  Approved By:    ____________________    Date: ____________                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

### 14.3 System Usability Scale (SUS)

The System Usability Scale (SUS) is a reliable, industry-standard tool for measuring the usability of a system.

#### 14.3.1 About SUS

| Aspect | Detail |
|--------|--------|
| **Questions** | 10 standardized questions |
| **Scale** | 1 (Strongly Disagree) to 5 (Strongly Agree) |
| **Time** | 2-3 minutes to complete |
| **Score Range** | 0-100 |
| **Average Score** | 68 (industry benchmark) |
| **Minimum Respondents** | 5+ recommended for reliability |

#### 14.3.2 When to Conduct SUS

```
Development ──► Unit Tests ──► UAT ──► SUS Survey ──► Go-Live
                                          ▲
                                    [CONDUCT SUS]

Conduct SUS after users have:
• Completed UAT test scenarios
• Used the system for at least 15-30 minutes
• Experienced the core features
```

#### 14.3.3 Recommended Participants

| Persona | Role | Min. Respondents |
|---------|------|------------------|
| Admin | System Administrator | 1-2 |
| Operator | Robot Operator | 2-3 |
| Viewer | Research Viewer | 1-2 |
| Technician | Maintenance Technician | 1-2 |
| **Total** | | **5-9** |

#### 14.3.4 The 10 SUS Questions

| # | Statement | Scale |
|---|-----------|-------|
| **Q1** | I think that I would like to use the TonyPi Monitoring System frequently. | 1-5 |
| **Q2** | I found the TonyPi Monitoring System unnecessarily complex. | 1-5 |
| **Q3** | I thought the TonyPi Monitoring System was easy to use. | 1-5 |
| **Q4** | I think that I would need the support of a technical person to be able to use this system. | 1-5 |
| **Q5** | I found the various functions in the TonyPi Monitoring System were well integrated. | 1-5 |
| **Q6** | I thought there was too much inconsistency in the TonyPi Monitoring System. | 1-5 |
| **Q7** | I would imagine that most people would learn to use the TonyPi Monitoring System very quickly. | 1-5 |
| **Q8** | I found the TonyPi Monitoring System very cumbersome to use. | 1-5 |
| **Q9** | I felt very confident using the TonyPi Monitoring System. | 1-5 |
| **Q10** | I needed to learn a lot of things before I could get going with the TonyPi Monitoring System. | 1-5 |

#### 14.3.5 SUS Scoring Guide

**Step 1: Score Odd Questions (Q1, Q3, Q5, Q7, Q9)**
```
Contribution = (Response Value) - 1
```

**Step 2: Score Even Questions (Q2, Q4, Q6, Q8, Q10)**
```
Contribution = 5 - (Response Value)
```

**Step 3: Calculate Final Score**
```
Total Contribution = Sum of all 10 contributions (range: 0-40)
SUS Score = Total Contribution × 2.5 (range: 0-100)
```

#### 14.3.6 Example SUS Calculation

| Question | Response | Type | Calculation | Contribution |
|----------|----------|------|-------------|--------------|
| Q1 | 4 | Odd | 4 - 1 | 3 |
| Q2 | 2 | Even | 5 - 2 | 3 |
| Q3 | 5 | Odd | 5 - 1 | 4 |
| Q4 | 1 | Even | 5 - 1 | 4 |
| Q5 | 4 | Odd | 4 - 1 | 3 |
| Q6 | 2 | Even | 5 - 2 | 3 |
| Q7 | 4 | Odd | 4 - 1 | 3 |
| Q8 | 1 | Even | 5 - 1 | 4 |
| Q9 | 5 | Odd | 5 - 1 | 4 |
| Q10 | 2 | Even | 5 - 2 | 3 |
| **Total** | | | | **34** |

**SUS Score = 34 × 2.5 = 85**

#### 14.3.7 SUS Score Interpretation

```
Score      Grade    Adjective        Acceptability
──────────────────────────────────────────────────
84.1-100    A+      Best Imaginable   Excellent
80.8-84.0   A       Excellent         Excellent
78.9-80.7   A-                        
77.2-78.8   B+                        
74.1-77.1   B       Good              Acceptable
72.6-74.0   B-                        
71.1-72.5   C+                        
65.0-71.0   C       OK                
62.7-64.9   C-                        
51.7-62.6   D       Poor              Marginal
0.0-51.6    F       Worst Imaginable  Unacceptable

INDUSTRY AVERAGE: 68
TARGET FOR TONYPI SYSTEM: 70+ (Acceptable) or 80+ (Excellent)
```

#### 14.3.8 Score Interpretation Guidelines

| Score | What It Means | Action Required |
|-------|---------------|-----------------|
| **85+** | Excellent usability | Minor polish only. Ready for production. |
| **70-84** | Good usability | Address minor issues. Good for production. |
| **68** | Average | Identify pain points and improve. |
| **50-67** | Below average | Significant UX improvements needed. |
| **<50** | Poor usability | Major redesign required before release. |

#### 14.3.9 SUS Results Report Template

```
╔══════════════════════════════════════════════════════════════════════════════╗
║            SUS EVALUATION REPORT - TonyPi Monitoring System                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  PROJECT:           TonyPi Robot Monitoring System                           ║
║  VERSION:           1.0                                                       ║
║  EVALUATION DATE:   ____________________                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                          PARTICIPANT SUMMARY                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total Participants:     ___                                                 ║
║  By Role:                                                                    ║
║    • Admin:              ___                                                 ║
║    • Operator:           ___                                                 ║
║    • Viewer:             ___                                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                           OVERALL RESULTS                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║                    AVERAGE SUS SCORE: _______                                ║
║                    Grade:             _______                                ║
║                    Percentile:        _______                                ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                            CONCLUSION                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ☐ EXCELLENT - Score 80+                                                     ║
║  ☐ ACCEPTABLE - Score 68-79                                                  ║
║  ☐ MARGINAL - Score 51-67                                                    ║
║  ☐ UNACCEPTABLE - Score <51                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

### 14.4 Testing Summary

| Testing Type | Purpose | Status | Documentation |
|--------------|---------|--------|---------------|
| **Unit Testing** | Verify individual code units | Done | `UNIT_TESTING_GUIDE.md` |
| **Integration Testing** | Test API and service integration | Done | Included in unit tests |
| **User Acceptance Testing** | Validate business requirements | To Be Done | `UAT_TESTING_GUIDE.md` |
| **Usability Testing (SUS)** | Measure system usability | To Be Done | `SUS_QUESTIONNAIRE.md` |

---

## Appendix A: PlantUML Diagrams

All PlantUML source files are available in the repository:

- `CLASS_DIAGRAM_PLANTUML.puml` - Complete class diagram
- `SEQUENCE_DIAGRAM_PLANTUML.puml` - Sequence diagrams
- `STATE_DIAGRAM_PLANTUML.puml` - State machine diagrams
- `USE_CASE_DIAGRAM_PLANTUML.puml` - Use case diagrams
- `DATABASE_DESIGN_PLANTUML.puml` - Database ERD

To render PlantUML diagrams:
1. Use online editor: http://www.plantuml.com/plantuml/uml/
2. VS Code extension: "PlantUML"
3. Command line: `java -jar plantuml.jar diagram.puml`

---

## Appendix B: References

- FastAPI Documentation: https://fastapi.tiangolo.com/
- React Documentation: https://react.dev/
- InfluxDB Documentation: https://docs.influxdata.com/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- MQTT Protocol: https://mqtt.org/
- Eclipse Mosquitto: https://mosquitto.org/
- Grafana Documentation: https://grafana.com/docs/
- Docker Documentation: https://docs.docker.com/
- TailwindCSS: https://tailwindcss.com/
- Google Gemini AI: https://ai.google.dev/
- SUS Reference: Brooke, J. (1996). "SUS: A quick and dirty usability scale"

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Author:** TonyPi Robot Monitoring System Team

---

*This document combines all system diagrams and technical documentation for the TonyPi Robot Monitoring System thesis project.*
