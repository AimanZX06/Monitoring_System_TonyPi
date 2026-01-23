# Class Diagram Descriptions

Source: combined_system_architecture.puml

## 4.1 React UI (Frontend)
**a. Classification**
The React UI class contains three attributes (components, websocket, currentUser) and five operations (renderDashboard, updateRealTimeCharts, sendRobotCommand, displayAlerts, connectWebSocket).

**b. Definition**
The React UI class provides the user-facing dashboard, enabling real-time visualization of telemetry and control of the TonyPi robot via WebSocket and HTTP interactions.

**c. Responsibilities**
- Render dashboards and charts for system status.
- Maintain WebSocket connectivity and update UI state in real time.
- Send robot commands initiated by users.
- Display alerts and notifications.
- Manage current user context/session.

**d. Constraints**
- Must gracefully handle WebSocket disconnects and reconnections.
- Must ensure secure communication (auth, CSRF, WS token handling).
- Must keep UI state consistent under rapid updates.
- Must validate command inputs to prevent unsafe actions.

---

## 4.2 FastAPI Backend
**a. Classification**
The FastAPI Backend class contains four attributes (app, db_session, mqtt_client, scheduler) and six operations (get_robot_status, post_robot_command, websocket_endpoint, authenticate_user, schedule_job, handle_mqtt_message).

**b. Definition**
The FastAPI Backend class exposes HTTP and WebSocket APIs, orchestrates MQTT communications, performs authentication, schedules jobs, and persists data to PostgreSQL and InfluxDB.

**c. Responsibilities**
- Serve REST and WebSocket endpoints for the frontend.
- Authenticate users and issue/validate tokens.
- Relay commands and telemetry via MQTT.
- Schedule and manage background tasks.
- Read/write metadata to PostgreSQL and time-series to InfluxDB.

**d. Constraints**
- Must handle concurrent requests predictably (async safety, DB session lifecycle).
- Must maintain transactional integrity for relational operations.
- Must validate MQTT topics/payloads and sanitize inputs.
- Must enforce auth/authorization on all sensitive routes.

---

## 4.3 Mosquitto MQTT
**a. Classification**
The Mosquitto MQTT class contains three attributes (broker_host, broker_port, clients) and three operations (publish, subscribe, get_client_count).

**b. Definition**
The Mosquitto MQTT class represents the message broker used for pub/sub telemetry and robot control channels.

**c. Responsibilities**
- Accept client connections and manage subscriptions.
- Route published messages to subscribers.
- Provide broker metrics (client counts).

**d. Constraints**
- Must enforce topic hierarchy and ACLs for security.
- Must support appropriate QoS levels for reliability.
- Must manage payload size and rate limits.

---

## 4.4 PostgreSQL
**a. Classification**
The PostgreSQL class contains two attributes (connection_pool, tables) and six operations (query, insert, update, delete, get_user_by_id, store_alert_rule).

**b. Definition**
The PostgreSQL class provides relational storage for metadata, users, configuration (including alert rules), and other non-time-series data.

**c. Responsibilities**
- Execute SQL queries and mutations.
- Manage user and alert rule records.
- Support schema-driven integrity and constraints.

**d. Constraints**
- Must ensure ACID properties and proper transaction handling.
- Must maintain indexes and schema migrations for performance.
- Must sanitize queries to prevent SQL injection.

---

## 4.5 InfluxDB
**a. Classification**
The InfluxDB class contains three attributes (bucket, org, client) and four operations (write_point, query_range, get_sensor_data, aggregate_metrics).

**b. Definition**
The InfluxDB class provides time-series storage and querying for sensors and robot telemetry.

**c. Responsibilities**
- Ingest metrics and sensor points.
- Query ranges for dashboards and analytics.
- Aggregate metrics over intervals for summaries.

**d. Constraints**
- Must apply retention policies and bucket lifecycle as configured.
- Must handle high write rates and timestamp ordering.
- Must consistently tag/field data for reliable queries.

---

## 4.6 Grafana
**a. Classification**
The Grafana class contains three attributes (datasources, dashboards, alertmanager) and four operations (create_dashboard, query_datasource, trigger_alert, provision_dashboard).

**b. Definition**
The Grafana class provides visualization, dashboard provisioning, and alerting over time-series and metadata sources.

**c. Responsibilities**
- Manage datasources and dashboards.
- Execute queries for panels.
- Configure and trigger alerts from rules.
- Provision dashboards from files.

**d. Constraints**
- Must authenticate to datasources securely.
- Must keep dashboards in sync with provisioned files.
- Must ensure alertmanager configuration consistency.

---

## 5.1 ISensor (Interface)
**a. Classification**
The ISensor interface defines one operation (cleanup) and no attributes.

**b. Definition**
The ISensor interface standardizes sensor resource cleanup.

**c. Responsibilities**
- Provide a common contract for releasing hardware/software resources.

**d. Constraints**
- Implementations must make cleanup idempotent and safe under repeated calls.

---

## 5.2 IController (Interface)
**a. Classification**
The IController interface defines two operations (start, stop) and no attributes.

**b. Definition**
The IController interface defines lifecycle management for controllers running on the robot.

**c. Responsibilities**
- Provide a common start/stop contract for controller modules.

**d. Constraints**
- Implementations must ensure thread-safe start/stop and consistent state transitions.

---

## 5.3 MainController
**a. Classification**
The MainController class contains four attributes (model, latest_frame, latest_result, running) and five operations (main, inference_worker, process_voice_command, handle_mqtt_callback, start_navigation).

