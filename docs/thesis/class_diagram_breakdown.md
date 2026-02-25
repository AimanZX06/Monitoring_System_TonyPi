# Class Diagram Component Breakdown (Thesis Format)

This document provides a detailed breakdown of each class component in the TonyPi Robot Monitoring System class diagrams using the Classification, Definition, Responsibilities, and Constraints (CDRC) format for thesis documentation.

---

## 1. Frontend Components Class Diagram

**Diagram Name:** TonyPi Robot Monitoring System - Frontend Components (React + TypeScript)

This class diagram illustrates the frontend architecture of the monitoring system, built using React with TypeScript. It shows the component hierarchy, context providers, utility services, and TypeScript interfaces that define the data structures.

---

### 1.1 Application Entry Components

---

#### 1.1.1 App Class

**a. Classification**  
The App class contains one operation for rendering the main application entry point.

**b. Definition**  
The App class serves as the root React component that initializes the application, wraps child components with context providers, and sets up the routing configuration.

**c. Responsibilities**  
The App class is responsible for:
- Rendering the root JSX element of the application using render().
- Providing authentication context (AuthContext) to all child components.
- Providing theme context (ThemeContext) for light/dark mode switching.
- Providing notification context (NotificationContext) for toast messages.
- Configuring routes to all page components (Dashboard, Monitoring, Robots, etc.).

**d. Constraints**  
- Must be the single entry point wrapped by ReactDOM.render().
- All context providers must be initialized before child components can access them.
- Routing configuration must match the defined page components.

---

#### 1.1.2 TonyPiApp Class

**a. Classification**  
The TonyPiApp class contains one attribute and two operations for tab-based navigation management.

**b. Definition**  
The TonyPiApp class manages the active navigation tab state and provides the main application layout with tab switching functionality.

**c. Responsibilities**  
The TonyPiApp class is responsible for:
- Tracking the currently active tab using the activeTab attribute.
- Switching between different sections using setActiveTab(tab).
- Rendering the main application layout with navigation tabs.

**d. Constraints**  
- activeTab must be a valid tab identifier recognized by the navigation system.
- Tab state should persist across page refreshes if required.

---

### 1.2 Context Providers

---

#### 1.2.1 AuthContext Class

**a. Classification**  
The AuthContext class contains four attributes and three operations for user authentication state management.

**b. Definition**  
The AuthContext class provides global authentication state to all components, managing user login sessions, JWT tokens, and authentication status.

**c. Responsibilities**  
The AuthContext class is responsible for:
- Storing the current authenticated user object in the user attribute.
- Tracking authentication status using isAuthenticated boolean.
- Managing JWT token storage in the token attribute for API requests.
- Handling user login through login(username, password) which returns a Promise.
- Handling user logout and clearing session data using logout().
- Supporting new user registration through register(userData) method.
- Managing loading state during authentication operations.

**d. Constraints**  
- JWT token must be stored securely in localStorage to persist across sessions.
- Token expiration must be handled to prevent unauthorized API calls.
- All protected routes must check isAuthenticated before rendering.
- login() and register() operations are asynchronous and may fail on network errors.

---

#### 1.2.2 ThemeContext Class

**a. Classification**  
The ThemeContext class contains two attributes and one operation for theme management.

**b. Definition**  
The ThemeContext class provides global theme state allowing users to switch between light and dark modes throughout the application.

**c. Responsibilities**  
The ThemeContext class is responsible for:
- Storing the current theme mode ("light" or "dark") in the theme attribute.
- Providing quick read access to dark mode status through isDark boolean.
- Toggling between light and dark themes using toggleTheme().

**d. Constraints**  
- Theme preference should persist in localStorage to survive page refreshes.
- All UI components must properly respond to theme changes.
- Theme toggle must update all styled components immediately.

---

#### 1.2.3 NotificationContext Class

**a. Classification**  
The NotificationContext class contains one attribute and three operations for notification management.

**b. Definition**  
The NotificationContext class provides a centralized notification system for displaying toast messages and managing notification queues.

**c. Responsibilities**  
The NotificationContext class is responsible for:
- Maintaining an array of active notifications in the notifications attribute.
- Adding new notifications to the queue using addNotification(notification).
- Removing dismissed notifications using removeNotification(id).
- Displaying toast messages with type indicators using showToast(message, type).

**d. Constraints**  
- Notifications should auto-dismiss after a configured timeout.
- Multiple notifications must be queued and displayed sequentially.
- Notification types must be one of: success, error, info, or warning.

---

### 1.3 Page Components

---

#### 1.3.1 Dashboard Class

**a. Classification**  
The Dashboard class contains three attributes and one operation for displaying the main monitoring dashboard.

**b. Definition**  
The Dashboard class presents an overview of all robots' statuses, system statistics, and recent alerts in a unified dashboard view.

**c. Responsibilities**  
The Dashboard class is responsible for:
- Displaying robot status summaries using robotStatuses array.
- Showing system-wide statistics through systemStats object.
- Presenting recent alerts for quick visibility in recentAlerts array.
- Rendering the dashboard layout with status cards and charts.
- Calling API service to fetch dashboard data.
- Subscribing to MQTTService for real-time status updates.

**d. Constraints**  
- Must use the Layout component for consistent page structure.
- Data must refresh periodically or update via MQTT subscriptions.
- Uses RobotInterface to type robot status data.

---

#### 1.3.2 Monitoring Class

**a. Classification**  
The Monitoring class contains four attributes and one operation for performance monitoring display.

**b. Definition**  
The Monitoring class displays detailed performance metrics and historical data trends for system resources including CPU, memory, and temperature.

**c. Responsibilities**  
The Monitoring class is responsible for:
- Displaying current performance data using performanceData object.
- Showing CPU usage history trends through cpuHistory array.
- Displaying memory utilization over time in memoryHistory array.
- Showing temperature readings history using tempHistory array.
- Rendering performance charts and Grafana panels.

**d. Constraints**  
- Uses GrafanaPanel component for embedded metric visualizations.
- History arrays must maintain fixed-size windows to prevent memory issues.
- API calls are required for fetching historical performance data.

---

#### 1.3.3 Robots Class

**a. Classification**  
The Robots class contains three attributes and two operations for robot management and control.

**b. Definition**  
The Robots class provides a comprehensive view of all robots in the system, with individual robot selection, camera feed display, and command execution capabilities.

**c. Responsibilities**  
The Robots class is responsible for:
- Displaying all registered robots using the robots array.
- Tracking currently selected robot through selectedRobot attribute.
- Managing camera video feeds for each robot in cameraFeeds object.
- Sending control commands to robots using sendCommand(robotId, command).
- Embedding SSHTerminal component for direct robot access.

**d. Constraints**  
- Uses RobotInterface for typing robot data.
- SSHTerminal requires WebSocket connection to backend SSH proxy.
- Commands sent must be validated before execution.
- Camera feeds require proper CORS configuration on robot camera servers.

---

#### 1.3.4 Sensors Class

**a. Classification**  
The Sensors class contains four attributes and one operation for sensor data visualization.

**b. Definition**  
The Sensors class displays all sensor readings from the robots including IMU data, light levels, and distance measurements in real-time.

**c. Responsibilities**  
The Sensors class is responsible for:
- Displaying comprehensive sensor readings through sensorData object.
- Showing IMU (accelerometer and gyroscope) data using imuData attribute.
- Displaying ambient light level reading in lightLevel attribute.
- Showing distance sensor readings through distance attribute.
- Rendering sensor data visualizations and Grafana panels.
- Subscribing to MQTT for real-time sensor updates.

**d. Constraints**  
- Uses SensorDataInterface for typing sensor data structures.
- MQTTService subscription required for live sensor updates.
- GrafanaPanel components used for metric visualization.
- Sensor values must be validated before display.

---

#### 1.3.5 Servos Class

**a. Classification**  
The Servos class contains one attribute and one operation for servo motor status display.

**b. Definition**  
The Servos class displays the status of all servo motors on the robots, including position, temperature, and voltage readings.

**c. Responsibilities**  
The Servos class is responsible for:
- Displaying servo status for all motors using servoData array.
- Rendering servo position, temperature, and voltage information.
- Subscribing to MQTT for real-time servo data updates.

**d. Constraints**  
- Uses ServoDataInterface for typing servo data structures.
- MQTTService subscription required for live updates.
- All servo IDs must be valid and map to physical servos.

---

#### 1.3.6 Jobs Class

**a. Classification**  
The Jobs class contains three attributes and two operations for job management.

**b. Definition**  
The Jobs class manages and displays robot tasks/jobs, showing their progress, status, and providing filtering capabilities.

**c. Responsibilities**  
The Jobs class is responsible for:
- Displaying all jobs in the system using jobs array.
- Tracking the currently active/running job through activeJob attribute.
- Managing job filter criteria using filters object.
- Updating filter settings through setFilters(filters) method.
- Subscribing to MQTT for job progress updates.

