import axios, { AxiosError } from 'axios';
import { RobotData, SensorData, Report, Command, CommandResponse, Alert, AlertStats, AlertThreshold, LogEntry, LogStats } from '../types';
import { API_BASE_URL, API_PREFIX, API_TIMEOUT } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

// API version prefix for all endpoints
const V1 = API_PREFIX;

// Token management
const TOKEN_KEY = 'tonypi_access_token';

export const tokenService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      tokenService.removeToken();
      // Optionally redirect to login
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

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

  // ============================================
  // ALERTS API
  // ============================================
  
  async getAlerts(params: {
    severity?: string;
    robot_id?: string;
    alert_type?: string;
    time_range?: string;
    acknowledged?: boolean;
    resolved?: boolean;
    limit?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.severity) queryParams.append('severity', params.severity);
    if (params.robot_id) queryParams.append('robot_id', params.robot_id);
    if (params.alert_type) queryParams.append('alert_type', params.alert_type);
    if (params.time_range) queryParams.append('time_range', params.time_range);
    if (params.acknowledged !== undefined) queryParams.append('acknowledged', String(params.acknowledged));
    if (params.resolved !== undefined) queryParams.append('resolved', String(params.resolved));
    if (params.limit) queryParams.append('limit', String(params.limit));
    
    const response = await api.get(`${V1}/alerts?${queryParams}`);
    return response.data as Alert[];
  },

  async getAlertStats(timeRange: string = '24h', robotId?: string) {
    const params = new URLSearchParams({ time_range: timeRange });
    if (robotId) params.append('robot_id', robotId);
    
    const response = await api.get(`${V1}/alerts/stats?${params}`);
    return response.data as AlertStats;
  },

  async createAlert(alert: {
    robot_id?: string;
    alert_type: string;
    severity: string;
    title: string;
    message: string;
    source?: string;
    value?: number;
    threshold?: number;
    details?: any;
  }) {
    const response = await api.post(`${V1}/alerts`, alert);
    return response.data as Alert;
  },

  async acknowledgeAlert(alertId: number, acknowledgedBy: string = 'user') {
    const response = await api.post(`${V1}/alerts/${alertId}/acknowledge?acknowledged_by=${acknowledgedBy}`);
    return response.data;
  },

  async resolveAlert(alertId: number) {
    const response = await api.post(`${V1}/alerts/${alertId}/resolve`);
    return response.data;
  },

  async acknowledgeAllAlerts(robotId?: string, acknowledgedBy: string = 'user') {
    const params = new URLSearchParams({ acknowledged_by: acknowledgedBy });
    if (robotId) params.append('robot_id', robotId);
    
    const response = await api.post(`${V1}/alerts/acknowledge-all?${params}`);
    return response.data;
  },

  async deleteAlert(alertId: number) {
    const response = await api.delete(`${V1}/alerts/${alertId}`);
    return response.data;
  },

  async getThresholds(robotId?: string) {
    const params = robotId ? `?robot_id=${robotId}` : '';
    const response = await api.get(`${V1}/alerts/thresholds${params}`);
    return response.data as AlertThreshold[];
  },

  async getDefaultThresholds() {
    const response = await api.get(`${V1}/alerts/thresholds/defaults`);
    return response.data;
  },

  async createOrUpdateThreshold(threshold: {
    robot_id?: string;
    metric_type: string;
    warning_threshold: number;
    critical_threshold: number;
    enabled?: boolean;
  }) {
    const response = await api.post(`${V1}/alerts/thresholds`, threshold);
    return response.data as AlertThreshold;
  },

  async updateThreshold(thresholdId: number, update: {
    warning_threshold?: number;
    critical_threshold?: number;
    enabled?: boolean;
  }) {
    const response = await api.put(`${V1}/alerts/thresholds/${thresholdId}`, update);
    return response.data as AlertThreshold;
  },

  async deleteThreshold(thresholdId: number) {
    const response = await api.delete(`${V1}/alerts/thresholds/${thresholdId}`);
    return response.data;
  },

  // ============================================
  // LOGS API
  // ============================================
  
  async getLogs(params: {
    level?: string;
    category?: string;
    robot_id?: string;
    search?: string;
    time_range?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.level) queryParams.append('level', params.level);
    if (params.category) queryParams.append('category', params.category);
    if (params.robot_id) queryParams.append('robot_id', params.robot_id);
    if (params.search) queryParams.append('search', params.search);
    if (params.time_range) queryParams.append('time_range', params.time_range);
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.offset) queryParams.append('offset', String(params.offset));
    
    const response = await api.get(`${V1}/logs?${queryParams}`);
    return response.data as LogEntry[];
  },

  async getLogStats(timeRange: string = '24h', robotId?: string) {
    const params = new URLSearchParams({ time_range: timeRange });
    if (robotId) params.append('robot_id', robotId);
    
    const response = await api.get(`${V1}/logs/stats?${params}`);
    return response.data as LogStats;
  },

  async createLog(log: {
    level: string;
    category: string;
    message: string;
    robot_id?: string;
    details?: any;
  }) {
    const response = await api.post(`${V1}/logs`, log);
    return response.data as LogEntry;
  },

  async getCommandHistory(robotId?: string, timeRange: string = '24h', limit: number = 50) {
    const params = new URLSearchParams({ time_range: timeRange, limit: String(limit) });
    if (robotId) params.append('robot_id', robotId);
    
    const response = await api.get(`${V1}/logs/commands?${params}`);
    return response.data as LogEntry[];
  },

  async getErrorLogs(robotId?: string, timeRange: string = '24h', limit: number = 50) {
    const params = new URLSearchParams({ time_range: timeRange, limit: String(limit) });
    if (robotId) params.append('robot_id', robotId);
    
    const response = await api.get(`${V1}/logs/errors?${params}`);
    return response.data as LogEntry[];
  },

  async clearOldLogs(days: number = 30) {
    const response = await api.delete(`${V1}/logs/clear?days=${days}`);
    return response.data;
  },

  async exportLogs(format: 'json' | 'csv', params: {
    time_range?: string;
    level?: string;
    category?: string;
    robot_id?: string;
  } = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params.time_range) queryParams.append('time_range', params.time_range);
    if (params.level) queryParams.append('level', params.level);
    if (params.category) queryParams.append('category', params.category);
    if (params.robot_id) queryParams.append('robot_id', params.robot_id);
    
    const response = await api.get(`${V1}/logs/export/${format}?${queryParams}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async getLogCategories() {
    const response = await api.get(`${V1}/logs/categories`);
    return response.data as string[];
  },

  async getLogLevels() {
    const response = await api.get(`${V1}/logs/levels`);
    return response.data;
  },

  // ============================================
  // AUTHENTICATION API
  // ============================================
  
  async login(username: string, password: string) {
    const response = await api.post(`${V1}/auth/login`, { username, password });
    const { access_token, user } = response.data;
    tokenService.setToken(access_token);
    return { access_token, user };
  },

  async getCurrentUser() {
    const response = await api.get(`${V1}/auth/me`);
    return response.data;
  },

  logout() {
    tokenService.removeToken();
  },

  // ============================================
  // USER MANAGEMENT API (Admin only)
  // ============================================
  
  async getUsers() {
    const response = await api.get(`${V1}/users`);
    return response.data;
  },

  async getUser(userId: string) {
    const response = await api.get(`${V1}/users/${userId}`);
    return response.data;
  },

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'operator' | 'viewer';
  }) {
    const response = await api.post(`${V1}/users`, userData);
    return response.data;
  },

  async updateUser(userId: string, userData: {
    email?: string;
    password?: string;
    role?: 'admin' | 'operator' | 'viewer';
    is_active?: boolean;
  }) {
    const response = await api.put(`${V1}/users/${userId}`, userData);
    return response.data;
  },

  async deleteUser(userId: string) {
    const response = await api.delete(`${V1}/users/${userId}`);
    return response.data;
  },
};

export default apiService;