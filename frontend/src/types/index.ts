export interface RobotData {
  robot_id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  battery_percentage: number;
  last_seen: Date;
  location?: {
    x: number;
    y: number;
    z: number;
    heading: number;
  };
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
  description: string;
  robot_id: string;
  report_type: string;
  created_at: Date;
  data?: Record<string, any>;
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