**d. Constraints**  
- Uses JobInterface for typing job data.
- MQTTService subscription required for job event updates.
- Filter changes must trigger data refresh.

---

#### 1.3.7 Alerts Class

**a. Classification**  
The Alerts class contains three attributes and four operations for alert management.

**b. Definition**  
The Alerts class provides comprehensive alert management including viewing, acknowledging, resolving alerts, and configuring alert thresholds.

**c. Responsibilities**  
The Alerts class is responsible for:
- Displaying all system alerts using alerts array.
- Managing alert threshold configurations through thresholds array.
- Filtering alerts based on criteria in filters object.
- Acknowledging alerts using acknowledgeAlert(id) method.
- Resolving alerts using resolveAlert(id) method.
- Updating alert thresholds using updateThreshold(id, data) method.

**d. Constraints**  
- Uses AlertInterface for typing alert data.
- API calls required for all alert operations.
- acknowledgeAlert(), resolveAlert(), and updateThreshold() return Promises.
- Threshold updates require admin privileges.

---

#### 1.3.8 Logs Class

**a. Classification**  
The Logs class contains three attributes and two operations for system log viewing.

**b. Definition**  
The Logs class displays system logs with filtering and pagination capabilities for reviewing historical events and debugging.

**c. Responsibilities**  
The Logs class is responsible for:
- Displaying system logs using logs array.
- Managing filter criteria through filters object.
- Handling pagination state using pagination object.
- Updating log filters using setFilters(filters) method.

**d. Constraints**  
- Large log datasets require server-side pagination.
- Filter changes must reset pagination to first page.
- Uses Layout component for consistent page structure.

---

#### 1.3.9 Reports Class

**a. Classification**  
The Reports class contains two attributes and three operations for report generation and management.

**b. Definition**  
The Reports class handles report generation, viewing, and PDF export functionality for various system reports.

**c. Responsibilities**  
The Reports class is responsible for:
- Displaying existing reports through reports array.
- Tracking report generation status using generating boolean.
- Creating new reports using generateReport(type, params) method.
- Exporting reports to PDF format using exportPDF(reportId) method.

**d. Constraints**  
- generateReport() and exportPDF() are asynchronous operations.
- Report generation may take significant time depending on data volume.
- PDF export requires backend processing.
- API calls required for all report operations.

---

#### 1.3.10 Users Class

**a. Classification**  
The Users class contains two attributes and four operations for user management.

**b. Definition**  
The Users class provides administrative functions for managing system users including creation, updating, and deletion.

**c. Responsibilities**  
The Users class is responsible for:
- Displaying all system users through users array.
- Tracking the selected user for editing via selectedUser attribute.
- Creating new users using createUser(userData) method.
- Updating user information using updateUser(userId, data) method.
- Deleting users using deleteUser(userId) method.

**d. Constraints**  
- All user operations require admin authentication.
- Uses UserInterface for typing user data.
- API calls required for all CRUD operations.
- User role must be one of: admin, operator, or viewer.

---

#### 1.3.11 Login Class

**a. Classification**  
The Login class contains four attributes and two operations for user authentication.

**b. Definition**  
The Login class provides the user interface for authentication, handling username/password input and login form submission.

**c. Responsibilities**  
The Login class is responsible for:
- Capturing username input in username attribute.
- Capturing password input in password attribute.
- Displaying authentication errors through error attribute.
- Managing form submission state using loading boolean.
- Processing login requests using handleLogin() method.

**d. Constraints**  
- Password must not be displayed in plain text.
- Loading state must prevent duplicate submissions.
- Error messages must be user-friendly without exposing security details.
- API calls to UsersRouter for authentication.

---

### 1.4 Shared Components

---

#### 1.4.1 Layout Class

**a. Classification**  
The Layout class contains two attributes and one operation for page layout structure.

**b. Definition**  
The Layout class provides a consistent page layout wrapper including navigation, header, and content area for all page components.

**c. Responsibilities**  
The Layout class is responsible for:
- Wrapping page content passed through children ReactNode.
- Setting page title through title attribute.
- Providing consistent navigation menu and header.
- Rendering the structured layout for all pages.

**d. Constraints**  
- Used by all page components (Dashboard, Monitoring, Robots, etc.).
- Must be responsive across different screen sizes.
- Navigation must reflect current authentication state.

---

#### 1.4.2 SSHTerminal Class

**a. Classification**  
The SSHTerminal class contains three attributes and three operations for terminal emulation.

**b. Definition**  
The SSHTerminal class provides an embedded terminal for direct SSH access to robots through a WebSocket connection to the backend SSH proxy.

**c. Responsibilities**  
The SSHTerminal class is responsible for:
- Identifying the target robot using robotId attribute.
- Managing WebSocket connection through connection attribute.
- Rendering terminal interface using terminal (xterm.js) instance.
- Establishing connection to the robot using connect() method.
- Closing connection and cleaning up using disconnect() method.

**d. Constraints**  
- Uses xterm.js for terminal emulation.
- Requires WebSocket connection to backend SSH proxy.
- Robot must be online and accessible for connection.
- Used by Robots page component.

---

#### 1.4.3 GrafanaPanel Class

**a. Classification**  
The GrafanaPanel class contains three attributes and one operation for embedding Grafana visualizations.

**b. Definition**  
The GrafanaPanel class embeds Grafana dashboard panels into the React application for displaying metrics and time-series data.

**c. Responsibilities**  
The GrafanaPanel class is responsible for:
- Identifying the specific panel using panelId attribute.
- Referencing the parent dashboard through dashboardId attribute.
- Configuring displayed time range using timeRange attribute.
- Rendering the embedded Grafana iframe/panel.

**d. Constraints**  
- Used by Sensors and Monitoring page components.
- Grafana must be accessible from the browser.
- Panel and dashboard IDs must be valid in Grafana.
- CORS must be configured for Grafana embedding.

---

#### 1.4.4 Toast Class

**a. Classification**  
The Toast class contains four attributes and two operations for notification display.

**b. Definition**  
The Toast class displays temporary notification messages to users with different severity types and auto-dismiss functionality.

**c. Responsibilities**  
The Toast class is responsible for:
- Displaying notification content through message attribute.
- Indicating severity level using type attribute (success, error, info, warning).
- Controlling visibility through visible boolean.
- Handling dismissal through onClose() callback.

**d. Constraints**  
- Must auto-dismiss after configured timeout.
- Type determines styling/icon displayed.
- Multiple toasts must be stacked appropriately.

---

### 1.5 TypeScript Interfaces

---

#### 1.5.1 RobotInterface

**a. Classification**  
The RobotInterface contains nine properties defining the robot data structure.

**b. Definition**  
The RobotInterface defines the TypeScript type for robot entities including identification, status, network, and location information.

**c. Responsibilities**  
The RobotInterface is responsible for:
- Defining robot identification through id, robot_id, and name.
- Defining robot status as "online", "offline", or "error".
- Defining network configuration through ip_address and camera_url.
- Defining physical location using location object.
- Defining connectivity tracking through last_seen timestamp.
- Defining active state using is_active boolean.

**d. Constraints**  
- status must be one of the defined string literal types.
- Used by Dashboard and Robots page components.
- robot_id must be unique across all robots.

---

#### 1.5.2 AlertInterface

**a. Classification**  
The AlertInterface contains ten properties defining the alert data structure.

**b. Definition**  
The AlertInterface defines the TypeScript type for system alerts including identification, categorization, and resolution status.

**c. Responsibilities**  
The AlertInterface is responsible for:
- Defining alert identification through id and robot_id.
- Defining alert categorization using alert_type and severity.
- Defining alert content through title and message.
- Defining alert status using acknowledged and resolved booleans.
- Defining timestamp using created_at.

**d. Constraints**  
- severity must be "critical", "warning", or "info".
- Used by Alerts page component.
- Alert processing order may depend on severity level.

---

#### 1.5.3 JobInterface

**a. Classification**  
The JobInterface contains eight properties defining the job data structure.

**b. Definition**  
The JobInterface defines the TypeScript type for robot tasks/jobs including identification, progress tracking, and status information.

**c. Responsibilities**  
The JobInterface is responsible for:
- Defining job identification through id and robot_id.
- Defining task information using task_name and phase.
- Defining job status as "active", "completed", or "cancelled".
- Defining progress tracking through percent_complete, items_done, and items_total.

**d. Constraints**  
- status must be one of the defined string literal types.
- percent_complete must be between 0 and 100.
- items_done must not exceed items_total.
- Used by Jobs page component.

---

#### 1.5.4 SensorDataInterface

**a. Classification**  
The SensorDataInterface contains nine properties defining the sensor data structure.

**b. Definition**  
The SensorDataInterface defines the TypeScript type for robot sensor readings including IMU, environmental, and distance measurements.

**c. Responsibilities**  
The SensorDataInterface is responsible for:
- Defining accelerometer readings through accel_x, accel_y, accel_z.
- Defining gyroscope readings through gyro_x, gyro_y, gyro_z.
- Defining temperature reading in temperature.
- Defining ambient light reading in light_level.
- Defining distance sensor reading in distance.

