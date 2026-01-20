# TonyPi Robot Monitoring System - Requirements Documentation

## Table of Contents
1. [User Personas](#user-personas)
2. [User Stories](#user-stories)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)

---

## User Personas

### Persona 1: System Administrator (Admin)

| Attribute | Description |
|-----------|-------------|
| **Name** | Ahmad - Lab Manager |
| **Role** | System Administrator |
| **Age** | 35 years old |
| **Technical Level** | High |
| **Background** | Computer Science graduate with 10+ years experience in robotics lab management |
| **Goals** | - Ensure system uptime and reliability<br>- Manage user accounts and access control<br>- Configure system settings and alert thresholds<br>- Generate comprehensive reports for stakeholders |
| **Pain Points** | - Managing multiple robots across different locations<br>- Ensuring security and access control<br>- Troubleshooting system-wide issues<br>- Generating reports for management |
| **Needs** | - Full system control and visibility<br>- User management capabilities<br>- System configuration tools<br>- Audit logs for compliance |
| **Tech Proficiency** | Expert in Docker, databases, networking, and system administration |
| **Frequency of Use** | Daily, 6-8 hours |

---

### Persona 2: Robot Operator (Operator)

| Attribute | Description |
|-----------|-------------|
| **Name** | Nurul - Robotics Engineer |
| **Role** | Robot Operator |
| **Age** | 28 years old |
| **Technical Level** | Medium-High |
| **Background** | Mechatronics Engineering graduate, 3 years experience working with TonyPi robots |
| **Goals** | - Monitor robot performance in real-time<br>- Execute commands and control robots remotely<br>- Respond quickly to alerts and issues<br>- Track job progress and completion |
| **Pain Points** | - Delayed awareness of robot issues<br>- Difficulty managing multiple robots simultaneously<br>- Lack of historical data for troubleshooting<br>- No centralized command interface |
| **Needs** | - Real-time monitoring dashboards<br>- Remote command execution<br>- Alert notifications<br>- Sensor and servo data visualization |
| **Tech Proficiency** | Comfortable with web interfaces, basic understanding of robotics systems |
| **Frequency of Use** | Daily, 4-6 hours |

---

### Persona 3: Research Viewer (Viewer)

| Attribute | Description |
|-----------|-------------|
| **Name** | Dr. Tan - Research Supervisor |
| **Role** | Viewer |
| **Age** | 45 years old |
| **Technical Level** | Low-Medium |
| **Background** | PhD in Computer Science, supervising robotics research projects |
| **Goals** | - Review robot performance data<br>- Access reports for research analysis<br>- Monitor student projects progress<br>- Present data to stakeholders |
| **Pain Points** | - Complex technical interfaces<br>- Difficulty extracting meaningful insights<br>- Time-consuming data gathering<br>- Need for presentation-ready reports |
| **Needs** | - Simple, intuitive dashboards<br>- Pre-generated reports<br>- Data export capabilities<br>- Visual data representation |
| **Tech Proficiency** | Basic web browsing, familiar with data analysis concepts |
| **Frequency of Use** | Weekly, 1-2 hours |

---

### Persona 4: Maintenance Technician (Operator)

| Attribute | Description |
|-----------|-------------|
| **Name** | Hafiz - Hardware Technician |
| **Role** | Operator (Limited) |
| **Age** | 32 years old |
| **Technical Level** | Medium |
| **Background** | Diploma in Electronics, specializes in robot hardware maintenance |
| **Goals** | - Monitor hardware health (servos, sensors, battery)<br>- Identify failing components before breakdown<br>- Schedule preventive maintenance<br>- Access hardware diagnostic data |
| **Pain Points** | - Unexpected hardware failures<br>- Lack of historical maintenance data<br>- Difficulty predicting component wear<br>- No centralized hardware status view |
| **Needs** | - Servo temperature and voltage monitoring<br>- Battery health tracking<br>- Hardware alert notifications<br>- Maintenance history logs |
| **Tech Proficiency** | Comfortable with hardware diagnostics, basic web interface usage |
| **Frequency of Use** | Daily, 2-4 hours |

---

## User Stories

### Epic 1: User Authentication & Authorization

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-1.1 | As an **Admin**, I want to create new user accounts so that team members can access the system | High | - Admin can create users with username, email, password<br>- Admin can assign roles (admin/operator/viewer)<br>- New users receive confirmation |
| US-1.2 | As an **Admin**, I want to manage user roles and permissions so that I can control system access | High | - Admin can view all users<br>- Admin can modify user roles<br>- Admin can deactivate/activate users |
| US-1.3 | As a **User**, I want to log in securely so that I can access the monitoring system | High | - Users can log in with username/password<br>- Invalid credentials show error<br>- Session persists across page refreshes |
| US-1.4 | As a **User**, I want to log out so that my session is securely terminated | High | - Logout button accessible from all pages<br>- Session is invalidated on logout<br>- User redirected to login page |
| US-1.5 | As an **Admin**, I want to view audit logs so that I can track system activities | Medium | - Logs show user actions with timestamps<br>- Logs are filterable by user, action, date<br>- Logs cannot be modified |

---

### Epic 2: Real-Time Robot Monitoring

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-2.1 | As an **Operator**, I want to view real-time CPU, memory, and disk usage so that I can monitor robot performance | High | - Displays CPU percentage with graph<br>- Displays memory usage (used/total)<br>- Displays disk usage percentage<br>- Updates every 5 seconds |
| US-2.2 | As an **Operator**, I want to view robot temperature so that I can prevent overheating | High | - Shows current CPU temperature<br>- Visual indicator for danger zones<br>- Historical temperature graph |
| US-2.3 | As a **Viewer**, I want to see robot online/offline status so that I know which robots are available | High | - Clear online/offline indicator<br>- Last seen timestamp for offline robots<br>- Automatic status updates |
| US-2.4 | As an **Operator**, I want to view live camera feed so that I can see what the robot sees | High | - Live MJPEG stream display<br>- Stream quality indicator<br>- Full-screen mode option |
| US-2.5 | As an **Operator**, I want to monitor battery level so that I can ensure robots don't run out of power | High | - Battery percentage display<br>- Low battery warning<br>- Battery history chart |
| US-2.6 | As an **Operator**, I want to view sensor data (IMU, light, ultrasonic) in real-time so that I can monitor robot environment | Medium | - Real-time sensor value display<br>- Interactive charts for each sensor<br>- Historical data view |
| US-2.7 | As a **Technician**, I want to monitor servo positions, temperatures, and voltages so that I can detect hardware issues | Medium | - Individual servo status cards<br>- Temperature warnings<br>- Voltage anomaly detection |

---

### Epic 3: Robot Control & Commands

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-3.1 | As an **Operator**, I want to send commands to robots so that I can control them remotely | High | - Command input interface<br>- Command confirmation feedback<br>- Command history log |
| US-3.2 | As an **Operator**, I want to execute emergency stop so that I can immediately halt robot operation | Critical | - Prominent emergency stop button<br>- One-click execution<br>- Confirmation of stop |
| US-3.3 | As an **Admin**, I want to configure robot settings so that I can customize robot behavior | Medium | - Configuration interface<br>- Save/apply settings<br>- Settings validation |
| US-3.4 | As an **Operator**, I want to view command execution status so that I know if commands succeeded | Medium | - Command status tracking (pending/success/failed)<br>- Error messages for failures<br>- Command execution timestamp |

---

### Epic 4: Alerts & Notifications

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-4.1 | As an **Operator**, I want to receive alerts when robot metrics exceed thresholds so that I can respond to issues | High | - Alert notifications appear in real-time<br>- Severity levels (info/warning/critical)<br>- Alert sound for critical issues |
| US-4.2 | As an **Admin**, I want to configure alert thresholds so that alerts match operational requirements | High | - Set warning/critical thresholds per metric<br>- Enable/disable specific alerts<br>- Robot-specific threshold override |
| US-4.3 | As an **Operator**, I want to acknowledge alerts so that team knows issues are being addressed | Medium | - Acknowledge button on alerts<br>- Timestamp and user recorded<br>- Acknowledged alerts visually distinct |
| US-4.4 | As an **Operator**, I want to resolve alerts so that I can mark issues as fixed | Medium | - Resolve button on acknowledged alerts<br>- Resolution timestamp recorded<br>- Resolved alerts archived |
| US-4.5 | As a **Viewer**, I want to view alert history so that I can analyze past incidents | Low | - Filterable alert history<br>- Date range selection<br>- Export capability |

---

### Epic 5: Reports & Analytics

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-5.1 | As a **Viewer**, I want to view pre-generated reports so that I can analyze robot performance | High | - List of available reports<br>- Report preview<br>- Date/robot filtering |
| US-5.2 | As an **Operator**, I want to generate performance reports so that I can document robot operations | High | - Report generation interface<br>- Custom date range selection<br>- Robot selection |
| US-5.3 | As a **Viewer**, I want to export reports as PDF so that I can share them with stakeholders | Medium | - PDF download button<br>- Properly formatted PDF<br>- Charts and data included |
| US-5.4 | As an **Admin**, I want AI-powered analytics so that I can get intelligent insights | Medium | - AI analysis button<br>- Natural language insights<br>- Recommendations displayed |
| US-5.5 | As a **Viewer**, I want to view Grafana dashboards so that I can see advanced visualizations | Low | - Embedded Grafana panels<br>- Dashboard navigation<br>- Time range selection |

---

### Epic 6: Job & Task Tracking

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-6.1 | As an **Operator**, I want to view active jobs so that I can monitor task progress | Medium | - Job list with status<br>- Progress percentage<br>- Start time and duration |
| US-6.2 | As an **Operator**, I want to schedule jobs so that robots can execute tasks automatically | Medium | - Job scheduling interface<br>- Recurring job support<br>- Parameter configuration |
| US-6.3 | As a **Viewer**, I want to view job history so that I can analyze completed tasks | Low | - Historical job list<br>- Success/failure status<br>- Job duration metrics |

---

### Epic 7: System Logs

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-7.1 | As an **Operator**, I want to view real-time system logs so that I can troubleshoot issues | High | - Live log streaming<br>- Log level filtering (info/warning/error/critical)<br>- Timestamp display |
| US-7.2 | As an **Operator**, I want to filter logs by robot so that I can focus on specific robots | Medium | - Robot filter dropdown<br>- Category filter<br>- Search functionality |
| US-7.3 | As an **Admin**, I want to export logs so that I can perform offline analysis | Low | - Export button<br>- Date range selection<br>- CSV/JSON format options |

---

### Epic 8: Multi-Robot Management

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-8.1 | As an **Admin**, I want to register new robots so that they can be monitored | High | - Robot registration form<br>- Unique robot ID assignment<br>- Connection instructions |
| US-8.2 | As an **Operator**, I want to view all robots in a grid layout so that I can monitor multiple robots | High | - Robot cards/tiles display<br>- Quick status overview<br>- Click to view details |
| US-8.3 | As an **Operator**, I want to view robot location so that I can track robot positions | Low | - Position coordinates display<br>- Map visualization (future)<br>- Location history |

---

## Functional Requirements

### FR-1: User Management

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-1.1 | User Registration | High | System shall allow administrators to create new user accounts with username, email, and password |
| FR-1.2 | Role-Based Access Control | High | System shall support three user roles: Admin, Operator, Viewer with different permission levels |
| FR-1.3 | User Authentication | High | System shall authenticate users via username and password with secure password hashing |
| FR-1.4 | Session Management | High | System shall maintain user sessions with JWT tokens and support session timeout |
| FR-1.5 | User Deactivation | Medium | System shall allow administrators to deactivate user accounts without deletion |
| FR-1.6 | Password Update | Medium | System shall allow users to change their own passwords |

### FR-2: Robot Data Collection

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-2.1 | MQTT Data Ingestion | High | System shall receive robot telemetry data via MQTT protocol on topics: `tonypi/status/{robot_id}`, `tonypi/sensors/{robot_id}`, `tonypi/servos/{robot_id}` |
| FR-2.2 | Time-Series Storage | High | System shall store sensor data in InfluxDB for time-series analysis |
| FR-2.3 | Relational Data Storage | High | System shall store robot metadata, users, reports, and logs in PostgreSQL |
| FR-2.4 | Real-Time Data Processing | High | System shall process incoming MQTT messages and update frontend within 5 seconds |
| FR-2.5 | Data Retention | Medium | System shall retain time-series data for configurable period (default: 30 days) |

### FR-3: Real-Time Monitoring

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-3.1 | System Metrics Display | High | System shall display CPU usage, memory usage, disk usage, and temperature in real-time |
| FR-3.2 | Sensor Data Visualization | High | System shall display IMU (accelerometer, gyroscope), light sensor, and ultrasonic sensor data with charts |
| FR-3.3 | Servo Monitoring | High | System shall display servo positions, temperatures, and voltages for all 6 servos |
| FR-3.4 | Battery Monitoring | High | System shall display battery percentage with low battery warnings |
| FR-3.5 | Camera Stream | High | System shall display live MJPEG camera stream from robots |
| FR-3.6 | Robot Status Indicator | High | System shall show online/offline status with last seen timestamp |
| FR-3.7 | Historical Data View | Medium | System shall allow users to view historical data for any metric |

### FR-4: Robot Control

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-4.1 | Command Transmission | High | System shall send commands to robots via MQTT on topic `tonypi/commands/{robot_id}` |
| FR-4.2 | Emergency Stop | Critical | System shall provide one-click emergency stop functionality for immediate robot halt |
| FR-4.3 | Configuration Management | Medium | System shall allow administrators to view and update robot configuration |
| FR-4.4 | Command History | Medium | System shall log all commands with timestamp, user, and execution status |

### FR-5: Alert System

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-5.1 | Threshold Monitoring | High | System shall monitor metrics against configured thresholds and generate alerts |
| FR-5.2 | Alert Severity Levels | High | System shall support info, warning, and critical severity levels |
| FR-5.3 | Real-Time Notifications | High | System shall display alert notifications in real-time via UI toast notifications |
| FR-5.4 | Alert Acknowledgment | Medium | System shall allow operators to acknowledge alerts with user and timestamp tracking |
| FR-5.5 | Alert Resolution | Medium | System shall allow operators to mark alerts as resolved |
| FR-5.6 | Threshold Configuration | Medium | System shall allow administrators to configure warning and critical thresholds per metric |
| FR-5.7 | Alert History | Low | System shall maintain searchable history of all alerts |

### FR-6: Reporting

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-6.1 | Report Generation | High | System shall generate performance reports with metrics summary and visualizations |
| FR-6.2 | Report Storage | High | System shall store generated reports in database with metadata |
| FR-6.3 | PDF Export | Medium | System shall export reports as downloadable PDF documents |
| FR-6.4 | AI Analytics | Medium | System shall integrate with Google Gemini API for AI-powered insights and recommendations |
| FR-6.5 | Custom Date Range | Medium | System shall allow report generation for custom date ranges |
| FR-6.6 | Report Filtering | Low | System shall allow filtering reports by robot, type, and date |

### FR-7: System Logging

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-7.1 | Log Collection | High | System shall collect logs from robots and system components |
| FR-7.2 | Log Categorization | High | System shall categorize logs by level (info, warning, error, critical) and source |
| FR-7.3 | Real-Time Log Streaming | High | System shall display logs in real-time with auto-scroll |
| FR-7.4 | Log Filtering | Medium | System shall support filtering by level, robot, category, and search text |
| FR-7.5 | Log Export | Low | System shall export logs in CSV or JSON format |

### FR-8: Dashboard & Visualization

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-8.1 | Overview Dashboard | High | System shall provide dashboard with robot count, status summary, and key metrics |
| FR-8.2 | Grafana Integration | Medium | System shall embed Grafana dashboards for advanced visualization |
| FR-8.3 | Multi-Robot Grid | High | System shall display multiple robots in grid layout with quick status overview |
| FR-8.4 | Responsive Design | High | System shall be responsive and usable on desktop and tablet devices |

### FR-9: Job Management

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-9.1 | Job Listing | Medium | System shall display list of active and completed jobs |
| FR-9.2 | Job Status Tracking | Medium | System shall track job status (pending, running, completed, failed) |
| FR-9.3 | Job Scheduling | Low | System shall support scheduling jobs with start time and recurrence |

---

## Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement | Target | Description |
|----|-------------|--------|-------------|
| NFR-1.1 | API Response Time | < 500ms | 95% of API requests shall complete within 500 milliseconds |
| NFR-1.2 | Real-Time Latency | < 5 seconds | Telemetry data shall be displayed within 5 seconds of transmission |
| NFR-1.3 | Dashboard Load Time | < 3 seconds | Dashboard pages shall load within 3 seconds on standard broadband |
| NFR-1.4 | Concurrent Users | 50 users | System shall support at least 50 concurrent users without degradation |
| NFR-1.5 | Data Ingestion Rate | 100 msg/sec | System shall handle at least 100 MQTT messages per second |
| NFR-1.6 | Camera Stream | 30 FPS | Camera stream shall maintain 30 frames per second on local network |

### NFR-2: Scalability

| ID | Requirement | Target | Description |
|----|-------------|--------|-------------|
| NFR-2.1 | Robot Capacity | 10 robots | System shall support monitoring of at least 10 robots simultaneously |
| NFR-2.2 | Data Storage | 1 year | System shall store at least 1 year of time-series data per robot |
| NFR-2.3 | Horizontal Scaling | Containerized | System shall be containerized with Docker for easy horizontal scaling |

### NFR-3: Reliability & Availability

| ID | Requirement | Target | Description |
|----|-------------|--------|-------------|
| NFR-3.1 | System Uptime | 99% | System shall maintain 99% uptime during operational hours |
| NFR-3.2 | Data Persistence | No data loss | System shall ensure no data loss during service restarts |
| NFR-3.3 | Service Recovery | < 5 minutes | System shall recover from service failures within 5 minutes |
| NFR-3.4 | Health Checks | Automatic | System shall perform automatic health checks on all services |
| NFR-3.5 | Graceful Degradation | Partial functionality | System shall maintain core monitoring if AI analytics service is unavailable |

### NFR-4: Security

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-4.1 | Password Hashing | User passwords shall be hashed using bcrypt with appropriate salt rounds |
| NFR-4.2 | Authentication Tokens | System shall use JWT tokens for API authentication with expiration |
| NFR-4.3 | Role-Based Access | System shall enforce role-based access control on all endpoints |
| NFR-4.4 | Input Validation | System shall validate all user inputs to prevent injection attacks |
| NFR-4.5 | HTTPS Support | System shall support HTTPS for encrypted communication (production) |
| NFR-4.6 | Environment Variables | Sensitive credentials shall be stored in environment variables, not code |
| NFR-4.7 | CORS Policy | System shall implement appropriate CORS policies for API access |

### NFR-5: Usability

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-5.1 | Intuitive Navigation | System shall provide clear navigation with labeled menu items and breadcrumbs |
| NFR-5.2 | Visual Feedback | System shall provide visual feedback for all user actions (loading, success, error) |
| NFR-5.3 | Error Messages | System shall display user-friendly error messages with suggested actions |
| NFR-5.4 | Accessibility | System shall follow basic accessibility guidelines (color contrast, keyboard navigation) |
| NFR-5.5 | Dark Mode | System shall support dark mode theme for reduced eye strain |
| NFR-5.6 | Consistent UI | System shall maintain consistent UI patterns across all pages |

### NFR-6: Maintainability

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-6.1 | Code Documentation | Code shall include inline comments and function documentation |
| NFR-6.2 | Modular Architecture | System shall follow modular architecture with separation of concerns |
| NFR-6.3 | Configuration Files | System configuration shall be externalized in environment files |
| NFR-6.4 | Logging Standards | System shall implement consistent logging format across all services |
| NFR-6.5 | API Documentation | REST API shall be documented with Swagger/OpenAPI specification |
| NFR-6.6 | Version Control | All code shall be maintained in Git with meaningful commit messages |

### NFR-7: Compatibility

| ID | Requirement | Target | Description |
|----|-------------|--------|-------------|
| NFR-7.1 | Browser Support | Chrome, Firefox, Edge | System shall support latest versions of Chrome, Firefox, and Edge |
| NFR-7.2 | Screen Resolution | 1280x720+ | System shall be usable on screens 1280x720 pixels and above |
| NFR-7.3 | Docker Compatibility | Docker 20.10+ | System shall run on Docker version 20.10 and above |
| NFR-7.4 | Python Version | Python 3.8+ | Backend shall be compatible with Python 3.8 and above |
| NFR-7.5 | Node.js Version | Node.js 16+ | Frontend shall be compatible with Node.js 16 and above |

### NFR-8: Deployment & Operations

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-8.1 | Docker Compose | System shall be deployable using single docker-compose command |
| NFR-8.2 | Environment Setup | System shall provide example environment file for quick setup |
| NFR-8.3 | Service Dependencies | Docker Compose shall manage service startup order and dependencies |
| NFR-8.4 | Volume Persistence | Data shall persist across container restarts using Docker volumes |
| NFR-8.5 | Log Access | Container logs shall be accessible via docker-compose logs |

---

## Requirements Traceability Matrix

| User Story | Functional Requirements | Non-Functional Requirements |
|------------|------------------------|----------------------------|
| US-1.1, US-1.2 | FR-1.1, FR-1.2 | NFR-4.1, NFR-4.3 |
| US-1.3, US-1.4 | FR-1.3, FR-1.4 | NFR-4.2, NFR-4.5 |
| US-2.1, US-2.2 | FR-3.1 | NFR-1.2, NFR-1.3 |
| US-2.3 | FR-3.6 | NFR-1.2 |
| US-2.4 | FR-3.5 | NFR-1.6 |
| US-2.5 | FR-3.4 | NFR-1.2 |
| US-2.6 | FR-3.2, FR-3.7 | NFR-1.2, NFR-2.2 |
| US-2.7 | FR-3.3 | NFR-1.2 |
| US-3.1, US-3.2 | FR-4.1, FR-4.2 | NFR-1.2, NFR-3.1 |
| US-3.3, US-3.4 | FR-4.3, FR-4.4 | NFR-4.3 |
| US-4.1, US-4.2 | FR-5.1, FR-5.2, FR-5.6 | NFR-1.2, NFR-5.2 |
| US-4.3, US-4.4 | FR-5.4, FR-5.5 | NFR-4.3 |
| US-5.1, US-5.2 | FR-6.1, FR-6.2 | NFR-1.1 |
| US-5.3 | FR-6.3 | NFR-5.2 |
| US-5.4 | FR-6.4 | NFR-3.5 |
| US-7.1, US-7.2 | FR-7.1, FR-7.2, FR-7.4 | NFR-1.2 |
| US-8.1, US-8.2 | FR-8.3 | NFR-2.1, NFR-5.1 |

---

## Document Information

| Attribute | Value |
|-----------|-------|
| **Project** | TonyPi Robot Monitoring System |
| **Version** | 1.0 |
| **Last Updated** | January 2026 |
| **Status** | Active |
