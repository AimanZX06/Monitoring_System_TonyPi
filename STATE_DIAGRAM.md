# State Diagram - TonyPi Robot Monitoring System

## Overview

This document describes the various state machines within the TonyPi Robot Monitoring System. State diagrams model the dynamic behavior of the system by showing the different states an entity can be in and the transitions between those states.

---

## 1. Robot State Machine

The Robot State Machine represents the operational states of a TonyPi robot within the monitoring system.

### States

| State | Description |
|-------|-------------|
| **Offline** | Robot is not connected to the system; no communication established |
| **Connecting** | Robot is attempting to establish MQTT connection |
| **Online** | Robot is connected and operational; sending telemetry data |
| **Working** | Robot is actively executing a job (scanning QR codes) |
| **Idle** | Robot is online but not performing any task |
| **Error** | Robot has encountered an error condition |
| **Maintenance** | Robot is in maintenance mode for servicing |

### State Transitions

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

### State Diagram (Text Representation)

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

---

## 2. Job State Machine

The Job State Machine represents the lifecycle of a packaging/scanning job.

### States

| State | Description |
|-------|-------------|
| **Pending** | Job created but not yet started |
| **Active** | Job is currently being executed |
| **Paused** | Job execution temporarily halted |
| **Completed** | Job finished successfully |
| **Failed** | Job terminated due to error |
| **Cancelled** | Job was manually cancelled |

### State Transitions

| From State | To State | Trigger/Event | Guard Condition |
|------------|----------|---------------|-----------------|
| Pending | Active | Start job | Robot available |
| Active | Paused | Pause command | User authorized |
| Active | Completed | All items done | percent_complete = 100 |
| Active | Failed | Error occurred | Unrecoverable error |
| Active | Cancelled | Cancel command | User authorized |
| Paused | Active | Resume command | Robot ready |
| Paused | Cancelled | Cancel command | User authorized |
| Failed | Pending | Retry job | Max retries not exceeded |

### Job Progress Sub-states (within Active)

```
Active State
├── Initializing (Setting up scan parameters)
├── Scanning (QR code detection active)
├── Processing (Validating scanned data)
└── Updating (Sending progress to server)
```

---

## 3. Alert State Machine

The Alert State Machine represents the lifecycle of system alerts and notifications.

### States

| State | Description |
|-------|-------------|
| **Created** | Alert generated but not yet viewed |
| **Active** | Alert is active and requiring attention |
| **Acknowledged** | Alert has been acknowledged by an operator |
| **Resolved** | Alert condition has been resolved |
| **Deleted** | Alert has been removed from the system |

### Severity Levels (Orthogonal State)

| Severity | Description | Response Time |
|----------|-------------|---------------|
| **Critical** | Immediate attention required | < 5 minutes |
| **Warning** | Attention needed soon | < 30 minutes |
| **Info** | Informational notification | Review when convenient |

### State Transitions

| From State | To State | Trigger/Event | Guard Condition |
|------------|----------|---------------|-----------------|
| Created | Active | Time elapsed | Auto-transition |
| Active | Acknowledged | User acknowledges | User has permission |
| Acknowledged | Resolved | Issue fixed | Condition cleared |
| Active | Resolved | Auto-resolve | Condition self-cleared |
| Any | Deleted | Delete command | Admin permission |

### Alert Types

- **Temperature Alert**: CPU/Servo temperature exceeds threshold
- **Battery Alert**: Battery level drops below threshold
- **System Alert**: System resource usage critical
- **Connection Alert**: Robot connection issues
- **Servo Alert**: Servo voltage or temperature issues

---

## 4. User Session State Machine

The User Session State Machine represents user authentication and session states.

### States

| State | Description |
|-------|-------------|
| **Logged Out** | No active session |
| **Authenticating** | Login request being processed |
| **Authenticated** | User has valid active session |
| **Session Expired** | Session token has expired |
| **Locked** | Account temporarily locked |

### State Transitions

| From State | To State | Trigger/Event | Guard Condition |
|------------|----------|---------------|-----------------|
| Logged Out | Authenticating | Login attempt | Credentials provided |
| Authenticating | Authenticated | Auth success | Valid credentials |
| Authenticating | Logged Out | Auth failure | Invalid credentials |
| Authenticating | Locked | Too many failures | Attempts > threshold |
| Authenticated | Session Expired | Token expired | Time > token_lifetime |
| Authenticated | Logged Out | Logout | User action |
| Session Expired | Authenticating | Re-login | User action |
| Locked | Logged Out | Lock timeout | Time > lock_duration |