**d. Constraints**  
- All numeric values must be within valid sensor ranges.
- Used by Sensors page component.
- Values are typically floating-point numbers.

---

#### 1.5.5 ServoDataInterface

**a. Classification**  
The ServoDataInterface contains five properties defining the servo motor data structure.

**b. Definition**  
The ServoDataInterface defines the TypeScript type for individual servo motor readings including identification and health metrics.

**c. Responsibilities**  
The ServoDataInterface is responsible for:
- Defining servo identification through servo_id and name.
- Defining current position using position.
- Defining health metrics through temperature and voltage.

**d. Constraints**  
- servo_id must map to a valid physical servo on the robot.
- position must be within servo's valid range.
- temperature and voltage indicate servo health status.
- Used by Servos page component.

---

#### 1.5.6 UserInterface

**a. Classification**  
The UserInterface contains five properties defining the user data structure.

**b. Definition**  
The UserInterface defines the TypeScript type for system users including identification, credentials, and authorization level.

**c. Responsibilities**  
The UserInterface is responsible for:
- Defining user identification through id, username, and email.
- Defining authorization level using role attribute.
- Defining account status using is_active boolean.

**d. Constraints**  
- role must be "admin", "operator", or "viewer".
- username and email must be unique.
- Used by Users page component.
- Role determines accessible features and operations.

---

### 1.6 Utility Classes

---

#### 1.6.1 API Class

**a. Classification**  
The API class contains two attributes and five operations for HTTP communication.

**b. Definition**  
The API class provides a centralized HTTP client wrapper using Axios for making authenticated API requests to the backend server.

**c. Responsibilities**  
The API class is responsible for:
- Storing backend base URL in baseURL attribute.
- Managing Axios instance configuration through axios attribute.
- Making GET requests using get(url, params) method.
- Making POST requests using post(url, data) method.
- Making PUT requests using put(url, data) method.
- Making DELETE requests using delete(url) method.
- Attaching authentication tokens using setAuthToken(token) method.

**d. Constraints**  
- Axios-based HTTP client with automatic token injection.
- Base URL configured from environment variables.
- All methods return Promises.
- Used by all page components for backend communication.
- Authentication token must be set before accessing protected endpoints.

---

#### 1.6.2 MQTTService Class

**a. Classification**  
The MQTTService class contains two attributes and five operations for real-time messaging.

**b. Definition**  
The MQTTService class provides MQTT client functionality for subscribing to real-time robot data updates and publishing commands.

**c. Responsibilities**  
The MQTTService class is responsible for:
- Managing MQTT client connection through client attribute.
- Tracking connection status using connected boolean.
- Establishing connection using connect(brokerUrl) method.
- Closing connection using disconnect() method.
- Subscribing to topics using subscribe(topic, callback) method.
- Removing subscriptions using unsubscribe(topic) method.
- Publishing messages using publish(topic, message) method.

**d. Constraints**  
- Requires accessible MQTT broker.
- Used by Dashboard, Sensors, Servos, and Jobs components.
- Connection must be established before subscribe/publish operations.
- Topic patterns must match backend publishing structure.

---

---

## 2. Backend Architecture Class Diagram

**Diagram Name:** TonyPi Robot Monitoring System - Backend Architecture (FastAPI)

This class diagram illustrates the backend server architecture built using FastAPI framework. It shows the API routers, database clients, MQTT integration, and business services that power the monitoring system.

---

### 2.1 Core Application

---

#### 2.1.1 FastAPIApp Class

**a. Classification**  
The FastAPIApp class contains four attributes and operations for application configuration.

**b. Definition**  
The FastAPIApp class represents the main FastAPI application instance that configures middleware, includes routers, and manages application lifecycle.

**c. Responsibilities**  
The FastAPIApp class is responsible for:
- Defining application metadata through title and version attributes.
- Managing application lifecycle using lifespan(app) context manager.
- Registering API routers using include_router(router) method.
- Configuring middleware using add_middleware(middleware) method.
- Including all API routers (RobotData, Alerts, Management, Users, Reports, Logs, Jobs, SSH, RobotsDB).
- Starting MQTTClient on application startup.

**d. Constraints**  
- All routers must be registered before application startup.
- Lifespan manager must properly start/stop MQTTClient.
- Middleware order affects request processing.
- CORS middleware must be configured for frontend access.

---

### 2.2 API Routers

---

#### 2.2.1 RobotDataRouter Class

**a. Classification**  
The RobotDataRouter class contains five endpoints for robot telemetry data access.

**b. Definition**  
The RobotDataRouter class provides REST API endpoints for retrieving real-time and historical robot sensor data and status information.

**c. Responsibilities**  
The RobotDataRouter class is responsible for:
- Retrieving current robot status via GET /status endpoint.
- Retrieving sensor readings via GET /sensors endpoint.
- Retrieving servo data via GET /servos endpoint.
- Retrieving battery information via GET /battery endpoint.
- Retrieving historical data via GET /history/{measurement} endpoint.

**d. Constraints**  
- Queries InfluxDBClient for time-series data.
- Measurement parameter must be valid InfluxDB measurement name.
- Authentication may be required for data access.

---

#### 2.2.2 AlertsRouter Class

**a. Classification**  
The AlertsRouter class contains six endpoints for alert management.

**b. Definition**  
The AlertsRouter class provides REST API endpoints for creating, viewing, and managing system alerts and alert threshold configurations.

**c. Responsibilities**  
The AlertsRouter class is responsible for:
- Listing all alerts via GET /alerts endpoint.
- Creating new alerts via POST /alerts endpoint.
- Acknowledging alerts via PUT /alerts/{id}/acknowledge endpoint.
- Resolving alerts via PUT /alerts/{id}/resolve endpoint.
- Listing thresholds via GET /thresholds endpoint.
- Updating thresholds via PUT /thresholds/{id} endpoint.

**d. Constraints**  
- Uses Database (PostgreSQL) for alert storage.
- Alert IDs must be valid for acknowledge/resolve operations.
- Threshold updates may require admin privileges.

---

#### 2.2.3 ManagementRouter Class

**a. Classification**  
The ManagementRouter class contains four endpoints for robot control and system management.

**b. Definition**  
The ManagementRouter class provides REST API endpoints for sending commands to robots, emergency operations, and system status monitoring.

**c. Responsibilities**  
The ManagementRouter class is responsible for:
- Sending commands to robots via POST /command endpoint.
- Executing emergency stop via POST /robots/{id}/emergency-stop endpoint.
- Resuming robot operation via POST /robots/{id}/resume endpoint.
- Retrieving system status via GET /system/status endpoint.

**d. Constraints**  
- Publishes commands to MQTTClient.
- Emergency stop must be immediately effective.
- Robot must be online to receive commands.
- Authentication required for control operations.

---

#### 2.2.4 UsersRouter Class

**a. Classification**  
The UsersRouter class contains six endpoints for user authentication and management.

**b. Definition**  
The UsersRouter class provides REST API endpoints for user authentication, registration, and CRUD operations on user accounts.

**c. Responsibilities**  
The UsersRouter class is responsible for:
- Authenticating users via POST /login endpoint.
- Registering new users via POST /register endpoint.
- Listing all users via GET /users endpoint.
- Updating user information via PUT /users/{id} endpoint.
- Deleting users via DELETE /users/{id} endpoint.
- Verifying JWT tokens via POST /verify-token endpoint.

**d. Constraints**  
- Uses Database (PostgreSQL) for user storage.
- Password hashing required before storage.
- JWT tokens used for authentication.
- Admin privileges required for user management operations.

---

#### 2.2.5 ReportsRouter Class

**a. Classification**  
The ReportsRouter class contains six endpoints for report generation and retrieval.

**b. Definition**  
The ReportsRouter class provides REST API endpoints for generating, viewing, and exporting various system reports with optional AI-powered analytics.

**c. Responsibilities**  
The ReportsRouter class is responsible for:
- Listing existing reports via GET /reports endpoint.
- Creating generic reports via POST /reports endpoint.
- Generating performance reports via POST /reports/performance endpoint.
- Generating job reports via POST /reports/job endpoint.
- Generating maintenance reports via POST /reports/maintenance endpoint.
- Exporting reports as PDF via GET /reports/{id}/pdf endpoint.

**d. Constraints**  
- Uses Database for report metadata storage.
- Queries InfluxDBClient for performance data.
- Uses GeminiAnalyticsService for AI-powered insights (optional).
- PDF generation is a resource-intensive operation.

---

#### 2.2.6 LogsRouter Class

**a. Classification**  
The LogsRouter class contains two endpoints for system log management.

**b. Definition**  
The LogsRouter class provides REST API endpoints for viewing and creating system logs.

**c. Responsibilities**  
The LogsRouter class is responsible for:
- Retrieving system logs via GET /logs endpoint.
- Creating new log entries via POST /logs endpoint.

