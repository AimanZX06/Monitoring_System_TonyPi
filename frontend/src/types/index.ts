export interface RobotData {
  robot_id: string;
  name?: string;
  status: string;
  battery_percentage?: number;
  battery_level?: number;
  last_seen: string;
  location?: {
    x: number;
    y: number;
    z: number;
    heading?: number;
  };
  sensors?: { [key: string]: number };
  ip_address?: string;
  camera_url?: string;
}

export interface SensorData {
  timestamp: Date;
  measurement: string;
  field: string;
  value: number;
  robot_id?: string;
  sensor_type?: string;
}

export interface Report {
  id: number;
  title: string;
  description: string | null;
  robot_id: string | null;
  report_type: string;
  created_at: string;
  data?: Record<string, any>;
  created_by?: string | null;
}

export interface Command {
  command: string;
  parameters?: Record<string, any>;
  robot_id: string;
}

export interface CommandResponse {
  success: boolean;
  message: string;
  command_id?: string;
}

export interface MqttMessage {
  topic: string;
  payload: any;
  timestamp: Date;
}

export interface Alert {
  id: number;
  robot_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  source: string | null;
  value: number | null;
  threshold: number | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved: boolean;
  resolved_at: string | null;
  details: any;
  created_at: string;
}

export interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  unacknowledged: number;
  unresolved: number;
}

export interface AlertThreshold {
  id: number;
  robot_id: string | null;
  metric_type: string;
  warning_threshold: number;
  critical_threshold: number;
  enabled: boolean;
}

export interface LogEntry {
  id: number;
  level: string;
  category: string;
  message: string;
  robot_id: string | null;
  details: any;
  timestamp: string;
}

export interface LogStats {
  total: number;
  info: number;
  warning: number;
  error: number;
  critical: number;
  by_category: Record<string, number>;
}