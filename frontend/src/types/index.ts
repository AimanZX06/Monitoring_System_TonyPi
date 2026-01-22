/**
 * =============================================================================
 * TypeScript Type Definitions - Frontend Data Models
 * =============================================================================
 * 
 * This file contains all the TypeScript interfaces used throughout the frontend
 * application. These types match the backend API response formats and ensure
 * type safety when handling data from the API.
 * 
 * ORGANIZATION:
 *   - Robot Data Types      - Robot status and telemetry
 *   - Sensor Data Types     - Time-series sensor data
 *   - Report Types          - Generated reports
 *   - Command Types         - Robot command system
 *   - Alert Types           - Alert and notification data
 *   - Log Types             - System log entries
 * 
 * NAMING CONVENTIONS:
 *   - Interfaces are PascalCase (e.g., RobotData)
 *   - Properties match backend API field names (snake_case)
 *   - Optional properties use '?' suffix
 *   - Nullable properties use 'type | null'
 */

// =============================================================================
// ROBOT DATA TYPES
// =============================================================================

/**
 * Represents a robot's current status and configuration.
 * 
 * This is the primary data structure for robot information,
 * returned by GET /api/v1/robot/status endpoint.
 * 
 * STATUS VALUES:
 *   - "online"  - Robot is connected and communicating
 *   - "offline" - Robot has not sent data recently
 *   - "idle"    - Robot is connected but not active
 *   - "busy"    - Robot is executing a task
 */
export interface RobotData {
  robot_id: string;         // Unique identifier (e.g., "tonypi_raspberrypi")
  name?: string;            // Human-readable name (optional)
  status: string;           // Current status (online/offline/idle/busy)
  battery_percentage?: number; // Battery level 0-100% (from battery sensor)
  last_seen: string;        // ISO timestamp of last communication
  location?: {              // 3D position in workspace (optional)
    x: number;              // X coordinate (meters)
    y: number;              // Y coordinate (meters)
    z: number;              // Z coordinate (height, meters)
    heading?: number;       // Orientation in degrees (optional)
  };
  sensors?: { [key: string]: number };  // Dictionary of sensor readings
  ip_address?: string;      // Robot's IP address for direct connection
  camera_url?: string;      // URL to robot's camera stream
}

// =============================================================================
// SENSOR DATA TYPES
// =============================================================================

/**
 * Represents a single sensor data point from InfluxDB.
 * 
 * Used for displaying time-series data in charts and graphs.
 * Matches the format returned by InfluxDB queries.
 */
export interface SensorData {
  timestamp: Date;          // When the reading was taken
  measurement: string;      // InfluxDB measurement name (e.g., "robot_status")
  field: string;            // Specific field within measurement
  value: number | string | boolean;  // The sensor reading value
  robot_id?: string;        // Which robot sent this data (optional)
  sensor_type?: string;     // Type of sensor (temperature, cpu, etc.)
  unit?: string;            // Unit of measurement (%, °C, m, etc.)
}

// =============================================================================
// REPORT TYPES
// =============================================================================

/**
 * Represents a generated report stored in the database.
 * 
 * Reports are created via the Reports page and can be downloaded as PDFs.
 * The 'data' field contains the full report content as JSON.
 * 
 * REPORT TYPES:
 *   - "performance"   - CPU, memory, temperature metrics
 *   - "job"          - Task execution statistics
 *   - "maintenance"  - Servo health and wear analysis
 */
export interface Report {
  id: number;               // Unique report ID (auto-generated)
  title: string;            // Report title
  description: string | null; // Optional description
  robot_id: string | null;  // Associated robot (null = all robots)
  report_type: string;      // Type: performance/job/maintenance
  created_at: string;       // ISO timestamp when report was generated
  data?: Record<string, any>; // Full report data as JSON
  created_by?: string | null; // User who generated the report
}

// =============================================================================
// COMMAND TYPES
// =============================================================================

/**
 * Represents a command to be sent to a robot via MQTT.
 * 
 * Commands are sent from the frontend to the backend, which then
 * publishes them to the MQTT broker for the robot to receive.
 */
export interface Command {
  command: string;          // Command type (move, stop, head_nod, etc.)
  parameters?: Record<string, any>;  // Command-specific parameters
  robot_id: string;         // Target robot to receive the command
}

/**
 * Response received after sending a command.
 * 
 * The robot processes the command and sends back a response
 * indicating success or failure.
 */