**d. Constraints**  
- Uses Database (PostgreSQL) for log storage.
- Pagination required for large log datasets.
- Log retention policies may apply.

---

#### 2.2.7 JobsRouter Class

**a. Classification**  
The JobsRouter class contains three endpoints for job tracking and management.

**b. Definition**  
The JobsRouter class provides REST API endpoints for viewing and updating robot job/task information.

**c. Responsibilities**  
The JobsRouter class is responsible for:
- Listing all jobs via GET /jobs endpoint.
- Listing only active jobs via GET /jobs/active endpoint.
- Updating job information via PUT /jobs/{id} endpoint.

**d. Constraints**  
- Uses Database for persistent job storage.
- Uses JobStore service for active job state.
- Job updates may trigger MQTT notifications.

---

#### 2.2.8 SSHRouter Class

**a. Classification**  
The SSHRouter class contains two endpoints for SSH proxy functionality.

**b. Definition**  
The SSHRouter class provides WebSocket-based SSH proxy access to robots for direct terminal control.

**c. Responsibilities**  
The SSHRouter class is responsible for:
- Establishing SSH tunnels via WebSocket /ssh/{robot_id} endpoint.
- Retrieving SSH connection info via GET /ssh/info/{robot_id} endpoint.

**d. Constraints**  
- WebSocket connection required for SSH proxy.
- Robot must be online and accessible via SSH.
- SSH credentials must be configured.
- Authentication required before connection.

---

#### 2.2.9 RobotsDBRouter Class

**a. Classification**  
The RobotsDBRouter class contains six endpoints for robot registration and management.

**b. Definition**  
The RobotsDBRouter class provides REST API endpoints for CRUD operations on robot records in the database.

**c. Responsibilities**  
The RobotsDBRouter class is responsible for:
- Listing all robots via GET /robots endpoint.
- Retrieving single robot via GET /robots/{id} endpoint.
- Registering new robots via POST /robots endpoint.
- Updating robot information via PUT /robots/{id} endpoint.
- Deleting robots via DELETE /robots/{id} endpoint.
- Getting robot statistics via GET /robots/stats endpoint.

**d. Constraints**  
- Uses Database (PostgreSQL) for robot registration storage.
- Robot IDs must be unique.
- Delete operations may cascade to related records.

---

### 2.3 Database Layer

---

#### 2.3.1 Database Class

**a. Classification**  
The Database class (Singleton) contains three attributes and one operation for PostgreSQL database access.

**b. Definition**  
The Database class provides a singleton database connection manager using SQLAlchemy for PostgreSQL relational data storage.

**c. Responsibilities**  
The Database class is responsible for:
- Managing SQLAlchemy engine instance through engine attribute.
- Providing session factory through SessionLocal attribute.
- Defining ORM base class through Base attribute.
- Creating database sessions using get_db() method.

**d. Constraints**  
- Singleton pattern ensures single database connection pool.
- Sessions must be properly closed after use.
- Used by AlertsRouter, UsersRouter, ReportsRouter, LogsRouter, JobsRouter, RobotsDBRouter.
- Written to by MQTTClient for alerts and logs.

---

#### 2.3.2 InfluxDBClient Class

**a. Classification**  
The InfluxDBClient class (Singleton) contains four attributes and four operations for time-series data management.

**b. Definition**  
The InfluxDBClient class provides a singleton client for writing and querying time-series data in InfluxDB for sensor, servo, and status telemetry.

**c. Responsibilities**  
The InfluxDBClient class is responsible for:
- Managing InfluxDB connection configuration through url, token, org, bucket attributes.
- Writing sensor telemetry using write_sensor_data(robot_id, data) method.
- Writing servo telemetry using write_servo_data(robot_id, servo_id, data) method.
- Writing status updates using write_status_data(robot_id, data) method.
- Querying historical data using query_data(measurement, time_range) method.

**d. Constraints**  
- Singleton pattern ensures single connection pool.
- Queried by RobotDataRouter and ReportsRouter.
- Written to by MQTTClient for incoming telemetry.
- Time-range queries must use valid Flux query syntax.

---

### 2.4 MQTT Integration

---

#### 2.4.1 MQTTClient Class

**a. Classification**  
The MQTTClient class contains four attributes and fourteen operations for real-time message handling.

**b. Definition**  
The MQTTClient class manages MQTT broker connections for receiving robot telemetry, processing events, and sending commands through the publish-subscribe pattern.

**c. Responsibilities**  
The MQTTClient class is responsible for:
- Managing broker connection through broker_host and broker_port attributes.
- Maintaining Paho MQTT client instance in client attribute.
- Tracking robot states in robot_states dictionary.
- Starting MQTT connection using start() method.
- Stopping connection using stop() method.
- Handling connection events using on_connect(client, userdata, flags, rc) callback.
- Processing incoming messages using on_message(client, userdata, msg) callback.
- Processing sensor data using handle_sensor_data(topic, payload) method.
- Processing status updates using handle_status_data(topic, payload) method.
- Processing servo data using handle_servo_data(topic, payload) method.
- Processing battery data using handle_battery_data(payload) method.
- Processing location updates using handle_location_data(payload) method.
- Processing job events using handle_job_event(topic, payload) method.
- Processing scan results using handle_scan(topic, payload) method.
- Sending commands using publish_command(robot_id, command) method.
- Checking alert conditions using _check_and_create_alert(robot_id, metric, value) method.
- Creating alerts using _create_alert(robot_id, alert_type, severity, title, message) method.

**d. Constraints**  
- Subscribes to topics: tonypi/sensors/+, tonypi/status/+, tonypi/servos/+, tonypi/battery, tonypi/job/+, tonypi/scan/+.
- Writes data to InfluxDBClient.
- Writes alerts and logs to Database.
- Updates JobStore with job events.
- ManagementRouter publishes commands through this client.
- Broker connection must be established on FastAPIApp startup.

---

### 2.5 Business Services

---

#### 2.5.1 GeminiAnalyticsService Class

**a. Classification**  
The GeminiAnalyticsService class contains three attributes and four operations for AI-powered analytics.

**b. Definition**  
The GeminiAnalyticsService class provides optional AI-powered analysis using Google Gemini for generating intelligent insights from robot performance, job, and maintenance data.

**c. Responsibilities**  
The GeminiAnalyticsService class is responsible for:
- Managing API authentication through api_key attribute.
- Tracking service availability through enabled boolean.
- Maintaining Gemini model instance in model attribute.
- Analyzing performance data using analyze_performance(data) method.
- Analyzing job outcomes using analyze_job(job_data) method.
- Analyzing maintenance needs using analyze_maintenance(servo_data) method.
- Generating custom insights using generate_insights(query, context) method.

**d. Constraints**  
- Optional service requiring valid Google Gemini API key.
- Used by ReportsRouter for enhanced reporting.
- Analysis methods return dictionary results.
- API rate limits may apply.

---

#### 2.5.2 JobStore Class

**a. Classification**  
The JobStore class contains one attribute and four operations for active job state management.

**b. Definition**  
The JobStore class provides an in-memory store for tracking currently active robot jobs with real-time update capabilities.

**c. Responsibilities**  
The JobStore class is responsible for:
- Maintaining active job state in active_jobs dictionary.
- Listing all active jobs using get_active_jobs() method.
- Updating job progress using update_job(robot_id, job_data) method.
- Marking jobs as complete using complete_job(robot_id) method.
- Cancelling jobs using cancel_job(robot_id, reason) method.

**d. Constraints**  
- In-memory store (not persisted across restarts).
- Updated by MQTTClient with job events.
- Used by JobsRouter for active job queries.
- Robot ID is the key for job lookup.

---

---

## 3. Robot Client Class Diagram

**Diagram Name:** TonyPi Robot Monitoring System - Robot Client (Raspberry Pi)

This class diagram illustrates the software architecture running on the TonyPi robot's Raspberry Pi, showing the main client, sensors, camera streaming, and integration with external HiWonder SDK and system libraries.

---

### 3.1 Robot Client Components

---

#### 3.1.1 TonyPiRobotClient Class

**a. Classification**  
The TonyPiRobotClient class contains seven attributes, one static constant, and twenty-one operations for robot control and telemetry.

**b. Definition**  
The TonyPiRobotClient class is the main robot client running on the Raspberry Pi that collects sensor data, publishes telemetry via MQTT, and receives commands from the monitoring system.

