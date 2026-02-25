# TailwindCSS & InfluxDB - Essential Screenshots for Thesis

## Overview

This document provides essential screenshot guides for **TailwindCSS 3.3.0** (frontend styling) and **InfluxDB 2.7** (time-series database) implementations in the TonyPi Robot Monitoring System.

---

# Part 1: TailwindCSS Implementation

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      TailwindCSS Styling Architecture                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ tailwind.config.js - Design Token Configuration                  │   │
│  │ • Content paths (./src/**/*.{ts,tsx})                            │   │
│  │ • Dark mode: 'class' based                                       │   │
│  │ • Custom colors: primary, success, warning, danger               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ index.css - Component Layer Definitions                          │   │
│  │ • @tailwind base, components, utilities                          │   │
│  │ • @layer components { .card, .btn-*, .status-*, ... }            │   │
│  │ • @layer utilities { .custom-scrollbar, .text-gradient, ... }    │   │
│  │ • Animations: spin, fadeIn, slideIn, pulse-live                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ React Components - Utility Class Usage                           │   │
│  │ <div className="bg-white rounded-xl shadow-lg p-6 mb-6">         │   │
│  │ <button className="btn-primary">Submit</button>                  │   │
│  │ <span className="status-online">Online</span>                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Final CSS: 12KB (PurgeCSS removes unused styles)                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📸 TailwindCSS Screenshot Guide

### Configuration Files

| # | Screenshot Description | File | Lines | What to Capture |
|---|------------------------|------|-------|-----------------|
| 1 | **Tailwind Config** - Complete configuration | `frontend/tailwind.config.js` | 1-35 | Full file with custom colors |
| 2 | **CSS Directives** - Tailwind imports | `frontend/src/index.css` | 1-4 | `@tailwind base, components, utilities` |
| 3 | **Base Layer** - Body and root styles | `frontend/src/index.css` | 6-24 | Gradient background, global resets |
| 4 | **Card Component** - Reusable card styles | `frontend/src/index.css` | 27-42 | `.card` with dark mode |
| 5 | **Button Components** - Gradient buttons | `frontend/src/index.css` | 44-75 | `.btn-primary`, `.btn-secondary`, `.btn-danger` |
| 6 | **Status Badges** - Online/offline indicators | `frontend/src/index.css` | 77-91 | `.status-online`, `.status-offline` |
| 7 | **Animations** - Loading spinner, fade | `frontend/src/index.css` | 124-149 | `@keyframes spin`, `fadeIn` |
| 8 | **Glass Morphism** - Modern blur effect | `frontend/src/index.css` | 181-184 | `.glass` class |
| 9 | **Dark Mode** - Theme switching | `frontend/src/index.css` | 278-289 | Dark mode gradient and scrollbar |

### Component Usage Examples (In React Files)

| # | Screenshot Description | File | Lines | What to Capture |
|---|------------------------|------|-------|-----------------|
| 10 | **Dashboard Cards** - Tailwind in JSX | `frontend/src/pages/Dashboard.tsx` | 194-230 | Card grid with utility classes |
| 11 | **Alert Badges** - Status indicators | `frontend/src/pages/Alerts.tsx` | 400-450 | Severity badges with colors |
| 12 | **Form Inputs** - Styled input fields | `frontend/src/pages/Login.tsx` | 130-180 | Input with focus states |

---

## TailwindCSS Key Implementation Details

### 1. Custom Color Palette (tailwind.config.js)

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',  // Class-based dark mode toggle
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',   // Main blue
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: { 500: '#22c55e', 600: '#16a34a' },
        warning: { 500: '#f59e0b', 600: '#d97706' },
        danger:  { 500: '#ef4444', 600: '#dc2626' },
      }
    },
  },
}
```

### 2. Component Layer Pattern (index.css)

```css
@layer components {
  /* Reusable Card Component */
  .card {
    @apply bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
  }

  /* Primary Button with Gradient */
  .btn-primary {
    @apply bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg;
    @apply font-semibold shadow-md transition-all duration-200;
    @apply hover:from-blue-700 hover:to-blue-800 hover:shadow-lg;
    @apply active:scale-95 focus:ring-2 focus:ring-blue-500;
  }
}
```

### 3. Usage in React Components

```tsx
// Dashboard.tsx - Utility-first styling
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-800">Total Robots</h3>
    <p className="text-3xl font-bold text-blue-600">{robotCount}</p>
  </div>
