# Thesis Chapter 5 - Code Screenshot Guide

This document provides exact line ranges for code snippets to screenshot for your thesis.

---

## 5.1.1 Frontend Implementation

### React Dashboard Component
**File:** `frontend/src/pages/Dashboard.tsx`
| Screenshot | Lines | Description |
|------------|-------|-------------|
| Imports & Setup | 1-51 | React imports, TypeScript types, theme context |
| State Management | 72-95 | useState hooks for robot data, system status |
| Data Fetching | 106-153 | useEffect with API calls and auto-refresh |
| Render/JSX | 194-212 | Stats cards grid layout |

### React App Entry
**File:** `frontend/src/App.tsx`
| Screenshot | Lines | Description |
|------------|-------|-------------|
| Full File | 1-58 | Complete app structure (58 lines total) |

---

## 5.1.2 Backend Implementation

### FastAPI Application Setup
**File:** `backend/main.py`
| Screenshot | Lines | Description |
|------------|-------|-------------|
| Imports & Config | 1-85 | All imports, version config, startup message |
| Database Init | 92-128 | `init_database()` function with model imports |
| Lifespan Handler | 176-229 | Async startup/shutdown with MQTT client |
| FastAPI Setup | 237-282 | App creation, CORS middleware config |
| Router Registration | 288-327 | All 11 routers included with prefixes |

### API Router Example
**File:** `backend/routers/alerts.py`
| Screenshot | Lines | Description |
|------------|-------|-------------|
| Docstring & Imports | 1-74 | Module docstring, imports, router setup |
| Pydantic Models | 78-146 | Request/response schemas (AlertResponse, AlertCreate, etc.) |
| Default Thresholds | 149-157 | Threshold configuration dictionary |
| GET Endpoint | 160-197 | `get_alerts()` with query filtering |
| POST Endpoint | 232-256 | `create_alert()` with database commit |
| Threshold CRUD | 356-420 | Threshold management endpoints |

### User Authentication
**File:** `backend/routers/users.py`
| Screenshot | Lines | Description |
|------------|-------|-------------|
| JWT Token Auth | 130-169 | `get_current_user()` with token parsing |
| RBAC Middleware | 173-177 | `require_admin()` role check |
| Login Endpoint | 180-212 | Password verification, token creation |
| User CRUD | 221-274 | `create_user()` admin-only endpoint |

---

## 5.1.3 Database Implementation

### SQLAlchemy Model
**File:** `backend/models/robot.py`
| Screenshot | Lines | Description |
|------------|-------|-------------|
| Full Model | 1-100 | Docstring, imports, class definition start |
| Column Definitions | 76-181 | All column types with comments |
| `to_dict()` Method | 183-217 | Serialization for API responses |

---

## 5.1.4 MQTT Integration

### MQTT Client
**File:** `backend/mqtt/mqtt_client.py`
| Screenshot | Lines | Description |
|------------|-------|-------------|
| Architecture Diagram | 1-50 | ASCII diagram showing message flow |
| Class Setup | 103-129 | `MQTTClient.__init__()` with topics list |
| On Connect | 131-139 | Broker connection handler |
| Message Routing | 141-172 | `on_message()` topic dispatcher |
| Sensor Handling | 174-216 | `handle_sensor_data()` with InfluxDB write |
| Battery + Alerts | 298-324 | `handle_battery_data()` with threshold check |
| Start/Stop | 779-792 | Async `start()` and `stop()` methods |

---

## 5.2 Testing Results

### Pytest Test File
**File:** `backend/tests/test_alerts.py`
| Screenshot | Lines | Description |
|------------|-------|-------------|
| File Docstring | 1-48 | Test module documentation |
| Test Class | 60-90 | `TestAlertsAPI` with helper method |
| Test Methods | 85-116 | `test_get_alerts_empty`, `test_get_alerts_with_data`, filter tests |
| Create Test | 144-163 | `test_create_alert()` with assertions |
| Acknowledge Test | 165-176 | `test_acknowledge_alert()` |
| Threshold Tests | 286-346 | `TestAlertThresholds` class with CRUD tests |

---

## 5.5 Deployment

### Docker Compose
**File:** `docker-compose.yml`
| Screenshot | Lines | Description |
|------------|-------|-------------|
| Architecture Diagram | 1-53 | ASCII diagram, ports, usage instructions |
| MQTT Broker | 55-116 | Mosquitto service configuration |
| InfluxDB | 118-181 | Time-series database service |
| PostgreSQL | 183-240 | Relational database service |
| Grafana | 242-321 | Visualization dashboard service |
| Backend | 323-392 | FastAPI service with all env vars |
| Frontend | 394-448 | React service configuration |
| Networks/Volumes | 450-470 | Network and volume definitions |

---

## Quick Reference: Recommended Priority

### Must-Have Screenshots (Core Implementation)
1. `backend/main.py` lines 1-85 (FastAPI Setup)
2. `backend/main.py` lines 237-282 (App + CORS)
3. `backend/routers/alerts.py` lines 78-157 (Pydantic + Thresholds)
4. `backend/routers/alerts.py` lines 160-197 (GET Endpoint)
5. `backend/models/robot.py` lines 43-130 (Model Class)
6. `backend/tests/test_alerts.py` lines 60-116 (Test Class)
7. `docker-compose.yml` lines 55-116 (MQTT Service)

### Nice-to-Have Screenshots
8. `backend/mqtt/mqtt_client.py` lines 103-172 (MQTT Client)
9. `backend/routers/users.py` lines 180-212 (Auth)
10. `frontend/src/pages/Dashboard.tsx` lines 72-153 (React Hooks)

---

## Screenshot Tips

1. **Use dark theme** in VS Code for better readability
2. **Set font size** to 12-14pt for thesis print
3. **Capture full window** to show line numbers
4. **Add figure captions** like "Figure 5.1: FastAPI Application Setup"
5. **Highlight key lines** with VS Code's line highlighting