**c. Responsibilities**  
The TonyPiRobotClient class is responsible for:
- Managing MQTT broker connection through mqtt_broker, mqtt_port, and mqtt_client attributes.
- Identifying the robot instance using robot_id attribute.
- Tracking operational state through running and emergency_stopped booleans.
- Managing light sensor through light_sensor attribute.
- Defining servo motor names through static SERVO_NAMES constant.
- Handling MQTT connection events using on_connect() and on_disconnect() callbacks.
- Processing incoming commands using on_message() callback.
- Handling movement commands using handle_move_command() and handle_stop_command().
- Performing head gestures using handle_head_nod() and handle_head_shake() methods.
- Responding to status requests using handle_status_request() and handle_battery_request().
- Executing shutdown using handle_shutdown_command() method.
- Managing emergency states using _handle_emergency_stop() and _handle_resume_command().
- Collecting system information using get_system_info(), get_cpu_temperature(), get_local_ip().
- Collecting robot data using get_battery_status(), get_sensor_data(), get_servo_data().
- Publishing telemetry data using publish_telemetry() method.
- Running continuous telemetry loop using telemetry_loop() method.
- Starting and stopping the client using run() and stop() methods.

**d. Constraints**  
- Runs on Raspberry Pi hardware with HiWonder TonyPi robot.
- Falls back to simulation mode if hardware is unavailable.
- MQTT broker must be accessible for telemetry transmission.
- Emergency stop must immediately halt all robot movements.
- Uses LightSensor, CameraStream, and HiWonder SDK components.

---

#### 3.1.2 LightSensor Class

**a. Classification**  
The LightSensor class contains two attributes and four operations for light level detection.

**b. Definition**  
The LightSensor class interfaces with a GPIO-connected light sensor to detect ambient light levels and darkness conditions.

**c. Responsibilities**  
The LightSensor class is responsible for:
- Configuring GPIO pin connection through pin attribute.
- Tracking initialization status using initialized boolean.
- Detecting darkness conditions using is_dark() method.
- Reading light level values using get_light_level() method.
- Releasing GPIO resources using cleanup() method.

**d. Constraints**  
- Uses RPi.GPIO library for GPIO access.
- Pin number must match actual hardware wiring.
- Cleanup must be called on shutdown to avoid GPIO conflicts.
- Used by TonyPiRobotClient for environmental sensing.

---

#### 3.1.3 CameraStream Class

**a. Classification**  
The CameraStream class contains four attributes and six operations for video streaming.

**b. Definition**  
The CameraStream class provides an HTTP MJPEG streaming server for live camera feed access from the robot.

**c. Responsibilities**  
The CameraStream class is responsible for:
- Configuring HTTP server port through port attribute.
- Managing camera capture device through camera (cv2.VideoCapture) attribute.
- Tracking server state using running boolean.
- Buffering current frame in frame_buffer attribute.
- Starting camera capture and HTTP server using start() method.
- Stopping server and releasing camera using stop() method.
- Capturing current frame using get_frame() method.
- Generating MJPEG stream using generate_mjpeg() method.
- Running HTTP server loop using run_server() method.

**d. Constraints**  
- HTTP streaming server runs on port 8080 by default.
- Provides MJPEG video stream format.
- Used by frontend for live camera view.
- Started by TonyPiRobotClient on initialization.
- OpenCV (cv2) required for camera access.

---

### 3.2 HiWonder SDK (External)

---

#### 3.2.1 Controller Class

**a. Classification**  
The Controller class (External) contains four operations for servo and battery management.

**b. Definition**  
The Controller class is part of the HiWonder SDK providing low-level access to servo motors and battery monitoring on the TonyPi robot.

**c. Responsibilities**  
The Controller class is responsible for:
- Reading servo motor information using get_servo_info(servo_ids) method.
- Setting servo positions using set_servo_position(servo_id, position, time) method.
- Configuring servo speed using set_servo_speed(servo_id, speed) method.
- Reading battery voltage using get_battery_voltage() method.

**d. Constraints**  
- External HiWonder SDK dependency.
- Servo IDs must match physical servo configuration.
- Used by TonyPiRobotClient for servo and battery data collection.

---

#### 3.2.2 Sonar Class

**a. Classification**  
The Sonar class (External) contains one operation for distance measurement.

**b. Definition**  
The Sonar class is part of the HiWonder SDK providing ultrasonic distance sensor functionality.

**c. Responsibilities**  
The Sonar class is responsible for:
- Measuring distance to obstacles using get_distance() method.

**d. Constraints**  
- External HiWonder SDK dependency.
- Returns distance in centimeters.
- Used by TonyPiRobotClient for obstacle detection.

---

#### 3.2.3 Board Class

**a. Classification**  
The Board class (External) contains three operations for IMU sensor access.

**b. Definition**  
The Board class is part of the HiWonder SDK providing access to the robot's inertial measurement unit (IMU) sensors.

**c. Responsibilities**  
The Board class is responsible for:
- Reading accelerometer data using get_accelerometer() method.
- Reading gyroscope data using get_gyroscope() method.
- Reading magnetometer data using get_magnetometer() method.

**d. Constraints**  
- External HiWonder SDK dependency.
- Returns tuple values for x, y, z axes.
- Accessed through ros_robot_controller_sdk.Board() factory.
- Used by TonyPiRobotClient for IMU data collection.

---

#### 3.2.4 ActionGroupControl Class

**a. Classification**  
The ActionGroupControl class (External) contains three static operations for movement execution.

**b. Definition**  
The ActionGroupControl class is part of the HiWonder SDK providing pre-defined action sequence execution for robot movements.

**c. Responsibilities**  
The ActionGroupControl class is responsible for:
- Running named action sequences using runActionGroup(action_name) static method.
- Stopping current action using stopActionGroup() static method.
- Executing specific movements using executeMovement(movement) static method.

**d. Constraints**  
- External HiWonder SDK dependency.
- Pre-defined action sequences include: forward, backward, turn_left, turn_right, wave, bow, stand.
- Used by TonyPiRobotClient for command execution.

---

### 3.3 System Libraries (External)

---

#### 3.3.1 psutil Class

**a. Classification**  
The psutil class (External) contains four static operations for system metrics collection.

**b. Definition**  
The psutil library provides cross-platform system and process utilities for monitoring CPU, memory, disk, and network resources.

**c. Responsibilities**  
The psutil class is responsible for:
- Measuring CPU usage using cpu_percent() static method.
- Reading memory information using virtual_memory() static method.
- Reading disk usage using disk_usage(path) static method.
- Getting network interface addresses using net_if_addrs() static method.

**d. Constraints**  
- External Python library dependency.
- Used by TonyPiRobotClient for system information collection.
- Cross-platform compatible.

---

#### 3.3.2 paho.mqtt.client Class

**a. Classification**  
The paho.mqtt.client class (External) contains six operations for MQTT communication.

**b. Definition**  
The Paho MQTT client library provides MQTT protocol implementation for publishing and subscribing to messages.

**c. Responsibilities**  
The paho.mqtt.client class is responsible for:
- Creating MQTT client instances using Client() constructor.
- Establishing broker connection using connect(host, port) method.
- Subscribing to topics using subscribe(topic) method.
- Publishing messages using publish(topic, payload) method.
- Starting background network loop using loop_start() method.
- Stopping network loop using loop_stop() method.

**d. Constraints**  
- External Eclipse Paho library dependency.
- Used by TonyPiRobotClient for MQTT communication.
- Requires network connectivity to MQTT broker.

---

#### 3.3.3 RPi.GPIO Class

**a. Classification**  
The RPi.GPIO class (External) contains four static operations for GPIO access.

**b. Definition**  
The RPi.GPIO library provides Raspberry Pi GPIO (General Purpose Input/Output) pin access for controlling and reading hardware peripherals.

**c. Responsibilities**  
The RPi.GPIO class is responsible for:
- Setting GPIO numbering mode using setmode(mode) static method.
- Configuring pin direction using setup(pin, direction) static method.
- Reading pin state using input(pin) static method.
- Releasing GPIO resources using cleanup() static method.

**d. Constraints**  
- Raspberry Pi specific library.
- Only works on Raspberry Pi hardware.
- Used by LightSensor for GPIO-based light detection.
- Cleanup required on exit to avoid resource conflicts.

---

---

## 4. Database Entity Classes Diagram

**Diagram Name:** TonyPi Robot Monitoring System - Database Entity Classes (PostgreSQL)

This class diagram illustrates the database entity models (ORM classes) used with PostgreSQL, including enumerations for type safety and the SQLAlchemy model definitions.

---

### 4.1 Enumerations

---

#### 4.1.1 RobotStatus Enumeration

**a. Classification**  
The RobotStatus enumeration contains four values defining robot operational states.

**b. Definition**  
The RobotStatus enumeration defines the possible operational states a robot can be in within the monitoring system.

**c. Responsibilities**  
The RobotStatus enumeration is responsible for:
- Defining online state for active, connected robots.
- Defining offline state for disconnected robots.
- Defining error state for robots experiencing failures.
- Defining maintenance state for robots under service.

**d. Constraints**  
- Used by Robot entity's status field.
- Must be one of the four defined values.
- Transitions between states should follow logical workflow.

---

#### 4.1.2 UserRole Enumeration

**a. Classification**  
The UserRole enumeration contains three values defining user authorization levels.

**b. Definition**  
The UserRole enumeration defines the role-based access control (RBAC) levels for system users.

