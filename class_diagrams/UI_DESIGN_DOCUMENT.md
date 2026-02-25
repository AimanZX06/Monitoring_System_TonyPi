# 📱 TonyPi Robot Monitoring System - User Interface Design

This document describes the user interface design for the TonyPi Robot Monitoring System web application.

---

## 🎨 Design Overview

### Technology Stack
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for data visualization
- **xterm.js** for SSH terminal
- **Grafana** embedded panels

### Design Principles
- **Dark/Light Mode** support via ThemeContext
- **Responsive** design for desktop and tablet
- **Real-time updates** with 5-second auto-refresh
- **Color-coded indicators** (green/yellow/red thresholds)

---

## 🏗️ Layout Structure

```
┌────────────────────────────────────────────────────────────────────┐
│                    MAIN APPLICATION LAYOUT                          │
├──────────────┬─────────────────────────────────────────────────────┤
│              │                  TOP HEADER BAR                      │
│   SIDEBAR    │  ┌─────────────────────────────────────────────────┐ │
│   (Fixed)    │  │  Page Title          🔔Alerts  ●System Online  │ │
│   256px      │  └─────────────────────────────────────────────────┘ │
│              ├─────────────────────────────────────────────────────┤
│  ┌────────┐  │                                                     │
│  │ LOGO   │  │                                                     │
│  │ TonyPi │  │                  MAIN CONTENT AREA                  │
│  │Monitor │  │                    (Scrollable)                     │
│  └────────┘  │                                                     │
│              │    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐  │
│  ─────────── │    │ Card 1   │ │ Card 2   │ │ Card 3   │ │Card 4│  │
│              │    └──────────┘ └──────────┘ └──────────┘ └──────┘  │
│  📊Dashboard │                                                     │
│  📈Monitoring│    ┌─────────────────────────────────────────────┐  │
│  📄Reporting │    │                                             │  │
│  ⚙️Management│    │               Charts / Tables               │  │
│  🔔Alerts(5) │    │                                             │  │
│              │    └─────────────────────────────────────────────┘  │
│  ─────────── │                                                     │
│              │                                                     │
│  System      │                                                     │
│  Status: ●   │                                                     │
└──────────────┴─────────────────────────────────────────────────────┘
```

---

## 📄 Page Designs

### 1. 🔐 Login Page
**Purpose:** User authentication

| Element | Description |
|---------|-------------|
| Logo | TonyPi Monitor branding |
| Username | Text input field |
| Password | Password input field |
| Login Button | Primary action button |
| Dark Mode Toggle | Theme switcher |

**Features:**
- Form validation
- Error messages
- "Remember me" option
- Password visibility toggle

---

### 2. 📊 Dashboard Page
**Purpose:** System overview at a glance

#### Stats Cards Row (4 cards)
| Card | Value | Icon | Color |
|------|-------|------|-------|
| Active Robots | Count | Activity | Primary |
| Active Jobs | Count | Activity | Blue |
| Completed Today | Count | CheckCircle | Green |
| Items Processed | Count | CheckCircle | Purple |

#### Robot Status Cards (Grid 3 columns)
Each card shows:
- Robot name and ID
- Status badge (Online/Offline)
- Battery level (color-coded: >50% green, >20% yellow, <20% red)
- Position coordinates (x, y)
- Last seen timestamp
- Quick action buttons: "View Details", "Send Command"

#### System Services Status
Grid of service indicators:
- MQTT (green = running)
- InfluxDB (green = running)
- PostgreSQL (green = running)
- Grafana (green = running)

#### Resource Usage
Progress bars for:
- CPU Usage (%)
- Memory Usage (%)
- Disk Usage (%)

---

### 3. 📈 Monitoring Page (Task Manager)
**Purpose:** Real-time system performance metrics

#### Header Section
- Page title: "Performance / Task Manager"
- Robot selector dropdown
- System uptime display

