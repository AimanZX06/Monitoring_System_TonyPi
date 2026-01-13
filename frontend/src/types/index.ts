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