**c. Responsibilities**  
The UserRole enumeration is responsible for:
- Defining admin role with full system access.
- Defining operator role with robot control permissions.
- Defining viewer role with read-only access.

**d. Constraints**  
- Used by User entity's role field.
- Role determines feature accessibility.
- Admin has highest privilege level.

---

#### 4.1.3 AlertSeverity Enumeration

**a. Classification**  
The AlertSeverity enumeration contains three values defining alert importance levels.

**b. Definition**  
The AlertSeverity enumeration defines the priority levels for system alerts.

**c. Responsibilities**  
The AlertSeverity enumeration is responsible for:
- Defining critical severity for urgent issues requiring immediate attention.
- Defining warning severity for potential problems.
- Defining info severity for informational notifications.

**d. Constraints**  
- Used by Alert entity's severity field.
- Critical alerts should trigger immediate notifications.
- Affects alert display ordering and highlighting.

---

#### 4.1.4 AlertType Enumeration

**a. Classification**  
The AlertType enumeration contains seven values defining alert categories.

**b. Definition**  
The AlertType enumeration defines the categories of alerts that can be generated by the monitoring system.

**c. Responsibilities**  
The AlertType enumeration is responsible for:
- Defining temperature alert for CPU/system temperature issues.
- Defining battery alert for low battery conditions.
- Defining servo_temp alert for servo motor overheating.
- Defining servo_voltage alert for servo power issues.
- Defining cpu alert for high CPU usage.
- Defining memory alert for low memory conditions.
- Defining emergency_stop alert for emergency stop events.

**d. Constraints**  
- Used by Alert entity's alert_type field.
- Each type has corresponding threshold configuration.
- Type determines alert handling logic.

---

#### 4.1.5 JobStatus Enumeration

**a. Classification**  
The JobStatus enumeration contains four values defining job execution states.

**b. Definition**  
The JobStatus enumeration defines the possible states a robot job/task can be in.

**c. Responsibilities**  
The JobStatus enumeration is responsible for:
- Defining active state for currently running jobs.
- Defining completed state for successfully finished jobs.
- Defining cancelled state for manually stopped jobs.
- Defining failed state for jobs that encountered errors.

**d. Constraints**  
- Used by Job entity's status field.
- Active jobs appear in real-time monitoring.
- Terminal states are completed, cancelled, and failed.

---

#### 4.1.6 JobPhase Enumeration

**a. Classification**  
The JobPhase enumeration contains four values defining job execution phases.

**b. Definition**  
The JobPhase enumeration defines the execution phases within an active job.

**c. Responsibilities**  
The JobPhase enumeration is responsible for:
- Defining scanning phase for initial environment scanning.
- Defining searching phase for target location.
- Defining executing phase for main task execution.
- Defining done phase for completed execution.

**d. Constraints**  
- Used by Job entity's phase field.
- Phases progress sequentially during job execution.
- Used for progress tracking and UI display.

---

#### 4.1.7 ReportType Enumeration

**a. Classification**  
The ReportType enumeration contains four values defining report categories.

**b. Definition**  
The ReportType enumeration defines the types of reports that can be generated.

**c. Responsibilities**  
The ReportType enumeration is responsible for:
- Defining performance report type for system metrics analysis.
- Defining job report type for task execution summaries.
- Defining maintenance report type for hardware health analysis.
- Defining custom report type for user-defined reports.

**d. Constraints**  
- Used by Report entity's report_type field.
- Report type determines data collection and analysis methods.
- Performance, job, and maintenance reports may use AI analytics.

---

#### 4.1.8 LogLevel Enumeration

**a. Classification**  
The LogLevel enumeration contains four values defining log severity levels.

**b. Definition**  
The LogLevel enumeration defines the severity levels for system log entries.

**c. Responsibilities**  
The LogLevel enumeration is responsible for:
- Defining INFO level for informational messages.
- Defining WARNING level for potential issues.
- Defining ERROR level for error conditions.
- Defining CRITICAL level for severe failures.

**d. Constraints**  
- Used by SystemLog entity's level field.
- Standard logging level hierarchy.
- Affects log filtering and display.

---

### 4.2 Database Entities

---

#### 4.2.1 Base Class (Abstract)

**a. Classification**  
The Base abstract class contains one abstract attribute for ORM inheritance.

**b. Definition**  
The Base class is the SQLAlchemy declarative base class that all database entity models inherit from.

**c. Responsibilities**  
The Base class is responsible for:
- Providing ORM metadata through abstract metadata attribute.
- Serving as parent class for all entity models.

**d. Constraints**  
- Abstract class, cannot be instantiated directly.
- All entity models must inherit from Base.
- Used with SQLAlchemy ORM.

---

#### 4.2.2 Robot Entity

**a. Classification**  
The Robot entity contains seventeen attributes and one operation for robot registration.

**b. Definition**  
The Robot entity represents a physical TonyPi robot registered in the system, storing its configuration, thresholds, and current status.

**c. Responsibilities**  
The Robot entity is responsible for:
- Storing unique identification through id (PK) and robot_id (unique) attributes.
- Storing descriptive information in name and description attributes.
- Storing physical position in location (JSON) attribute.
- Tracking operational status using status (RobotStatus) attribute.
- Storing network configuration in ip_address and camera_url attributes.
- Configuring battery alerts using battery_threshold_low and battery_threshold_critical.
- Configuring temperature alerts using temp_threshold_warning and temp_threshold_critical.
- Storing custom configuration in settings (JSON) attribute.
- Tracking connectivity through last_seen timestamp.
- Managing audit timestamps with created_at and updated_at.
- Tracking active status using is_active boolean.
- Converting to dictionary format using to_dict() method.

**d. Constraints**  
- robot_id must be unique across all robots.
- Related to Alert, AlertThreshold, Job, Report, and SystemLog entities.
- Triggers alerts when thresholds are exceeded.
- last_seen updates on each telemetry reception.

---

#### 4.2.3 User Entity

**a. Classification**  
The User entity contains eight attributes and one operation for user accounts.

**b. Definition**  
The User entity represents a system user account with role-based access control.

**c. Responsibilities**  
The User entity is responsible for:
- Storing unique identification using id (UUID) primary key.
- Storing credentials in username (unique) and email (unique) attributes.
- Storing hashed password in password_hash attribute.
- Defining access level using role (UserRole) attribute.
- Tracking account status using is_active boolean.
- Managing audit timestamps with created_at and updated_at.
- Converting to dictionary format using to_dict() method.

**d. Constraints**  
- username and email must be unique.
- Password stored as bcrypt hash, never plain text.
- Role determines feature accessibility.
- Related to Alert (acknowledges) and Report (creates) entities.

---

#### 4.2.4 Alert Entity

**a. Classification**  
The Alert entity contains seventeen attributes and one operation for system alerts.

**b. Definition**  
The Alert entity represents a system alert generated when sensor values exceed configured thresholds.

**c. Responsibilities**  
The Alert entity is responsible for:
- Storing unique identification using id (PK) attribute.
- Linking to robot using robot_id (FK) attribute.
- Categorizing alert using alert_type (AlertType) and severity (AlertSeverity).
- Storing alert content in title and message attributes.
- Storing source component in source attribute.
- Recording triggering value and threshold in value and threshold attributes.
- Tracking acknowledgment through acknowledged, acknowledged_by, acknowledged_at.
- Tracking resolution through resolved and resolved_at attributes.
- Storing additional context in details (JSON) attribute.
- Recording creation time in created_at timestamp.
- Converting to dictionary format using to_dict() method.

**d. Constraints**  
- Foreign key relationship to Robot entity.
- Can be acknowledged and resolved by User entities.
- Severity affects notification priority.
- Details JSON may contain metric-specific information.

---

#### 4.2.5 AlertThreshold Entity

**a. Classification**  
The AlertThreshold entity contains eight attributes and one operation for threshold configuration.

**b. Definition**  
The AlertThreshold entity stores configurable alert thresholds for different metrics per robot.

**c. Responsibilities**  
The AlertThreshold entity is responsible for:
- Storing unique identification using id (PK) attribute.
- Linking to robot using robot_id (FK) attribute.
- Identifying metric using metric_type attribute.
- Defining warning level in warning_threshold attribute.
- Defining critical level in critical_threshold attribute.
- Enabling/disabling threshold using enabled boolean.
- Managing audit timestamps with created_at and updated_at.
- Converting to dictionary format using to_dict() method.

**d. Constraints**  
- Foreign key relationship to Robot entity.
- warning_threshold should be less severe than critical_threshold.
- Metric types include: temperature, battery, servo_temp, cpu, memory.
- Used by MQTTClient for alert generation.

---

#### 4.2.6 Job Entity

**a. Classification**  
The Job entity contains seventeen attributes and one operation for task tracking.

**b. Definition**  
The Job entity tracks robot task execution with progress, timing, and outcome information.