### User Roles (Orthogonal State)

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management |
| **Operator** | Robot control, job management |
| **Viewer** | Read-only dashboard access |

---

## 5. MQTT Connection State Machine

The MQTT Connection State Machine represents the communication channel between robots and the backend.

### States

| State | Description |
|-------|-------------|
| **Disconnected** | No connection to MQTT broker |
| **Connecting** | Attempting to establish connection |
| **Connected** | Active connection to broker |
| **Subscribing** | Subscribing to topics |
| **Ready** | Fully operational, receiving messages |
| **Reconnecting** | Re-establishing lost connection |

### State Transitions

| From State | To State | Trigger/Event | Guard Condition |
|------------|----------|---------------|-----------------|
| Disconnected | Connecting | Connect request | Broker URL configured |
| Connecting | Connected | Connection ACK | Broker accepts |
| Connecting | Disconnected | Connection refused | After max retries |
| Connected | Subscribing | Connection ready | Topics configured |
| Subscribing | Ready | Subscribe ACK | All topics subscribed |
| Ready | Reconnecting | Connection lost | Network interruption |
| Reconnecting | Connecting | Retry attempt | Retry count < max |
| Reconnecting | Disconnected | Max retries | Exhausted retries |
| Any | Disconnected | Disconnect command | Graceful shutdown |

---

## 6. System Health State Machine

The System Health State Machine represents the overall health status of the monitoring system.

### States

| State | Description |
|-------|-------------|
| **Healthy** | All components operational |
| **Degraded** | Some components experiencing issues |
| **Critical** | Major components failing |
| **Offline** | System not operational |

### Health Check Components

- Database connectivity (PostgreSQL)
- Time-series database (InfluxDB)
- Message broker (MQTT/Mosquitto)
- Visualization service (Grafana)
- Backend API services

### State Transitions

| From State | To State | Trigger/Event | Guard Condition |
|------------|----------|---------------|-----------------|
| Healthy | Degraded | Component warning | 1+ components unhealthy |
| Degraded | Healthy | Issues resolved | All components healthy |
| Degraded | Critical | Multiple failures | Critical components down |
| Critical | Degraded | Partial recovery | Some components restored |
| Critical | Offline | Total failure | All components down |
| Offline | Critical | Partial startup | Some components up |

---

## 7. QR Code Scanning State Machine

The QR Code Scanning State Machine represents the scanning process during job execution.

### States

| State | Description |
|-------|-------------|
| **Idle** | Camera not scanning |
| **Initializing** | Camera warming up |
| **Scanning** | Actively looking for QR codes |
| **Detected** | QR code found, decoding |
| **Processing** | Validating decoded data |
| **Success** | Valid QR code processed |
| **Error** | Invalid or unreadable code |

### State Transitions

| From State | To State | Trigger/Event | Guard Condition |
|------------|----------|---------------|-----------------|
| Idle | Initializing | Start scan | Camera available |
| Initializing | Scanning | Camera ready | Initialization complete |
| Scanning | Detected | QR found | Code in frame |
| Detected | Processing | Decode complete | Valid QR format |
| Processing | Success | Validation passed | Data matches expected |
| Processing | Error | Validation failed | Invalid data |
| Success | Scanning | Continue scan | More items expected |
| Error | Scanning | Retry scan | Error handled |
| Any | Idle | Stop scan | Job complete/cancelled |

---

## State Diagram Summary

| Entity | States | Primary Transitions |
|--------|--------|---------------------|
| Robot | 7 states | Offline → Online → Working → Idle |
| Job | 6 states | Pending → Active → Completed/Failed |
| Alert | 5 states | Created → Active → Acknowledged → Resolved |
| User Session | 5 states | Logged Out → Authenticated → Expired |
| MQTT Connection | 6 states | Disconnected → Connected → Ready |
| System Health | 4 states | Healthy ↔ Degraded ↔ Critical |
| QR Scanning | 7 states | Idle → Scanning → Detected → Success |

---

## References

- UML 2.5 State Machine Diagrams Specification
- TonyPi Robot Monitoring System Architecture Document
- PostgreSQL Database Models (`backend/models/`)
- MQTT Client Implementation (`robot_client/tonypi_client.py`)
