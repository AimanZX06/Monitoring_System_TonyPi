# System Architecture

## Overview

The TonyPi Robot Monitoring System is a comprehensive full-stack application designed for real-time monitoring, control, and management of HiWonder TonyPi robots. The system follows a microservices architecture deployed using Docker containers.

## High-Level Architecture Diagram

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

## Component Architecture

### 1. Frontend (React Application)

**Port:** 3001 (external) → 3000 (internal)

**Technology Stack:**
- React 18 with TypeScript
- TailwindCSS for styling
- Lucide React for icons
- Context API for state management

**Key Components:**
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── GrafanaPanel.tsx # Embedded Grafana visualizations
│   │   ├── Layout.tsx       # App layout wrapper
│   │   └── Toast.tsx        # Notification toasts
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx  # Authentication state
│   │   ├── NotificationContext.tsx
│   │   └── ThemeContext.tsx # Dark/Light theme
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Overview dashboard
│   │   ├── Monitoring.tsx   # Performance monitoring
│   │   ├── Robots.tsx       # Robot management
│   │   ├── Sensors.tsx      # Sensor data display
│   │   ├── Servos.tsx       # Servo monitoring
│   │   ├── Jobs.tsx         # Job tracking
│   │   ├── Alerts.tsx       # Alert management
│   │   ├── Logs.tsx         # System logs
│   │   ├── Reports.tsx      # Report generation
│   │   ├── Users.tsx        # User management (admin)
│   │   └── Login.tsx        # Authentication
│   ├── utils/               # Utility functions
│   │   ├── api.ts           # API service layer
│   │   ├── config.ts        # Configuration
│   │   ├── grafana.ts       # Grafana integration
│   │   └── useMqtt.ts       # MQTT WebSocket hook
│   └── types/               # TypeScript definitions
│       └── index.ts
```

### 2. Backend (FastAPI Application)

**Port:** 8000

**Technology Stack:**
- FastAPI (Python 3.11+)
- SQLAlchemy ORM
- Paho MQTT for messaging
- InfluxDB Client
- Google Gemini AI (for analytics)

**API Structure:**
```
backend/
├── main.py                  # Application entry point
├── database/
│   ├── database.py          # PostgreSQL connection
│   └── influx_client.py     # InfluxDB client
├── models/                  # SQLAlchemy models
│   ├── user.py
│   ├── robot.py
│   ├── job.py
│   ├── alert.py
│   ├── report.py
│   └── system_log.py
├── routers/                 # API route handlers
│   ├── health.py            # Health checks
│   ├── robot_data.py        # Robot telemetry
│   ├── robots_db.py         # Robot CRUD
│   ├── pi_perf.py           # Pi performance metrics
│   ├── alerts.py            # Alert management
│   ├── logs.py              # System logging
│   ├── reports.py           # Report generation
│   ├── users.py             # User management
│   ├── management.py        # Robot control commands
│   ├── grafana_proxy.py     # Grafana API proxy
│   └── data_validation.py   # Input validation
├── mqtt/
│   └── mqtt_client.py       # MQTT client handler
├── services/
│   └── gemini_analytics.py  # AI-powered analytics
└── utils/
    └── auth.py              # JWT authentication