**c. Responsibilities**  
The Job entity is responsible for:
- Storing unique identification using id (PK) attribute.
- Linking to robot using robot_id (FK) attribute.
- Tracking timing through start_time and end_time timestamps.
- Tracking item progress using items_total and items_done attributes.
- Calculating completion percentage in percent_complete attribute.
- Storing last processed item in last_item (JSON) attribute.
- Tracking status using status (JobStatus) attribute.
- Storing task name in task_name attribute.
- Tracking execution phase in phase (JobPhase) attribute.
- Storing timing estimates in estimated_duration and action_duration.
- Recording outcome in success boolean.
- Storing cancellation reason in cancel_reason attribute.
- Managing audit timestamps with created_at and updated_at.
- Converting to dictionary format using to_dict() method.

**d. Constraints**  
- Foreign key relationship to Robot entity.
- percent_complete calculated from items_done / items_total.
- phase updates as job progresses through stages.
- cancel_reason populated only when status is 'cancelled'.

---

#### 4.2.7 Report Entity

**a. Classification**  
The Report entity contains eight attributes and one operation for report storage.

**b. Definition**  
The Report entity stores generated reports including metadata, data content, and optional PDF file references.

**c. Responsibilities**  
The Report entity is responsible for:
- Storing unique identification using id (PK) attribute.
- Storing report title and description in respective attributes.
- Linking to robot using robot_id (FK) attribute.
- Categorizing using report_type (ReportType) attribute.
- Storing report content in data (JSON) attribute.
- Storing PDF file path in file_path attribute.
- Recording creation time in created_at timestamp.
- Tracking creator using created_by (FK to User) attribute.
- Converting to dictionary format using to_dict() method.

**d. Constraints**  
- Foreign key relationships to Robot and User entities.
- data JSON contains metrics, analysis, and AI insights.
- file_path populated when PDF export is generated.
- Report types determine data collection scope.

---

#### 4.2.8 SystemLog Entity

**a. Classification**  
The SystemLog entity contains seven attributes and one operation for audit logging.

**b. Definition**  
The SystemLog entity stores system event logs for auditing, debugging, and monitoring purposes.

**c. Responsibilities**  
The SystemLog entity is responsible for:
- Storing unique identification using id (PK) attribute.
- Categorizing severity using level (LogLevel) attribute.
- Categorizing source using category attribute.
- Storing log content in message attribute.
- Optionally linking to robot using robot_id (FK) attribute.
- Storing additional context in details (JSON) attribute.
- Recording event time in timestamp attribute.
- Converting to dictionary format using to_dict() method.

**d. Constraints**  
- Optional foreign key relationship to Robot entity.
- Categories include: mqtt, api, database, system, command, robot, alert.
- Used for troubleshooting and audit trails.
- Large datasets require pagination and retention policies.

---

---

## 5. InfluxDB Time-Series Schema Diagram

**Diagram Name:** TonyPi Robot Monitoring System - InfluxDB Time-Series Database Design

This diagram illustrates the InfluxDB schema design for storing high-frequency time-series data, showing measurements (tables), tags (indexed fields), and fields (values).

---

### 5.1 InfluxDB Measurements

---

#### 5.1.1 sensor_data Measurement

**a. Classification**  
The sensor_data measurement contains two tags and two fields for general sensor readings.

**b. Definition**  
The sensor_data measurement stores time-series data for various robot sensor readings including accelerometer, gyroscope, temperature, light, and distance sensors.

**c. Responsibilities**  
The sensor_data measurement is responsible for:
- Indexing by robot using robot_id tag.
- Categorizing sensor type using sensor_type tag.
- Storing sensor reading in value field.
- Storing unit of measurement in unit field.
- Recording timestamp in _time field.

**d. Constraints**  
- Tags are indexed for fast filtering.
- sensor_type values: accelerometer_x/y/z, gyroscope_x/y/z, cpu_temperature, light_level, ultrasonic_distance.
- Write frequency approximately 10 points per second per robot.
- Queried using Flux query language.

---

#### 5.1.2 servo_data Measurement

**a. Classification**  
The servo_data measurement contains three tags and three fields for servo motor telemetry.

**b. Definition**  
The servo_data measurement stores time-series data for individual servo motor health metrics including position, temperature, and voltage.

**c. Responsibilities**  
The servo_data measurement is responsible for:
- Indexing by robot using robot_id tag.
- Identifying servo using servo_id and servo_name tags.
- Storing current position in position field (0-1023 range).
- Storing temperature reading in temperature field (°C).
- Storing voltage reading in voltage field (Volts).
- Recording timestamp in _time field.

**d. Constraints**  
- servo_id values: 1-6 (Right Hip Yaw, Right Hip Pitch, Right Knee, Left Hip Yaw, Left Hip Pitch, Left Knee).
- Position range 0-1023 corresponds to servo's physical range.
- Write frequency approximately 2 points per second.
- Used for servo health monitoring and maintenance prediction.

---

#### 5.1.3 robot_status Measurement

**a. Classification**  
The robot_status measurement contains one tag and six fields for system status metrics.

**b. Definition**  
The robot_status measurement stores time-series system status data for monitoring Raspberry Pi resource utilization and connectivity.

**c. Responsibilities**  
The robot_status measurement is responsible for:
- Indexing by robot using robot_id tag.
- Storing CPU usage in cpu_percent field.
- Storing memory usage in memory_percent field.
- Storing disk usage in disk_percent field.
- Storing system temperature in temperature field.
- Tracking online status in is_online boolean field.
- Storing current IP in ip_address field.
- Recording timestamp in _time field.

**d. Constraints**  
- Published every 5 seconds by robot telemetry loop.
- Used for real-time monitoring dashboard.
- Percentage fields range 0-100.
- is_online determines robot connectivity display.

---

#### 5.1.4 battery_status Measurement

**a. Classification**  
The battery_status measurement contains one tag and three fields for battery monitoring.

**b. Definition**  
The battery_status measurement stores time-series battery status data for monitoring robot power levels.

**c. Responsibilities**  
The battery_status measurement is responsible for:
- Indexing by robot using robot_id tag.
- Storing battery voltage in voltage field.
- Storing calculated percentage in percentage field.
- Tracking charging state in charging boolean field.
- Recording timestamp in _time field.

**d. Constraints**  
- 3S LiPo battery voltage range: 9.0V (empty) to 12.6V (full).
- Nominal voltage is 11.1V (3 cells × 3.7V).
- Used for battery alerts when thresholds exceeded.
- Critical for preventing robot shutdown during operations.

---

#### 5.1.5 robot_location Measurement

**a. Classification**  
The robot_location measurement contains one tag and three fields for position tracking.

**b. Definition**  
The robot_location measurement stores time-series location data for tracking robot position in 3D space.

**c. Responsibilities**  
The robot_location measurement is responsible for:
- Indexing by robot using robot_id tag.
- Storing X coordinate in x field.
- Storing Y coordinate in y field.
- Storing Z coordinate in z field.
- Recording timestamp in _time field.

**d. Constraints**  
- Coordinates are in robot's local coordinate system.
- Used for movement tracking and path visualization.
- Update frequency depends on movement activity.

---

#### 5.1.6 vision_data Measurement

**a. Classification**  
The vision_data measurement contains two tags and six fields for computer vision detections.

**b. Definition**  
The vision_data measurement stores time-series data for objects detected by the robot's vision system.

**c. Responsibilities**  
The vision_data measurement is responsible for:
- Indexing by robot using robot_id tag.
- Categorizing detection using detection_type tag.
- Storing detected object label in label field.
- Storing detection confidence in confidence field.
- Storing bounding box coordinates in x, y, width, height fields.
- Recording timestamp in _time field.

**d. Constraints**  
- detection_type values: qr_code, color, face, object.
- Coordinates are in pixels relative to camera frame.
- confidence value ranges 0.0-1.0.
- Used for vision-based task automation and monitoring.

---

---

## 6. PostgreSQL ERD (Entity Relationship Diagram)

**Diagram Name:** TonyPi Robot Monitoring System - PostgreSQL Database Design (Entity Relationship Diagram)

This ERD illustrates the PostgreSQL relational database schema showing tables, columns, data types, constraints, and relationships between entities.

---

### 6.1 PostgreSQL Tables

---

#### 6.1.1 users Table

**a. Classification**  
The users table contains eight columns for user account storage.

**b. Definition**  
The users table stores user account information including credentials and role-based access control settings.

**c. Responsibilities**  
The users table is responsible for:
- Storing primary key in id column (VARCHAR(36) UUID).
- Storing unique username in username column (VARCHAR(50)).
- Storing unique email in email column (VARCHAR(100)).
- Storing hashed password in password_hash column (VARCHAR(255)).
- Storing role assignment in role column (VARCHAR(20)).
- Tracking account status in is_active column (BOOLEAN, default TRUE).
- Managing timestamps in created_at and updated_at columns (TIMESTAMPTZ).

**d. Constraints**  
- id is primary key (UUID format).
- username and email have UNIQUE constraints.
- role values: admin, operator, viewer.
- Password stored as bcrypt hash.
- Has one-to-many relationship with reports and alerts tables.

