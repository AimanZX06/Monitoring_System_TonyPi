import axios, { AxiosError } from 'axios';
import { RobotData, SensorData, Report, Command, CommandResponse } from '../types';
import { API_BASE_URL, API_PREFIX, API_TIMEOUT } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

// API version prefix for all endpoints
const V1 = API_PREFIX;

// Error handler helper
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    if (axiosError.response?.status === 404) {
      return 'Resource not found';
    }
    if (axiosError.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your connection.';
    }
    if (!axiosError.response) {
      return 'Network error. Please check your connection.';
    }
    return axiosError.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const apiService = {
  // Health check
  async healthCheck() {
    const response = await api.get(`${V1}/health`);
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

    const response = await api.get(`${V1}/robot-data/sensors?${params}`);
    return response.data as SensorData[];
  },

  async getRobotStatus() {
    const response = await api.get(`${V1}/robot-data/status`);
    return response.data as RobotData[];
  },

  async getLatestData(robotId: string) {
    const response = await api.get(`${V1}/robot-data/latest/${robotId}`);
    return response.data;
  },

  // Reports
  async getReports(robotId?: string, reportType?: string, limit: number = 100) {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    
    if (robotId) params.append('robot_id', robotId);
    if (reportType) params.append('report_type', reportType);

    const response = await api.get(`${V1}/reports?${params}`);
    return response.data as Report[];
  },

  async getReport(reportId: number) {
    const response = await api.get(`${V1}/reports/${reportId}`);
    return response.data as Report;
  },

  async createReport(report: Omit<Report, 'id' | 'created_at'>) {
    const response = await api.post(`${V1}/reports`, report);
    return response.data as Report;
  },

  async deleteReport(reportId: number) {
    const response = await api.delete(`${V1}/reports/${reportId}`);
    return response.data;
  },

  // Management
  async sendCommand(command: Command) {
    const response = await api.post(`${V1}/management/command`, command);
    return response.data as CommandResponse;
  },

  async getRobots() {
    const response = await api.get(`${V1}/management/robots`);
    return response.data as RobotData[];
  },

  async getRobotConfig(robotId: string) {
    const response = await api.get(`${V1}/management/robots/${robotId}/config`);
    return response.data;
  },

  async updateRobotConfig(robotId: string, configType: string, configData: Record<string, any>) {
    const response = await api.put(`${V1}/management/robots/${robotId}/config`, {
      config_type: configType,
      config_data: configData,
    });
    return response.data;
  },

  async emergencyStop(robotId: string) {
    const response = await api.post(`${V1}/management/robots/${robotId}/emergency-stop`);
    return response.data as CommandResponse;
  },

  async getSystemStatus() {
    const response = await api.get(`${V1}/management/system/status`);
    return response.data;
  },

  // Pi Performance
  async getPiPerformance(host: string, timeRange: string = '5m') {
    const response = await api.get(`${V1}/pi/perf/${host}`, {
      params: { time_range: timeRange }
    });
    return response.data;
  },

  // Servo data
  async getServoData(robotId: string, timeRange: string = '5m') {
    const response = await api.get(`${V1}/robot-data/servos/${robotId}`, {
      params: { time_range: timeRange }
    });
    return response.data;
  },

  // Job summary
  async getJobSummary(robotId: string) {
    const response = await api.get(`${V1}/robot-data/job-summary/${robotId}`);
    return response.data;
  },

  // Trigger scan
  async triggerScan(robotId: string, qr: string) {
    const response = await api.post(`${V1}/robot-data/trigger-scan`, {
      robot_id: robotId,
      qr: qr
    });
    return response.data;
  },

  // Send robot command
  async sendRobotCommand(command: Record<string, any>) {
    const response = await api.post(`${V1}/robot-data/command`, command);
    return response.data;
  },

  // Generate report
  async generateReport(reportType: string, timeRange: string, robotId?: string) {
    const params = new URLSearchParams({
      report_type: reportType,
      time_range: timeRange,
    });
    if (robotId) {
      params.append('robot_id', robotId);
    }
    const response = await api.post(`${V1}/reports/generate?${params}`);
    return response.data;
  },

  // Get AI status
  async getAIStatus() {
    const response = await api.get(`${V1}/reports/ai-status`);
    return response.data;
  },

  // Download PDF
  async downloadPDF(reportId: number, includeAI: boolean = true): Promise<Blob> {
    const response = await api.get(`${V1}/reports/${reportId}/pdf`, {
      params: { include_ai: includeAI },
      responseType: 'blob'
    });
    return response.data;
  },
};

export default apiService;