```

**API Endpoints (v1):**

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| Health | `/api/v1/health` | GET | System health status |
| Robots | `/api/v1/robots` | GET/POST | List/Create robots |
| Robots | `/api/v1/robots/{id}` | GET/PUT/DELETE | Robot CRUD |
| Robot Data | `/api/v1/robot/status` | GET | Real-time robot status |
| Robot Data | `/api/v1/robot/sensors` | GET | Sensor readings |
| Performance | `/api/v1/pi/performance` | GET | Pi system metrics |
| Jobs | `/api/v1/jobs` | GET/POST | Job management |
| Alerts | `/api/v1/alerts` | GET/POST | Alert management |
| Logs | `/api/v1/logs` | GET/POST | System logs |
| Reports | `/api/v1/reports` | GET/POST | Report CRUD |
| Reports | `/api/v1/reports/generate` | POST | AI report generation |
| Users | `/api/v1/users` | GET/POST | User management |
| Auth | `/api/v1/auth/login` | POST | User authentication |
| Commands | `/api/v1/command` | POST | Send robot commands |

### 3. MQTT Broker (Eclipse Mosquitto)

**Ports:** 
- 1883 (MQTT standard)
- 9001 (WebSocket)

**Topic Structure:**
```
tonypi/
├── {robot_id}/
│   ├── status          # Robot online/offline status
│   ├── telemetry       # Real-time sensor data
│   ├── performance     # System metrics (CPU, memory)
│   ├── servos          # Servo positions and temperatures
│   ├── sensors         # Environmental sensors
│   ├── battery         # Battery status
│   ├── job             # Job progress updates
│   └── command/        # Command topics
│       ├── request     # Incoming commands
│       └── response    # Command responses
├── system/
│   ├── alerts          # System-wide alerts
│   └── broadcast       # Broadcast messages
```

### 4. PostgreSQL Database

**Port:** 5432

**Purpose:** Persistent storage for relational data

**Tables:**
- `users` - User accounts and authentication
- `robots` - Robot configurations and metadata
- `jobs` - Job tracking records
- `alerts` - Alert history and thresholds
- `reports` - Generated reports
- `system_logs` - Application logs

### 5. InfluxDB Time-Series Database

**Port:** 8086

**Purpose:** High-performance time-series data storage

**Measurements:**
- `sensors` - Sensor readings (temperature, IMU, etc.)
- `performance` - CPU, memory, disk metrics
- `servos` - Servo positions and temperatures
- `battery` - Battery voltage and percentage
- `network` - Network latency and throughput

### 6. Grafana Dashboard

**Port:** 3000

**Purpose:** Advanced data visualization

**Features:**
- Pre-configured dashboards for robot monitoring
- Real-time metric visualization
- Custom alerting rules
- Embedded panels in React frontend

## Data Flow Diagrams

### Real-Time Telemetry Flow

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

### Command & Control Flow

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

### Authentication Flow

```
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│   Frontend   │─────────────►│   Backend    │─────────────►│   PostgreSQL │
│   (Login)    │  POST /login │   (Auth)     │  Verify user │              │
└──────┬───────┘              └──────┬───────┘              └──────────────┘
       │                             │
       │                             │ Generate JWT
       │◄────────────────────────────┘
       │   JWT Token
       │
       ▼
┌──────────────┐
│   Store in   │
│   LocalStorage│
└──────────────┘
```

## Network Architecture

### Docker Network

All services run on a shared Docker bridge network (`tonypi_network`):

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

## Security Architecture

### Authentication & Authorization

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

## Deployment Architecture

### Container Orchestration

```yaml
Services:
  mosquitto:    Eclipse Mosquitto 2.0
  influxdb:     InfluxDB 2.7
  postgres:     PostgreSQL 15
  grafana:      Grafana 10.0.0
  backend:      Custom Python FastAPI
  frontend:     Custom React Application

Health Checks:
  - All services have configured health checks
  - Automatic restart on failure (unless-stopped)
  - Dependency ordering via depends_on conditions
```

### Service Dependencies

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

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | React | 18.x | User interface |
| Frontend | TypeScript | 5.x | Type safety |
| Frontend | TailwindCSS | 3.x | Styling |
| Backend | FastAPI | 0.100+ | REST API |
| Backend | Python | 3.11+ | Runtime |
| Backend | SQLAlchemy | 2.x | ORM |
| Database | PostgreSQL | 15 | Relational data |
| Database | InfluxDB | 2.7 | Time-series data |
| Messaging | Mosquitto | 2.0 | MQTT broker |
| Visualization | Grafana | 10.0 | Dashboards |
| Containerization | Docker | Latest | Deployment |
| AI | Google Gemini | Latest | Analytics |

## Scalability Considerations

### Horizontal Scaling Options

1. **Frontend**: Static build can be served via CDN
2. **Backend**: Stateless design allows multiple instances behind load balancer
3. **Database**: PostgreSQL supports read replicas
4. **InfluxDB**: Supports clustering in enterprise version
5. **MQTT**: Mosquitto supports clustering for high availability

### Performance Optimizations

1. **Database Indexing**: Indexes on frequently queried columns
2. **Connection Pooling**: SQLAlchemy connection pool for PostgreSQL
3. **Caching**: InfluxDB query caching for time-series data
4. **WebSocket**: Real-time updates reduce polling overhead
5. **Batch Processing**: Bulk writes to InfluxDB for sensor data