---

#### 6.1.2 robots Table

**a. Classification**  
The robots table contains sixteen columns for robot registration storage.

**b. Definition**  
The robots table stores registered robot information including configuration, thresholds, and network settings.

**c. Responsibilities**  
The robots table is responsible for:
- Storing auto-increment primary key in id column (SERIAL).
- Storing unique robot identifier in robot_id column (VARCHAR(100)).
- Storing descriptive name in name column (VARCHAR(100)).
- Storing description in description column (TEXT).
- Storing location coordinates in location column (JSONB).
- Tracking status in status column (VARCHAR(20), default 'offline').
- Storing network address in ip_address column (VARCHAR(45)).
- Storing camera URL in camera_url column (VARCHAR(255)).
- Storing battery thresholds in battery_threshold_low/critical columns (FLOAT).
- Storing temperature thresholds in temp_threshold_warning/critical columns (FLOAT).
- Storing custom settings in settings column (JSONB).
- Tracking connectivity in last_seen column (TIMESTAMPTZ).
- Managing timestamps in created_at and updated_at columns.
- Tracking active status in is_active column (BOOLEAN, default TRUE).

**d. Constraints**  
- id is auto-incrementing primary key (SERIAL).
- robot_id has UNIQUE constraint.
- status values: online, offline, error, maintenance.
- location JSONB format: {"x": 0.0, "y": 0.0, "z": 0.0}.
- Has one-to-many relationships with alerts, alert_thresholds, jobs, reports, system_logs.

---

#### 6.1.3 alerts Table

**a. Classification**  
The alerts table contains fifteen columns for alert storage.

**b. Definition**  
The alerts table stores system alerts generated when sensor values exceed configured thresholds.

**c. Responsibilities**  
The alerts table is responsible for:
- Storing auto-increment primary key in id column (SERIAL).
- Storing foreign key reference in robot_id column (VARCHAR(100)).
- Storing alert category in alert_type column (VARCHAR(50)).
- Storing priority level in severity column (VARCHAR(20)).
- Storing alert title and message in respective columns.
- Storing source component in source column (VARCHAR(100)).
- Storing triggering value in value column (FLOAT).
- Storing threshold in threshold column (FLOAT).
- Tracking acknowledgment in acknowledged (BOOLEAN), acknowledged_by (VARCHAR(50)), acknowledged_at (TIMESTAMPTZ).
- Tracking resolution in resolved (BOOLEAN), resolved_at (TIMESTAMPTZ).
- Storing additional context in details column (JSONB).
- Recording creation time in created_at column (TIMESTAMPTZ).

**d. Constraints**  
- robot_id is foreign key referencing robots table.
- alert_type values: temperature, battery, servo_temp, servo_voltage, cpu, memory, emergency_stop.
- severity values: critical, warning, info.
- acknowledged and resolved default to FALSE.

---

#### 6.1.4 alert_thresholds Table

**a. Classification**  
The alert_thresholds table contains seven columns for threshold configuration storage.

**b. Definition**  
The alert_thresholds table stores configurable alert thresholds for different metrics per robot.

**c. Responsibilities**  
The alert_thresholds table is responsible for:
- Storing auto-increment primary key in id column (SERIAL).
- Storing foreign key reference in robot_id column (VARCHAR(100)).
- Storing metric identifier in metric_type column (VARCHAR(50)).
- Storing warning level in warning_threshold column (FLOAT).
- Storing critical level in critical_threshold column (FLOAT).
- Tracking enabled status in enabled column (BOOLEAN, default TRUE).
- Managing timestamps in created_at and updated_at columns.

**d. Constraints**  
- robot_id is foreign key referencing robots table.
- warning_threshold should be less severe than critical_threshold.
- Used by MQTT processing for alert generation.

---

#### 6.1.5 jobs Table

**a. Classification**  
The jobs table contains seventeen columns for job tracking storage.

**b. Definition**  
The jobs table stores robot task execution records with progress, timing, and outcome information.

**c. Responsibilities**  
The jobs table is responsible for:
- Storing auto-increment primary key in id column (SERIAL).
- Storing foreign key reference in robot_id column (VARCHAR(100)).
- Storing timing in start_time and end_time columns (TIMESTAMPTZ).
- Storing item counts in items_total and items_done columns (INTEGER).
- Storing completion percentage in percent_complete column (FLOAT, default 0.0).
- Storing last processed item in last_item column (JSONB).
- Storing status in status column (VARCHAR(20), default 'active').
- Storing task name in task_name column (VARCHAR(255)).
- Storing phase in phase column (VARCHAR(50)).
- Storing timing estimates in estimated_duration and action_duration columns (FLOAT).
- Storing outcome in success column (BOOLEAN).
- Storing cancellation reason in cancel_reason column (TEXT).
- Managing timestamps in created_at and updated_at columns.

**d. Constraints**  
- robot_id is foreign key referencing robots table.
- status values: active, completed, cancelled, failed.
- phase values: scanning, searching, executing, done.
- items_done should not exceed items_total.

---

#### 6.1.6 reports Table

**a. Classification**  
The reports table contains eight columns for report storage.

**b. Definition**  
The reports table stores generated reports including metadata, content, and file references.

**c. Responsibilities**  
The reports table is responsible for:
- Storing auto-increment primary key in id column (SERIAL).
- Storing report title in title column (VARCHAR(255)).
- Storing description in description column (TEXT).
- Storing foreign key reference in robot_id column (VARCHAR(100)).
- Storing category in report_type column (VARCHAR(50)).
- Storing report content in data column (JSONB).
- Storing PDF path in file_path column (VARCHAR(255)).
- Recording creation in created_at (TIMESTAMPTZ) and created_by (VARCHAR(100)) columns.

**d. Constraints**  
- robot_id is foreign key referencing robots table.
- created_by is foreign key referencing users table.
- report_type values: performance, job, maintenance, custom.
- data JSONB contains metrics and AI analysis results.

---

#### 6.1.7 system_logs Table

**a. Classification**  
The system_logs table contains seven columns for audit log storage.

**b. Definition**  
The system_logs table stores system event logs for auditing, debugging, and monitoring.

**c. Responsibilities**  
The system_logs table is responsible for:
- Storing auto-increment primary key in id column (SERIAL).
- Storing severity in level column (VARCHAR(20)).
- Storing source category in category column (VARCHAR(50)).
- Storing log message in message column (TEXT).
- Storing optional foreign key in robot_id column (VARCHAR(100)).
- Storing additional context in details column (JSONB).
- Recording event time in timestamp column (TIMESTAMPTZ).

**d. Constraints**  
- robot_id is optional foreign key referencing robots table.
- level values: INFO, WARNING, ERROR, CRITICAL.
- category values: mqtt, api, database, system, command, robot, alert, etc.
- Used for troubleshooting and audit trails.

---

---

## Summary

This document has provided detailed CDRC (Classification, Definition, Responsibilities, Constraints) breakdowns for all classes, entities, and structures in the TonyPi Robot Monitoring System class diagrams:

| Diagram | Category | Components |
|---------|----------|------------|
| Frontend | Application Entry | App, TonyPiApp |
| Frontend | Context Providers | AuthContext, ThemeContext, NotificationContext |
| Frontend | Page Components | Dashboard, Monitoring, Robots, Sensors, Servos, Jobs, Alerts, Logs, Reports, Users, Login |
| Frontend | Shared Components | Layout, SSHTerminal, GrafanaPanel, Toast |
| Frontend | TypeScript Interfaces | RobotInterface, AlertInterface, JobInterface, SensorDataInterface, ServoDataInterface, UserInterface |
| Frontend | Utilities | API, MQTTService |
| Backend | Core Application | FastAPIApp |
| Backend | API Routers | RobotDataRouter, AlertsRouter, ManagementRouter, UsersRouter, ReportsRouter, LogsRouter, JobsRouter, SSHRouter, RobotsDBRouter |
| Backend | Database Layer | Database, InfluxDBClient |
| Backend | MQTT Integration | MQTTClient |
| Backend | Business Services | GeminiAnalyticsService, JobStore |
| Robot Client | Client Components | TonyPiRobotClient, LightSensor, CameraStream |
| Robot Client | HiWonder SDK (External) | Controller, Sonar, Board, ActionGroupControl |
| Robot Client | System Libraries (External) | psutil, paho.mqtt.client, RPi.GPIO |
| Database Entities | Enumerations | RobotStatus, UserRole, AlertSeverity, AlertType, JobStatus, JobPhase, ReportType, LogLevel |
| Database Entities | ORM Models | Base, Robot, User, Alert, AlertThreshold, Job, Report, SystemLog |
| InfluxDB Schema | Time-Series Measurements | sensor_data, servo_data, robot_status, battery_status, robot_location, vision_data |
| PostgreSQL ERD | Relational Tables | users, robots, alerts, alert_thresholds, jobs, reports, system_logs |

**Total Components Documented: 70**
