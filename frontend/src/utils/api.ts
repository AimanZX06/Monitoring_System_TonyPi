import axios from 'axios';
import { RobotData, SensorData, Report, Command, CommandResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const apiService = {
  // Health check
  async healthCheck() {
    const response = await api.get('/api/health');
    return response.data;
  },

  // Robot data
  async getSensorData(measurement: string, timeRange: string = '1h', robotId?: string) {
    const params = new URLSearchParams({
      measurement,
      time_range: timeRange,
    });
    
    if (robotId) {
      params.append('robot_id', robotId);
    }

    const response = await api.get(`/api/robot-data/sensors?${params}`);
    return response.data as SensorData[];
  },

  async getRobotStatus() {
    const response = await api.get('/api/robot-data/status');
    return response.data as RobotData[];
  },

  async getLatestData(robotId: string) {
    const response = await api.get(`/api/robot-data/latest/${robotId}`);
    return response.data;
  },

  // Reports
  async getReports(robotId?: string, reportType?: string, limit: number = 100) {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    
    if (robotId) params.append('robot_id', robotId);
    if (reportType) params.append('report_type', reportType);

    const response = await api.get(`/api/reports?${params}`);
    return response.data as Report[];
  },

  async getReport(reportId: number) {
    const response = await api.get(`/api/reports/${reportId}`);
    return response.data as Report;
  },

  async createReport(report: Omit<Report, 'id' | 'created_at'>) {
    const response = await api.post('/api/reports', report);
    return response.data as Report;
  },

  async deleteReport(reportId: number) {
    const response = await api.delete(`/api/reports/${reportId}`);
    return response.data;
  },

  // Management
  async sendCommand(command: Command) {
    const response = await api.post('/api/management/command', command);
    return response.data as CommandResponse;
  },

  async getRobots() {
    const response = await api.get('/api/management/robots');
    return response.data as RobotData[];
  },

  async getRobotConfig(robotId: string) {
    const response = await api.get(`/api/management/robots/${robotId}/config`);
    return response.data;
  },

  async updateRobotConfig(robotId: string, configType: string, configData: Record<string, any>) {
    const response = await api.put(`/api/management/robots/${robotId}/config`, {
      config_type: configType,
      config_data: configData,
    });
    return response.data;
  },

  async emergencyStop(robotId: string) {
    const response = await api.post(`/api/management/robots/${robotId}/emergency-stop`);
    return response.data as CommandResponse;
  },

  async getSystemStatus() {
    const response = await api.get('/api/management/system/status');
    return response.data;
  },

  // Pi Performance
  async getPiPerformance(host: string, timeRange: string = '5m') {
    const response = await api.get(`/api/pi/perf/${host}`, {
      params: { time_range: timeRange }
    });
    return response.data;
  },

  // Servo Data
  async getServoData(robotId: string, timeRange: string = '5m') {
    const response = await api.get(`/api/robot-data/servos/${robotId}`, {
      params: { time_range: timeRange }
    });
    return response.data;
  },
};

export default apiService;