</div>

<button className="btn-primary">
  Start Monitoring
</button>

<span className="status-online">Online</span>
```

---

# Part 2: InfluxDB Implementation

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                     InfluxDB Time-Series Architecture                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ MQTT Client (mqtt_client.py)                                     │   │
│  │ Receives: sensors, battery, servos, logs, vision                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ InfluxClient (influx_client.py)                                  │   │
│  │                                                                   │   │
│  │ Validated Write Methods:                                          │   │
│  │ • write_validated_sensor() - IMU, temperature, ultrasonic        │   │
│  │ • write_servo_data()       - Position, temp, voltage per servo   │   │
│  │ • write_battery_status()   - Percentage, voltage, charging       │   │
│  │ • write_vision_data()      - Object detection, confidence        │   │
│  │ • write_log_entry()        - Robot terminal logs                 │   │
│  │ • write_location()         - X, Y, Z coordinates                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ InfluxDB 2.7 (Time-Series Database)                              │   │
│  │                                                                   │   │
│  │ BUCKET: robot_data                                                │   │
│  │                                                                   │
│  │ MEASUREMENTS:                                                     │   │
│  │ ├── sensor_data     - All sensor readings with validation        │   │
│  │ ├── servo_data      - Servo position, temperature, voltage       │   │
│  │ ├── battery_status  - Battery percentage and charging state      │   │
│  │ ├── vision_data     - Object detection with bounding boxes       │   │
│  │ ├── robot_logs      - Terminal output with log levels            │   │
│  │ ├── robot_location  - X, Y, Z position coordinates               │   │
│  │ └── robot_status    - Online/offline with system info            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Grafana 10.0 (Visualization)                                     │   │
│  │ Flux Queries → Time-series charts, gauges, tables                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📸 InfluxDB Screenshot Guide

### Core Implementation

| # | Screenshot Description | File | Lines | What to Capture |
|---|------------------------|------|-------|-----------------|
| 1 | **Module Docstring** - Why InfluxDB, data model | `backend/database/influx_client.py` | 1-43 | Full docstring with measurements |
| 2 | **Imports & Setup** - InfluxDB Python client | `backend/database/influx_client.py` | 45-65 | Library imports, env loading |
| 3 | **Class Docstring** - Usage examples | `backend/database/influx_client.py` | 70-101 | InfluxClient class doc |
| 4 | **Sensor Type Config** - Validation ranges | `backend/database/influx_client.py` | 103-119 | `SENSOR_TYPES` dictionary |
| 5 | **Client Init** - Connection setup | `backend/database/influx_client.py` | 121-131 | `__init__()` with URL, token |
| 6 | **Write Sensor Data** - Point creation | `backend/database/influx_client.py` | 143-179 | `write_sensor_data()` |
| 7 | **Validated Sensor Write** - With validation | `backend/database/influx_client.py` | 181-224 | `write_validated_sensor()` |
| 8 | **Servo Data Write** - Multi-field point | `backend/database/influx_client.py` | 226-271 | `write_servo_data()` |
| 9 | **Battery Status Write** - Charging state | `backend/database/influx_client.py` | 370-399 | `write_battery_status()` |
| 10 | **Flux Query - Basic** - Time range filter | `backend/database/influx_client.py` | 426-475 | `query_data()` with filters |
| 11 | **Flux Query - Sensor History** | `backend/database/influx_client.py` | 519-554 | `query_sensor_history()` |
| 12 | **Global Instance** - Singleton pattern | `backend/database/influx_client.py` | 689-691 | `influx_client = InfluxClient()` |

---

## InfluxDB Key Implementation Details

### 1. Data Model Explanation

```
InfluxDB uses a different model than SQL databases:

MEASUREMENT (like a table)     →  "sensor_data"
    └── TAGS (indexed strings) →  robot_id="tonypi_01", sensor_type="cpu_temp"
    └── FIELDS (values)        →  value=65.5, unit="C"
    └── TIMESTAMP              →  2026-01-22T10:30:00Z