#### Metric Cards Row (4 cards)
| Metric | Thresholds | Colors |
|--------|------------|--------|
| CPU Usage | Warning: 60%, Danger: 80% | Green/Yellow/Red |
| Memory Usage | Warning: 70%, Danger: 85% | Green/Yellow/Red |
| Disk Usage | Warning: 75%, Danger: 90% | Green/Yellow/Red |
| CPU Temperature | Warning: 60°C, Danger: 75°C | Green/Yellow/Red |

Each card has:
- Icon
- Current value with unit
- Progress bar

#### Charts Section
- **CPU & Memory Line Chart** (combined, dual-line)
- **Disk Usage Line Chart**
- **Temperature Line Chart**

#### Grafana Integration
- Embedded System Performance panel
- Embedded CPU Temperature Gauge
- Link to open full Grafana dashboard

---

### 4. 🤖 Robots Page
**Purpose:** Robot management and control

#### Robot Grid/List
Cards or table showing all robots with:
- Name and ID
- Status indicator
- IP address
- Camera URL
- Quick actions

#### Robot Detail View
- **Live Camera Stream** (MJPEG)
- **Control Panel:**
  - Movement buttons (Forward, Backward, Left, Right)
  - Action buttons (Wave, Bow, Stand)
  - Emergency Stop (red button)
  - Resume button
- **SSH Terminal** (xterm.js WebSocket connection)
- **Robot Configuration Form**

---

### 5. 📡 Sensors Page
**Purpose:** Real-time sensor data display

#### IMU Data Cards
| Sensor | Values |
|--------|--------|
| Accelerometer | X, Y, Z (m/s²) |
| Gyroscope | X, Y, Z (°/s) |

#### Environmental Sensors
| Sensor | Display |
|--------|---------|
| Light Level | Gauge (0-100%) |
| Ultrasonic Distance | Distance in cm |
| CPU Temperature | °C with color |

#### Grafana Panels
- Embedded sensor visualization panels

---

### 6. ⚙️ Servos Page
**Purpose:** Servo motor status and monitoring

#### Servo Grid (6 servos)
| Servo | Position | Temp | Voltage |
|-------|----------|------|---------|
| Right Hip Yaw (1) | 0-1023 | °C | V |
| Right Hip Pitch (2) | 0-1023 | °C | V |
| Right Knee (3) | 0-1023 | °C | V |
| Left Hip Yaw (4) | 0-1023 | °C | V |
| Left Hip Pitch (5) | 0-1023 | °C | V |
| Left Knee (6) | 0-1023 | °C | V |

Each servo card shows:
- Name and ID
- Position slider/indicator
- Temperature gauge
- Voltage reading
- Status indicator

---

### 7. 📋 Jobs Page
**Purpose:** Task execution tracking

#### Active Job Panel
- Task name
- Progress bar (percent complete)
- Current phase
- Items done / Total items
- Start time, Estimated duration

#### Job History Table
| Column | Description |
|--------|-------------|
| ID | Job number |
| Robot | Which robot |
| Task Name | Description |
| Phase | Current phase |
| Progress | Percentage bar |
| Status | Active/Completed/Cancelled/Failed |
| Duration | Time taken |
| Actions | View details |

#### Filters
- Status filter (All, Active, Completed, Failed)
- Robot filter
- Date range picker

---

### 8. 🔔 Alerts Page
**Purpose:** Alert management and threshold configuration

#### Alert Statistics Cards
- Total Alerts (24h)
- Critical Alerts (red)
- Warning Alerts (yellow)
- Unacknowledged count

#### Threshold Configuration Panel
Table to configure:
- Metric Type (temperature, battery, cpu, memory)
- Warning Threshold
- Critical Threshold
- Enabled toggle
- Actions (Edit, Delete)

#### Alert List Table
| Column | Description |
|--------|-------------|
| Severity | Critical/Warning/Info badge |
| Type | Alert category |
| Robot | Which robot |
| Message | Description |
| Value/Threshold | Actual vs limit |
| Time | When triggered |
| Status | Acknowledged/Resolved |
| Actions | Acknowledge, Resolve buttons |

