# User Acceptance Testing (UAT) Guide
## TonyPi Robot Monitoring System

---

## Table of Contents

1. [What is UAT?](#what-is-uat)
2. [UAT vs Unit Testing](#uat-vs-unit-testing)
3. [UAT Process](#uat-process)
4. [Test Environment Setup](#test-environment-setup)
5. [UAT Test Scenarios](#uat-test-scenarios)
6. [UAT Execution Checklist](#uat-execution-checklist)
7. [Defect Reporting](#defect-reporting)
8. [UAT Sign-Off Document](#uat-sign-off-document)

---

## What is UAT?

**User Acceptance Testing (UAT)** is the final phase of software testing where actual end users verify that the system meets their business requirements and works as expected in real-world scenarios.

### Key Characteristics of UAT

| Aspect | Description |
|--------|-------------|
| **Purpose** | Validate the system meets business requirements |
| **Performed By** | End users, stakeholders, or domain experts |
| **Environment** | Production-like or staging environment |
| **Focus** | Business processes and user workflows |
| **Outcome** | Go/No-Go decision for production deployment |

### Why is UAT Important?

1. **Validates Business Requirements** - Ensures the system solves actual business problems
2. **User Confidence** - Builds trust that the system works correctly
3. **Reduces Risk** - Catches issues before production deployment
4. **Documentation** - Provides evidence of testing for compliance
5. **Training Opportunity** - Familiarizes users with the system

---

## UAT vs Unit Testing

| Aspect | Unit Testing | User Acceptance Testing (UAT) |
|--------|--------------|------------------------------|
| **Who performs** | Developers | End users / Stakeholders |
| **What is tested** | Individual code units | Complete business workflows |
| **Purpose** | Code works correctly | System meets user needs |
| **When** | During development | Before production release |
| **Test cases** | Technical, automated | Business scenarios, manual |
| **Environment** | Development/CI | Staging/Pre-production |
| **Pass criteria** | Code functions correctly | Business requirements met |

### Testing Pyramid Context

```
                    /\
                   /  \      ← UAT (User Acceptance Testing)
                  /----\        - End-to-end business flows
                 /      \       - Performed by users
                /--------\   ← Integration Tests
               /          \     - API and service integration
              /------------\ ← Unit Tests (Already documented)
             /              \   - Individual functions
            ------------------
```

---

## UAT Process

### Phase 1: Planning (Before Testing)

```
┌─────────────────────────────────────────────────────────────────┐
│                      UAT PLANNING PHASE                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Define UAT scope and objectives                              │
│  2. Identify UAT testers (by user persona)                       │
│  3. Prepare test environment                                     │
│  4. Create test scenarios from user stories                      │
│  5. Schedule UAT sessions                                        │
│  6. Prepare test data                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Execution (During Testing)

```
┌─────────────────────────────────────────────────────────────────┐
│                      UAT EXECUTION PHASE                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Brief testers on test scenarios                              │
│  2. Execute test cases                                           │
│  3. Record results (Pass/Fail/Blocked)                           │
│  4. Document defects found                                       │
│  5. Retest after fixes                                           │
│  6. Track progress                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Sign-Off (After Testing)

```
┌─────────────────────────────────────────────────────────────────┐
│                      UAT SIGN-OFF PHASE                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Review all test results                                      │
│  2. Verify all critical defects resolved                         │
│  3. Document known issues/limitations                            │
│  4. Obtain stakeholder sign-off                                  │
│  5. Approve for production deployment                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Test Environment Setup

### Prerequisites

Before starting UAT, ensure the following:

| Component | Requirement | How to Verify |
|-----------|-------------|---------------|
| Docker | Running with all containers up | `docker-compose ps` |
| Backend API | Accessible at `http://localhost:8000` | Visit `/docs` endpoint |
| Frontend | Accessible at `http://localhost:3000` | Open in browser |
| PostgreSQL | Database with seed data | Check logs for connection |
| InfluxDB | Time-series database running | Check Grafana datasource |
| MQTT Broker | Mosquitto running | Check port 1883 |
| Grafana | Dashboards accessible | Visit `http://localhost:3001` |
| Robot Simulator | (Optional) Sending test data | Run `simulator.py` |

### Start Test Environment

```bash
# Start all services
docker-compose up -d

# Verify all services are running
docker-compose ps

# Initialize test users (if not done)
docker-compose exec backend python scripts/init_users.py

# (Optional) Start robot simulator for test data
cd robot_client
python simulator.py --robot-id test_robot_001
```

### Test User Accounts

| Username | Password | Role | Use For Testing |
|----------|----------|------|-----------------|
| `admin` | `admin123` | Admin | Admin-only features |
| `operator` | `operator123` | Operator | Operator features |
| `viewer` | `viewer123` | Viewer | View-only features |

---

## UAT Test Scenarios

The test scenarios are organized by **Epic** (matching the User Stories from REQUIREMENTS.md) and **User Persona**.

---

### Epic 1: User Authentication & Authorization

#### UAT-1.1: User Login
| Field | Value |
|-------|-------|
| **Test ID** | UAT-1.1 |
| **User Story** | US-1.3: As a User, I want to log in securely |
| **Tester Role** | All Users (Admin, Operator, Viewer) |
| **Preconditions** | Application running, user account exists |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to `http://localhost:3000` | Login page displayed with username/password fields | | |
| 2 | Enter valid username: `admin` | Username accepted | | |
| 3 | Enter valid password: `admin123` | Password field masked | | |
| 4 | Click "Sign In" button | Loading indicator shown | | |
| 5 | Wait for redirect | Dashboard page displayed with user info in header | | |
| 6 | Refresh the page (F5) | Session persists, still on Dashboard | | |

**Negative Test:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Enter invalid password: `wrongpassword` | Error message: "Invalid credentials" displayed | | |
| 2 | Leave username empty, click Sign In | Validation error shown | | |

---

#### UAT-1.2: User Logout
| Field | Value |
|-------|-------|
| **Test ID** | UAT-1.2 |
| **User Story** | US-1.4: As a User, I want to log out securely |
| **Tester Role** | All Users |
| **Preconditions** | User is logged in |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click on user profile/menu in header | Dropdown menu appears with Logout option | | |
| 2 | Click "Logout" | Redirected to Login page | | |
| 3 | Try to access Dashboard directly via URL | Redirected back to Login page | | |
| 4 | Press browser Back button | Still on Login page (session cleared) | | |

---

#### UAT-1.3: User Management (Admin Only)
| Field | Value |
|-------|-------|
| **Test ID** | UAT-1.3 |
| **User Story** | US-1.1, US-1.2: User account management |
| **Tester Role** | Admin |
| **Preconditions** | Logged in as Admin |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Users page | User list displayed with existing users | | |
| 2 | Click "Add User" button | User creation form appears | | |
| 3 | Fill in: Username: `testuser`, Email: `test@example.com`, Password: `Test123!`, Role: `Viewer` | Form accepts all values | | |
| 4 | Click "Save" | Success message, new user in list | | |
| 5 | Click Edit on `testuser` | Edit form opens with user data | | |
| 6 | Change role to `Operator` | Role dropdown allows selection | | |
| 7 | Click "Save" | Success message, role updated in list | | |
| 8 | Login as `testuser` in new browser | Login successful, Operator permissions | | |

**Access Control Test:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as `operator` | Login successful | | |
| 2 | Try to access Users page | Access denied or menu not visible | | |
| 3 | Login as `viewer` | Login successful | | |
| 4 | Try to access Users page | Access denied or menu not visible | | |

---

### Epic 2: Real-Time Robot Monitoring

#### UAT-2.1: View Dashboard
| Field | Value |
|-------|-------|
| **Test ID** | UAT-2.1 |
| **User Story** | US-2.1-2.6: Real-time monitoring |
| **Tester Role** | All Users |
| **Preconditions** | Logged in, robot simulator running |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Dashboard/Overview | Dashboard page loads | | |
| 2 | Observe Stats Cards | Shows: Active Robots, Active Jobs, Completed Today, Items Processed | | |
| 3 | Check System Status card | Shows Backend status (Online), connection status | | |
| 4 | Select a robot from dropdown | Robot status details displayed | | |
| 5 | Wait 10-15 seconds | Data updates automatically (real-time refresh) | | |

---

#### UAT-2.2: View Performance Metrics
| Field | Value |
|-------|-------|
| **Test ID** | UAT-2.2 |
| **User Story** | US-2.1: View CPU, memory, disk usage |
| **Tester Role** | Operator, Admin |
| **Preconditions** | Robot sending telemetry data |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Performance/Monitoring page | Performance page loads | | |
| 2 | Select robot from dropdown | Robot selected | | |
| 3 | Observe CPU gauge | Shows current CPU % with circular gauge | | |
| 4 | Observe Memory gauge | Shows memory used/total (e.g., 2.4/4.0 GB) | | |
| 5 | Observe Disk gauge | Shows disk usage percentage | | |
| 6 | Check color indicators | Green (<60%), Yellow (60-80%), Red (>80%) | | |
| 7 | Scroll to Grafana panels | Historical charts displayed | | |

---

#### UAT-2.3: View Sensor Data
| Field | Value |
|-------|-------|
| **Test ID** | UAT-2.3 |
| **User Story** | US-2.6: View sensor data in real-time |
| **Tester Role** | All Users |
| **Preconditions** | Robot sending sensor data |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Sensors page | Sensor page loads | | |
| 2 | Select robot from dropdown | Robot selected | | |
| 3 | View Temperature card | Temperature value with unit (°C) displayed | | |
| 4 | View Humidity card | Humidity percentage displayed | | |
| 5 | View Sonar Distance card | Distance in cm displayed | | |
| 6 | View IMU Data section | Accelerometer X,Y,Z values shown | | |
| 7 | Click different sensor tabs | Filters sensor display correctly | | |
| 8 | Check "Last updated" timestamps | Updates within 5-10 seconds | | |

---

#### UAT-2.4: View Servo Status
| Field | Value |
|-------|-------|
| **Test ID** | UAT-2.4 |
| **User Story** | US-2.7: Monitor servo positions, temperatures |
| **Tester Role** | Operator, Admin |
| **Preconditions** | Robot sending servo data |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Servos page | Servo monitoring page loads | | |
| 2 | Select robot from dropdown | Robot selected | | |
| 3 | View Servo 1-6 cards | Each servo shows position (degrees), temperature, load | | |
| 4 | Check temperature warning | High temperature (>50°C) shows warning color | | |
| 5 | Scroll to temperature chart | Historical servo temperatures displayed | | |

---

#### UAT-2.5: View Camera Stream
| Field | Value |
|-------|-------|
| **Test ID** | UAT-2.5 |
| **User Story** | US-2.4: View live camera feed |
| **Tester Role** | All Users |
| **Preconditions** | Robot with camera streaming |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to robot detail or camera view | Camera section visible | | |
| 2 | Check if camera stream loads | MJPEG stream displays or placeholder shown | | |
| 3 | Verify stream updates | Image updates smoothly (if camera connected) | | |
| 4 | Try full-screen mode (if available) | Camera expands to full screen | | |

---

### Epic 3: Robot Control & Commands

#### UAT-3.1: Send Robot Command
| Field | Value |
|-------|-------|
| **Test ID** | UAT-3.1 |
| **User Story** | US-3.1: Send commands to robots remotely |
| **Tester Role** | Operator, Admin |
| **Preconditions** | Robot online and connected |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Robots page | Robot list displayed | | |
| 2 | Select online robot | Robot details shown | | |
| 3 | Find command input/buttons | Command interface visible | | |
| 4 | Send "status" command | Command acknowledged, response shown | | |
| 5 | Send movement command (if available) | Robot responds or confirmation displayed | | |

---

#### UAT-3.2: Emergency Stop
| Field | Value |
|-------|-------|
| **Test ID** | UAT-3.2 |
| **User Story** | US-3.2: Execute emergency stop |
| **Tester Role** | Operator, Admin |
| **Preconditions** | Robot online and performing action |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Locate Emergency Stop button | Button visible and prominent (usually red) | | |
| 2 | Click Emergency Stop | Confirmation dialog appears (if any) | | |
| 3 | Confirm stop | Robot immediately stops all operations | | |
| 4 | Verify robot state | Robot shows stopped/idle status | | |

---

### Epic 4: Alerts & Notifications

#### UAT-4.1: View and Manage Alerts
| Field | Value |
|-------|-------|
| **Test ID** | UAT-4.1 |
| **User Story** | US-4.1-4.4: Alert management |
| **Tester Role** | Operator, Admin |
| **Preconditions** | Alerts exist in system (generate by exceeding thresholds) |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Alerts page | Alert page loads with statistics | | |
| 2 | View alert count cards | Critical, Warning, Info counts displayed | | |
| 3 | View active alerts list | Alerts shown with severity, message, timestamp | | |
| 4 | Click "Acknowledge" on an alert | Alert marked as acknowledged | | |
| 5 | Click "Resolve" on acknowledged alert | Alert moved to resolved/history | | |
| 6 | Use severity filter | Only selected severity alerts shown | | |

---

#### UAT-4.2: Configure Alert Thresholds (Admin)
| Field | Value |
|-------|-------|
| **Test ID** | UAT-4.2 |
| **User Story** | US-4.2: Configure alert thresholds |
| **Tester Role** | Admin only |
| **Preconditions** | Logged in as Admin |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Alerts page | Alerts page loads | | |
| 2 | Click "Configure" or settings button | Threshold configuration opens | | |
| 3 | Modify CPU warning threshold (e.g., 70%) | Value accepted | | |
| 4 | Modify CPU critical threshold (e.g., 85%) | Value accepted | | |
| 5 | Save configuration | Success message shown | | |
| 6 | Trigger alert by exceeding threshold | New alert generated with correct severity | | |

---

### Epic 5: Reports & Analytics

#### UAT-5.1: Generate Report
| Field | Value |
|-------|-------|
| **Test ID** | UAT-5.1 |
| **User Story** | US-5.1, US-5.2: Generate and view reports |
| **Tester Role** | Operator, Admin |
| **Preconditions** | Historical data exists |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Reports page | Reports page loads | | |
| 2 | Click "Generate Report" | Report form appears | | |
| 3 | Select Report Type: "Performance" | Type selected | | |
| 4 | Select Robot: `test_robot_001` | Robot selected | | |
| 5 | Enter Title: "UAT Test Report" | Title accepted | | |
| 6 | Enter Description: "Generated during UAT" | Description accepted | | |
| 7 | Enable "Include AI Analytics" (if available) | Checkbox selected | | |
| 8 | Click "Generate with AI" | Loading indicator, then report created | | |
| 9 | Verify report in list | New report appears in Recent Reports | | |

---

#### UAT-5.2: View and Download Report
| Field | Value |
|-------|-------|
| **Test ID** | UAT-5.2 |
| **User Story** | US-5.1, US-5.3: View and export reports |
| **Tester Role** | All Users |
| **Preconditions** | Reports exist in system |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Reports page | Reports page loads with list | | |
| 2 | Click "View" on a report | Report details/preview displayed | | |
| 3 | Verify report content | Shows title, description, data, analysis | | |
| 4 | Click "Download PDF" or export button | PDF file downloads | | |
| 5 | Open downloaded PDF | Report formatted correctly with data | | |

---

### Epic 6: Job & Task Tracking

#### UAT-6.1: View Job Progress
| Field | Value |
|-------|-------|
| **Test ID** | UAT-6.1 |
| **User Story** | US-6.1: View active jobs and progress |
| **Tester Role** | All Users |
| **Preconditions** | Jobs exist (active or historical) |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Jobs page | Jobs page loads | | |
| 2 | View Job Summary cards | Active, Completed, Failed counts shown | | |
| 3 | View Active Jobs section | Current jobs with progress bar displayed | | |
| 4 | Check progress percentage | Shows items completed/total (e.g., 75/100) | | |
| 5 | View Job History table | Past jobs with status, duration shown | | |
| 6 | Click "View" on a job | Job details modal/page opens | | |

---

### Epic 7: System Logs

#### UAT-7.1: View and Filter Logs
| Field | Value |
|-------|-------|
| **Test ID** | UAT-7.1 |
| **User Story** | US-7.1, US-7.2: View and filter logs |
| **Tester Role** | Operator, Admin |
| **Preconditions** | System generating logs |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Logs page | Logs page loads | | |
| 2 | View log statistics cards | Info, Warning, Error, Critical counts | | |
| 3 | View log entries list | Timestamp, level, category, message shown | | |
| 4 | Select Level filter: "Error" | Only error logs displayed | | |
| 5 | Select Robot filter: specific robot | Only that robot's logs shown | | |
| 6 | Click Refresh button | Log list updates with latest entries | | |
| 7 | Check color coding | Error=red, Warning=yellow, Info=blue | | |

---

### Epic 8: Multi-Robot Management

#### UAT-8.1: View and Manage Robots
| Field | Value |
|-------|-------|
| **Test ID** | UAT-8.1 |
| **User Story** | US-8.1, US-8.2: Robot registration and grid view |
| **Tester Role** | Admin for registration, All for viewing |
| **Preconditions** | At least one robot registered |

**Test Steps:**

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Robots page | Robot grid/list displayed | | |
| 2 | View robot cards | Each card shows: ID, name, status, battery | | |
| 3 | Check online/offline indicator | Green dot=online, Red/Gray=offline | | |
| 4 | Check Last Seen timestamp | Shows relative time (e.g., "2 minutes ago") | | |
| 5 | Click on robot card | Robot details page opens | | |
| 6 | (Admin) Click "Add Robot" | Robot registration form opens | | |
| 7 | (Admin) Fill form and save | New robot added to grid | | |

---

## UAT Execution Checklist

Use this checklist to track UAT progress:

### Pre-UAT Checklist

- [ ] Test environment is set up and accessible
- [ ] All test user accounts are created
- [ ] Test data (robots, historical data) is available
- [ ] UAT testers are identified and briefed
- [ ] Test scenarios are reviewed and understood
- [ ] Defect tracking system is ready

### UAT Execution Tracker

| Epic | Test ID | Tester | Date | Status | Defects |
|------|---------|--------|------|--------|---------|
| Authentication | UAT-1.1 | | | ☐ Pass ☐ Fail | |
| Authentication | UAT-1.2 | | | ☐ Pass ☐ Fail | |
| User Management | UAT-1.3 | | | ☐ Pass ☐ Fail | |
| Dashboard | UAT-2.1 | | | ☐ Pass ☐ Fail | |
| Performance | UAT-2.2 | | | ☐ Pass ☐ Fail | |
| Sensors | UAT-2.3 | | | ☐ Pass ☐ Fail | |
| Servos | UAT-2.4 | | | ☐ Pass ☐ Fail | |
| Camera | UAT-2.5 | | | ☐ Pass ☐ Fail | |
| Robot Control | UAT-3.1 | | | ☐ Pass ☐ Fail | |
| Emergency Stop | UAT-3.2 | | | ☐ Pass ☐ Fail | |
| Alerts | UAT-4.1 | | | ☐ Pass ☐ Fail | |
| Alert Config | UAT-4.2 | | | ☐ Pass ☐ Fail | |
| Report Gen | UAT-5.1 | | | ☐ Pass ☐ Fail | |
| Report View | UAT-5.2 | | | ☐ Pass ☐ Fail | |
| Jobs | UAT-6.1 | | | ☐ Pass ☐ Fail | |
| Logs | UAT-7.1 | | | ☐ Pass ☐ Fail | |
| Robots | UAT-8.1 | | | ☐ Pass ☐ Fail | |

### Post-UAT Checklist

- [ ] All test scenarios executed
- [ ] All critical defects resolved and retested
- [ ] Known issues documented
- [ ] UAT results compiled
- [ ] Sign-off obtained from stakeholders

---

## Defect Reporting

### Defect Report Template

When a test fails, document the defect using this template:

```
╔══════════════════════════════════════════════════════════════════╗
║                        DEFECT REPORT                              ║
╠══════════════════════════════════════════════════════════════════╣
║ Defect ID:      DEF-001                                          ║
║ Test ID:        UAT-2.2                                          ║
║ Reported By:    [Tester Name]                                    ║
║ Date:           [YYYY-MM-DD]                                     ║
║ Severity:       ☐ Critical  ☐ High  ☐ Medium  ☐ Low              ║
╠══════════════════════════════════════════════════════════════════╣
║ SUMMARY:                                                          ║
║ [Brief description of the defect]                                 ║
╠══════════════════════════════════════════════════════════════════╣
║ STEPS TO REPRODUCE:                                               ║
║ 1.                                                                ║
║ 2.                                                                ║
║ 3.                                                                ║
╠══════════════════════════════════════════════════════════════════╣
║ EXPECTED RESULT:                                                  ║
║ [What should happen]                                              ║
╠══════════════════════════════════════════════════════════════════╣
║ ACTUAL RESULT:                                                    ║
║ [What actually happened]                                          ║
╠══════════════════════════════════════════════════════════════════╣
║ ATTACHMENTS:                                                      ║
║ ☐ Screenshot  ☐ Video  ☐ Log file                                ║
╠══════════════════════════════════════════════════════════════════╣
║ STATUS:         ☐ Open  ☐ In Progress  ☐ Fixed  ☐ Closed         ║
╚══════════════════════════════════════════════════════════════════╝
```

### Severity Definitions

| Severity | Definition | Example |
|----------|------------|---------|
| **Critical** | System unusable, no workaround | Cannot login, application crashes |
| **High** | Major feature broken, blocks user | Cannot generate reports, robot control fails |
| **Medium** | Feature partially broken, workaround exists | Filter doesn't work, but data is visible |
| **Low** | Minor issue, cosmetic | Typo, alignment issue, color inconsistency |

---

## UAT Sign-Off Document

### UAT Summary Report

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              UAT SIGN-OFF DOCUMENT - TonyPi Monitoring System                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  PROJECT:        TonyPi Robot Monitoring System                              ║
║  VERSION:        1.0                                                          ║
║  UAT PERIOD:     [Start Date] to [End Date]                                  ║
║  ENVIRONMENT:    [Staging/Pre-Production URL]                                ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                            TEST SUMMARY                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Total Test Scenarios:        17                                              ║
║  ────────────────────────────────────                                        ║
║  ✅ Passed:                   ___                                            ║
║  ❌ Failed:                   ___                                            ║
║  ⏸️  Blocked:                  ___                                            ║
║  ⏭️  Not Executed:             ___                                            ║
║                                                                               ║
║  Pass Rate:                   ___%                                           ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                           DEFECT SUMMARY                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Total Defects Found:         ___                                            ║
║  ────────────────────────────────────                                        ║
║  🔴 Critical:                 ___ (Fixed: ___)                               ║
║  🟠 High:                     ___ (Fixed: ___)                               ║
║  🟡 Medium:                   ___ (Fixed: ___)                               ║
║  🟢 Low:                      ___ (Fixed: ___)                               ║
║                                                                               ║
║  Open Defects:                ___                                            ║
║  Deferred Defects:            ___                                            ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                          KNOWN ISSUES/LIMITATIONS                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  1. [Describe any known issues that will remain in production]               ║
║  2. [...]                                                                     ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         UAT TESTER SIGN-OFF                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  I confirm that I have completed User Acceptance Testing and the system      ║
║  meets the business requirements for deployment to production.               ║
║                                                                               ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │ Role          │ Name             │ Signature        │ Date             │  ║
║  ├────────────────────────────────────────────────────────────────────────┤  ║
║  │ Admin Tester  │ ________________ │ ________________ │ ____________     │  ║
║  ├────────────────────────────────────────────────────────────────────────┤  ║
║  │ Operator      │ ________________ │ ________________ │ ____________     │  ║
║  │ Tester        │                  │                  │                  │  ║
║  ├────────────────────────────────────────────────────────────────────────┤  ║
║  │ Viewer Tester │ ________________ │ ________________ │ ____________     │  ║
║  ├────────────────────────────────────────────────────────────────────────┤  ║
║  │ Project       │ ________________ │ ________________ │ ____________     │  ║
║  │ Manager       │                  │                  │                  │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         DEPLOYMENT APPROVAL                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ☐ APPROVED FOR PRODUCTION DEPLOYMENT                                        ║
║                                                                               ║
║  ☐ NOT APPROVED - Requires resolution of:                                    ║
║    _____________________________________________________________________     ║
║                                                                               ║
║  Approved By:    ____________________    Date: ____________                  ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Appendix: UAT Test Mapping to User Stories

| UAT Test ID | User Story ID | Requirement ID | Priority |
|-------------|---------------|----------------|----------|
| UAT-1.1 | US-1.3 | FR-1.3 | High |
| UAT-1.2 | US-1.4 | FR-1.4 | High |
| UAT-1.3 | US-1.1, US-1.2 | FR-1.1, FR-1.2 | High |
| UAT-2.1 | US-2.1, US-2.3 | FR-3.1, FR-3.6 | High |
| UAT-2.2 | US-2.1 | FR-3.1 | High |
| UAT-2.3 | US-2.6 | FR-3.2 | Medium |
| UAT-2.4 | US-2.7 | FR-3.3 | Medium |
| UAT-2.5 | US-2.4 | FR-3.5 | High |
| UAT-3.1 | US-3.1 | FR-4.1 | High |
| UAT-3.2 | US-3.2 | FR-4.2 | Critical |
| UAT-4.1 | US-4.1, US-4.3, US-4.4 | FR-5.1-5.5 | High |
| UAT-4.2 | US-4.2 | FR-5.6 | High |
| UAT-5.1 | US-5.2 | FR-6.1 | High |
| UAT-5.2 | US-5.1, US-5.3 | FR-6.2, FR-6.3 | High |
| UAT-6.1 | US-6.1, US-6.3 | FR-9.1, FR-9.2 | Medium |
| UAT-7.1 | US-7.1, US-7.2 | FR-7.1-7.4 | High |
| UAT-8.1 | US-8.1, US-8.2 | FR-8.3 | High |

---

## Quick Reference: How to Perform UAT

### Step-by-Step Guide

1. **Prepare** (1-2 hours)
   - Start the test environment (`docker-compose up -d`)
   - Verify all services are running
   - Review test scenarios for your user role

2. **Execute** (2-4 hours per role)
   - Login with your test account
   - Follow test steps exactly as written
   - Mark each step Pass/Fail
   - Take screenshots of failures
   - Document any unexpected behavior

3. **Report** (30 min - 1 hour)
   - Create defect reports for failures
   - Prioritize by severity
   - Submit to development team

4. **Retest** (As needed)
   - Re-execute failed tests after fixes
   - Update test status

5. **Sign-Off** (30 min)
   - Review all results
   - Complete sign-off document
   - Obtain stakeholder approval

---

*Document Version: 1.0*  
*Last Updated: January 2026*  
*Based on: REQUIREMENTS.md, USE_CASE_DIAGRAM.md, USER_INTERFACE_DESIGN.md*