export interface CommandResponse {
  success: boolean;         // Whether the command was executed successfully
  message: string;          // Human-readable result message
  command_id?: string;      // Unique command ID for tracking (optional)
}

/**
 * Represents a raw MQTT message.
 * 
 * Used for debugging and monitoring MQTT communication.
 */
export interface MqttMessage {
  topic: string;            // MQTT topic (e.g., "tonypi/status/robot_id")
  payload: any;             // Message payload (typically JSON)
  timestamp: Date;          // When the message was received
}

// =============================================================================
// ALERT TYPES
// =============================================================================

/**
 * Represents an alert generated by the system.
 * 
 * Alerts are created when sensor values exceed thresholds or
 * when anomalous conditions are detected.
 * 
 * SEVERITY LEVELS:
 *   - "info"     - Informational, no action needed
 *   - "warning"  - Attention needed, but not critical
 *   - "critical" - Immediate action required
 * 
 * ALERT LIFECYCLE:
 *   Created -> Acknowledged -> Resolved
 */
export interface Alert {
  id: number;               // Unique alert ID
  robot_id: string | null;  // Associated robot (null = system-wide)
  alert_type: string;       // Type: temperature, battery, cpu, memory, servo
  severity: string;         // Severity: info, warning, critical
  title: string;            // Alert title/subject
  message: string;          // Detailed alert message
  source: string | null;    // Source component that generated alert
  value: number | null;     // Actual value that triggered alert
  threshold: number | null; // Threshold value that was exceeded
  acknowledged: boolean;    // Has someone acknowledged this alert?
  acknowledged_by: string | null; // Username who acknowledged
  acknowledged_at: string | null; // When it was acknowledged (ISO timestamp)
  resolved: boolean;        // Has the issue been resolved?
  resolved_at: string | null; // When it was resolved (ISO timestamp)
  details: any;             // Additional JSON details
  created_at: string;       // When the alert was created (ISO timestamp)
}

/**
 * Statistics summary of alerts in a time period.
 * 
 * Used for dashboard cards and overview displays.
 */
export interface AlertStats {
  total: number;            // Total number of alerts
  critical: number;         // Number of critical alerts
  warning: number;          // Number of warning alerts
  info: number;             // Number of info alerts
  unacknowledged: number;   // Alerts not yet acknowledged
  unresolved: number;       // Alerts not yet resolved
}

/**
 * Configurable threshold for alert generation.
 * 
 * When sensor values cross these thresholds, alerts are automatically
 * generated. Thresholds can be set globally or per-robot.
 */
export interface AlertThreshold {
  id: number;               // Unique threshold ID
  robot_id: string | null;  // Specific robot (null = all robots)
  metric_type: string;      // Metric: cpu, memory, temperature, battery, servo_temp
  warning_threshold: number; // Value that triggers warning alert
  critical_threshold: number; // Value that triggers critical alert
  enabled: boolean;         // Whether this threshold is active
}

// =============================================================================
// LOG TYPES
// =============================================================================

/**
 * Represents a system log entry.
 * 
 * Logs are stored in PostgreSQL and provide an audit trail of
 * all significant events in the monitoring system.
 * 
 * LOG LEVELS (by severity):
 *   - INFO     - Normal operation events
 *   - WARNING  - Potential issues
 *   - ERROR    - Errors that need attention
 *   - CRITICAL - Severe errors
 * 
 * CATEGORIES:
 *   - mqtt, api, database, system, command, robot, alert, servo, etc.
 */
export interface LogEntry {
  id: number;               // Unique log entry ID
  level: string;            // Log level: INFO, WARNING, ERROR, CRITICAL
  category: string;         // Category: mqtt, api, database, etc.
  message: string;          // Log message content
  robot_id: string | null;  // Associated robot (null = system-wide)
  details: any;             // Additional JSON details (stack traces, context)
  timestamp: string;        // When the log was created (ISO timestamp)
}

/**
 * Statistics summary of logs in a time period.
 * 
 * Used for dashboard cards and filtering indicators.
 */
export interface LogStats {
  total: number;            // Total number of logs
  info: number;             // Count of INFO level logs
  warning: number;          // Count of WARNING level logs
  error: number;            // Count of ERROR level logs
  critical: number;         // Count of CRITICAL level logs
  by_category: Record<string, number>; // Count by category
}