#### Test Alert Generator
Form to create test alerts:
- Alert Type dropdown
- Severity dropdown
- Message input
- Generate button

---

### 9. 📄 Reports Page
**Purpose:** Generate and view reports

#### Report Generator Form
| Field | Type | Options |
|-------|------|---------|
| Report Type | Dropdown | Performance, Job, Maintenance, Custom |
| Robot | Dropdown | All robots |
| Time Period | Dropdown | Last 24h, 7d, 30d |
| Include AI Analysis | Toggle | Yes/No |
| Generate Button | Button | Primary action |

#### Report List Table
| Column | Description |
|--------|-------------|
| Title | Report name |
| Type | Report category |
| Robot | Subject robot |
| Created | Date/time |
| Created By | User |
| Actions | View, Download PDF |

#### Report Preview Card
- Report title and metadata
- Summary section
- Metrics section (if performance)
- AI Analysis section (with Gemini insights)
- Export PDF button

---

### 10. 📝 Logs Page
**Purpose:** System audit and debugging

#### Filter Panel
| Filter | Type | Options |
|--------|------|---------|
| Level | Multi-select | INFO, WARNING, ERROR, CRITICAL |
| Category | Multi-select | mqtt, api, database, system, command... |
| Robot | Dropdown | All or specific |
| Date Range | Date picker | From - To |
| Search | Text input | Full-text search |

#### Log Table
| Column | Description |
|--------|-------------|
| Timestamp | When logged |
| Level | Colored badge |
| Category | Log source |
| Robot | Related robot |
| Message | Log content |
| Details | Expandable JSON |

#### Pagination
- Items per page selector
- Page navigation

---

### 11. 👥 Users Page (Admin Only)
**Purpose:** User management

#### User Table
| Column | Description |
|--------|-------------|
| Username | Login name |
| Email | Contact email |
| Role | Admin/Operator/Viewer |
| Status | Active/Inactive |
| Created | Registration date |
| Actions | Edit, Delete |

#### Add/Edit User Modal
| Field | Type |
|-------|------|
| Username | Text input |
| Email | Email input |
| Password | Password input |
| Role | Dropdown |
| Active | Toggle |

---

## 🎨 Color Scheme

### Primary Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| primary-50 | #e0f2fe | - | Light background |
| primary-600 | #0284c7 | #0ea5e9 | Primary actions |
| primary-700 | #0369a1 | #0284c7 | Hover states |

### Status Colors
| Status | Color | Hex |
|--------|-------|-----|
| Success/Online | Green | #22c55e |
| Warning | Yellow | #eab308 |
| Error/Critical | Red | #ef4444 |
| Info | Blue | #3b82f6 |

### Thresholds
| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| CPU | <60% | 60-80% | >80% |
| Memory | <70% | 70-85% | >85% |
| Disk | <75% | 75-90% | >90% |
| Temperature | <60°C | 60-75°C | >75°C |
| Battery | >50% | 20-50% | <20% |

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Columns |
|------------|-------|---------|
| Mobile | <768px | 1 column |
| Tablet | 768-1024px | 2 columns |
| Desktop | >1024px | 3-4 columns |

---

## 🔄 Real-time Updates

| Component | Refresh Rate |
|-----------|--------------|
| Dashboard stats | 5 seconds |
| Monitoring metrics | 5 seconds |
| Sensor data | Real-time (MQTT) |
| Servo data | Real-time (MQTT) |
| Job progress | Real-time (MQTT) |
| Alerts | 30 seconds |
| System status | 5 seconds |

---

## 🎯 UI Components Library

The application uses these shared components:

- **Layout** - Main application wrapper with sidebar
- **Card** - Container component with shadow
- **Button** - Primary, Secondary, Danger variants
- **Toast** - Notification messages
- **Modal** - Dialog overlays
- **Table** - Data display with sorting
- **GrafanaPanel** - Embedded Grafana iframe
- **SSHTerminal** - xterm.js terminal
- **ProgressBar** - Visual progress indicator