**b. Definition**
The MainController class coordinates robot operations, running vision inference, handling voice commands, managing MQTT callbacks, and initiating navigation.

**c. Responsibilities**
- Run the primary control loop and workers.
- Process voice commands for actions.
- Handle inbound MQTT control or telemetry callbacks.
- Start navigation towards stations.
- Manage model and latest frame/result state.

**d. Constraints**
- Must meet real-time constraints for inference and control.
- Must guard shared state (`latest_frame`, `latest_result`) across threads.
- Must validate MQTT commands before acting.
- Must fail-safe (set `running` false) on critical errors.

---

## 5.4 VisionController
**a. Classification**
The VisionController class contains three attributes (model, is_locked, last_action_time) and three operations (detect, get_navigation_command, run_birdcage).

**b. Definition**
The VisionController class handles computer vision tasks, producing detections and navigation commands based on visual input.

**c. Responsibilities**
- Perform object detection using the configured model (e.g., YOLO).
- Derive navigation commands from detections.
- Execute specialized routines (e.g., birdcage).

**d. Constraints**
- Must manage `is_locked` to prevent command thrashing.
- Must respect minimum action intervals using `last_action_time`.
- Must ensure detection results fit movement controller expectations.

---

## 5.5 MovementController
**a. Classification**
The MovementController class contains five attributes (current_position, current_station, movement_state, qr_data, obstacle_detected) and five operations (navigate_to_station, follow, avoid_obstacle, execute, stop_movement).

**b. Definition**
The MovementController class governs robot motion, station navigation, obstacle avoidance, and execution of routines linked to QR data.

**c. Responsibilities**
- Navigate to stations reliably.
- Follow directional guidance and paths.
- Detect and avoid obstacles.
- Execute routines referenced by barcodes.
- Stop movement safely when requested or required.

**d. Constraints**
- Must prioritize safety; stop on obstacle detection.
- Must integrate with QRNavigation and sensors deterministically.
- Must ensure idempotent stop behavior.
- Must handle timeouts and error states.

---

## 5.6 UltrasonicSensor
**a. Classification**
The UltrasonicSensor class contains four attributes (low_pin, echo_pin, obstacle_threshold, distance_history) and three operations (get_distance, is_obstacle_detected, cleanup).

**b. Definition**
The UltrasonicSensor class provides distance measurement and obstacle detection using ultrasonic hardware.

**c. Responsibilities**
- Measure distance reliably and record history.
- Determine obstacle presence based on a threshold.
- Release hardware resources on cleanup.

**d. Constraints**
- Must use correct pin configuration and timing for accurate readings.
- Must smooth or filter `distance_history` to reduce noise where necessary.
- Must calibrate `obstacle_threshold` for environment.

---

## 5.7 LightSensor
**a. Classification**
The LightSensor class contains one attribute (pin) and two operations (is_dark, cleanup).

**b. Definition**
The LightSensor class detects ambient light to inform movement or routine decisions.

**c. Responsibilities**
- Indicate darkness/light conditions.
- Cleanup sensor resources.

**d. Constraints**
- Must calibrate sensor readings for ambient conditions.
- Must set a sampling rate that avoids false positives.

---

## 5.8 SerialEcho
**a. Classification**
The SerialEcho class contains one attribute (ser) and two operations (read_qr, parse_rxondata).

**b. Definition**
The SerialEcho class interfaces with serial hardware to read QR and parse incoming data formats.

**c. Responsibilities**
- Read barcode/QR data from the serial stream.
- Parse raw data into usable signals.

**d. Constraints**
- Must keep serial configuration consistent (baud rate, parity, framing).
- Must handle malformed input and timeouts robustly.

---

## 5.9 QRNavigation
**a. Classification**
The QRNavigation class contains four attributes (qr_scanning, qr_locked, current_qr, object_width) and two operations (navigate_to_station, get_navigation_qr).

**b. Definition**
The QRNavigation class maps QR detections to navigation actions, coordinating scanning and lock state for movement decisions.

**c. Responsibilities**
- Translate frames and mode into station navigation decisions.
- Provide navigation instructions derived from QR values.

**d. Constraints**
- Must synchronize scanning/lock state to avoid conflicting commands.
- Must coordinate with `SerialEcho` and `MovementController` safely.

---

## 5.10 ActionModule
**a. Classification**
The ActionModule class contains three attributes (rc_board, board, agx) and five operations (run_direct_patroling, run_select_routine, run_transport_barcode, run_pick_up_cardboard, run_transport_cardboard).

**b. Definition**
The ActionModule class executes higher-level routines and actions that involve coordinated movement and manipulation.

**c. Responsibilities**
- Run patrol and selection routines.
- Transport items via barcode-based tasks.
- Execute pick-up and transport actions (e.g., cardboard).

**d. Constraints**
- Must validate hardware readiness before actions.
- Must manage transitions between routines safely.
- Must report failures and abort conditions promptly.

---

## 5.11 TTSProvider
**a. Classification**
The TTSProvider class contains one attribute (cache_dir) and one operation (speak).

**b. Definition**
The TTSProvider class produces speech output on the robot, caching assets for performance.

**c. Responsibilities**
- Synthesize speech from text and play audio.
- Manage cached artifacts for repeated phrases.

**d. Constraints**
- Must ensure voice model availability and proper codec/output.
- Must handle cache cleanup and storage limits.