```

### 2. Sensor Type Validation (Lines 103-116)

```python
SENSOR_TYPES = {
    "accelerometer_x": {"unit": "m/s^2", "min": -20, "max": 20},
    "accelerometer_y": {"unit": "m/s^2", "min": -20, "max": 20},
    "accelerometer_z": {"unit": "m/s^2", "min": -20, "max": 20},
    "gyroscope_x":     {"unit": "deg/s", "min": -500, "max": 500},
    "gyroscope_y":     {"unit": "deg/s", "min": -500, "max": 500},
    "gyroscope_z":     {"unit": "deg/s", "min": -500, "max": 500},
    "ultrasonic_distance": {"unit": "cm", "min": 0, "max": 500},
    "cpu_temperature": {"unit": "C", "min": 0, "max": 100},
    "light_level":     {"unit": "%", "min": 0, "max": 100},
}
```

### 3. Writing Data with Point Builder (Lines 155-179)

```python
def write_sensor_data(self, measurement: str, tags: dict, fields: dict) -> bool:
    """Write sensor data to InfluxDB with validation."""
    point = Point(measurement)
    
    # Add tags (indexed for fast queries)
    for key, value in tags.items():
        if value is not None:
            point = point.tag(key, str(value))
    
    # Add fields (actual values)
    for key, value in fields.items():
        if value is not None:
            if isinstance(value, bool):
                point = point.field(key, value)
            elif isinstance(value, (int, float)):
                point = point.field(key, value)
            else:
                point = point.field(key, str(value))
    
    self.write_api.write(bucket=self.bucket, record=point)
    return True
```

### 4. Flux Query Example (Lines 439-456)

```python
def query_data(self, measurement: str, time_range: str = "1h",
               filters: Optional[Dict] = None) -> List[Dict]:
    """Query data from InfluxDB with flexible filtering."""
    query = f'''
    from(bucket: "{self.bucket}")
      |> range(start: -{time_range})
      |> filter(fn: (r) => r._measurement == "{measurement}")
    '''
    
    # Add tag filters dynamically
    if filters:
        for key, value in filters.items():
            query += f'''
      |> filter(fn: (r) => r.{key} == "{value}")
    '''
    
    # Pivot fields into columns
    query += '''
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    '''
    
    result = self.query_api.query(query)
    return [record.values for table in result for record in table.records]
```

---

## Priority Screenshots Summary

### Must-Have for Thesis (7 Essential)

| # | Technology | File | Lines | Description |
|---|------------|------|-------|-------------|
| 1 | **TailwindCSS** | `tailwind.config.js` | 1-35 | Complete config with colors |
| 2 | **TailwindCSS** | `index.css` | 1-75 | Directives + card + buttons |
| 3 | **TailwindCSS** | `index.css` | 124-149 | Animations (spin, fadeIn) |
| 4 | **InfluxDB** | `influx_client.py` | 1-43 | Module docstring (Why InfluxDB) |
| 5 | **InfluxDB** | `influx_client.py` | 103-131 | SENSOR_TYPES + __init__ |
| 6 | **InfluxDB** | `influx_client.py` | 181-224 | write_validated_sensor() |
| 7 | **InfluxDB** | `influx_client.py` | 426-456 | Flux query with filters |

### Nice-to-Have (3 Additional)

| # | Technology | File | Lines | Description |
|---|------------|------|-------|-------------|
| 8 | **TailwindCSS** | `index.css` | 181-206 | Glass morphism, metric card |
| 9 | **InfluxDB** | `influx_client.py` | 226-271 | write_servo_data() |
| 10 | **InfluxDB** | `influx_client.py` | 640-680 | get_latest_status() |

---

## Screenshot Tips

1. **TailwindCSS Config** - Show the color palette definition clearly
2. **CSS Layers** - Highlight `@layer components` usage
3. **InfluxDB Point** - Focus on tags vs fields distinction
4. **Flux Query** - Show the pipe-forward (`|>`) syntax
5. **Use dark theme** in VS Code for better contrast
6. **Font size 12-14pt** for thesis print readability
