/**
 * API Service Module
 * ==================
 * 
 * This module provides a centralized API client for communicating with
 * the TonyPi backend server. It uses Axios for HTTP requests and includes:
 * 
 * Features:
 * - Centralized API configuration (base URL, timeout)
 * - Automatic authentication token handling
 * - Request/response interceptors for token management
 * - Type-safe API methods for all endpoints
 * - Error handling utilities
 * 
 * Architecture:
 * - Uses Axios instance with custom configuration
 * - Request interceptor adds auth token to all requests
 * - Response interceptor handles 401 errors (unauthorized)
 * - All API methods return typed responses
 * 
 * API Endpoints Covered:
 * - Health check
 * - Robot data (sensors, status, servos, jobs)
 * - Reports (CRUD, generation, PDF export)
 * - Management (commands, configuration)
 * - Alerts (CRUD, statistics, thresholds)
 * - Logs (CRUD, export)
 * - Authentication (login, logout)
 * - User management (admin only)
 * 
 * @example
 * // Import and use
 * import { apiService } from './api';
 * const robots = await apiService.getRobots();
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Axios: Promise-based HTTP client for the browser
// AxiosError: Type for Axios error objects
import axios, { AxiosError } from 'axios';

// Type definitions for API responses
// These ensure type safety when using API methods
import { 
  RobotData,        // Robot status and configuration
  SensorData,       // Sensor readings
  Report,           // Generated reports
  Command,          // Commands to send to robots
  CommandResponse,  // Response from robot commands
  Alert,            // Alert records
  AlertStats,       // Alert statistics
  AlertThreshold,   // Alert threshold configuration
  LogEntry,         // System log entries
  LogStats          // Log statistics
} from '../types';

// Configuration constants
import { API_BASE_URL, API_PREFIX, API_TIMEOUT } from './config';

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

/**
 * Create a configured Axios instance.
 * 
 * Using a custom instance allows us to:
 * - Set base URL for all requests
 * - Configure timeout
 * - Add interceptors for auth and error handling
 */
const api = axios.create({
  // Base URL for all requests (e.g., "http://localhost:8000")
  baseURL: API_BASE_URL,
  
  // Request timeout in milliseconds
  // If a request takes longer, it will be cancelled
  timeout: API_TIMEOUT,
});

// API version prefix (e.g., "/api/v1")
const V1 = API_PREFIX;

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

// Key used to store the JWT token in localStorage
const TOKEN_KEY = 'tonypi_access_token';

/**
 * Token service for managing JWT authentication tokens.
 * 
 * The token is stored in localStorage so it persists
 * across page refreshes and browser sessions.
 */
export const tokenService = {
  /**
   * Get the stored authentication token.
   * @returns The token string or null if not set
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  /**
   * Store an authentication token.
   * @param token - The JWT token to store
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  /**
   * Remove the stored authentication token.
   * Called during logout.
   */
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

/**
 * Request interceptor: Adds authentication token to all requests.
 * 
 * This runs before every request and:
 * 1. Gets the token from localStorage
 * 2. Adds it to the Authorization header if present
 * 
 * The token is sent as a Bearer token:
 * Authorization: Bearer <token>
 */
api.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    if (token) {
      // Add Bearer token to Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

/**
 * Response interceptor: Handles authentication errors.
 * 
 * This runs after every response and:
 * 1. Passes successful responses through unchanged
 * 2. Catches 401 (Unauthorized) errors
 * 3. Clears the invalid token
 * 4. Redirects to login page
 */
api.interceptors.response.use(
  // Success handler - just return the response
  (response) => response,
  
  // Error handler - check for 401 errors
  (error) => {
    if (error.response?.status === 401) {
      // Token is expired or invalid - clear it
      tokenService.removeToken();
      
      // Redirect to login page (root path)
      // Only redirect if not already on the login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Convert API errors to user-friendly messages.
 * 
 * This helper function extracts meaningful error messages from
 * various error types (Axios errors, network errors, etc.)
 * 
 * @param error - The error object from a failed request
 * @returns A human-readable error message
 * 
 * @example
 * try {
 *   await apiService.getRobots();
 * } catch (error) {
 *   const message = handleApiError(error);
 *   showToast(message, 'error');
 * }
 */
export const handleApiError = (error: unknown): string => {
  // Check if it's an Axios error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    
    // Try to get error detail from response body
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    
    // Handle specific HTTP status codes
    if (axiosError.response?.status === 404) {
      return 'Resource not found';
    }
    if (axiosError.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    
    // Handle timeout errors
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your connection.';
    }
    
    // Handle network errors (no response at all)
    if (!axiosError.response) {
      return 'Network error. Please check your connection.';
    }
    
    // Fallback to Axios error message
    return axiosError.message;
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Unknown error type
  return 'An unexpected error occurred';
};

// ============================================================================
// API SERVICE
// ============================================================================

/**
 * Main API service object containing all API methods.
 * 
 * Organized by feature area:
 * - Health check
 * - Robot data
 * - Reports
 * - Management
 * - Alerts
 * - Logs
 * - Authentication
 * - User management
 */
export const apiService = {
  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================
  
  /**
   * Check if the backend API is healthy.
   * @returns Health status of all services
   */
  async healthCheck() {
    const response = await api.get(`${V1}/health`);
    return response.data;
  },

  // ==========================================================================
  // ROBOT DATA
  // ==========================================================================

  /**
   * Get sensor data from InfluxDB.
   * 
   * @param measurement - Type of measurement (sensors, battery, etc.)
   * @param timeRange - Time range to query (1h, 24h, 7d, etc.)
   * @param robotId - Optional robot ID to filter by
   * @returns Array of sensor data points
   */
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

  /**
   * Get current status of all robots.
   * @returns Array of robot status objects
   */
  async getRobotStatus() {
    const response = await api.get(`${V1}/robot-data/status`);
    return response.data as RobotData[];
  },

  /**
   * Get latest data for a specific robot.
   * @param robotId - Robot identifier
   * @returns Latest sensor, battery, location, and status data
   */
  async getLatestData(robotId: string) {
    const response = await api.get(`${V1}/robot-data/latest/${robotId}`);
    return response.data;
  },

  // ==========================================================================
  // REPORTS
  // ==========================================================================

  /**
   * Get list of reports with optional filtering.
   * 
   * @param robotId - Filter by robot ID
   * @param reportType - Filter by report type (performance, job, maintenance)
   * @param limit - Maximum number of reports to return
   * @returns Array of report objects
   */
  async getReports(robotId?: string, reportType?: string, limit: number = 100) {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    
    if (robotId) params.append('robot_id', robotId);
    if (reportType) params.append('report_type', reportType);

    const response = await api.get(`${V1}/reports?${params}`);
    return response.data as Report[];
  },

  /**
   * Get a single report by ID.
   * @param reportId - Report ID
   * @returns Report object
   */
  async getReport(reportId: number) {
    const response = await api.get(`${V1}/reports/${reportId}`);
    return response.data as Report;
  },

  /**
   * Create a new report.
   * @param report - Report data (without id and created_at)
   * @returns Created report with ID
   */
  async createReport(report: Omit<Report, 'id' | 'created_at'>) {
    const response = await api.post(`${V1}/reports`, report);
    return response.data as Report;
  },

  /**
   * Delete a report.
   * @param reportId - Report ID to delete
   */
  async deleteReport(reportId: number) {
    const response = await api.delete(`${V1}/reports/${reportId}`);
    return response.data;
  },

  // ==========================================================================
  // MANAGEMENT (Robot Control)
  // ==========================================================================

  /**
   * Send a command to a robot via MQTT.
   * @param command - Command object with type and parameters
   * @returns Command response with success/failure
   */
  async sendCommand(command: Command) {
    const response = await api.post(`${V1}/management/command`, command);
    return response.data as CommandResponse;
  },

  /**
   * Get list of available robots.
   * @returns Array of robot data
   */
  async getRobots() {
    const response = await api.get(`${V1}/management/robots`);
    return response.data as RobotData[];
  },

  /**
   * Get configuration for a specific robot.
   * @param robotId - Robot identifier
   * @returns Robot configuration object
   */
  async getRobotConfig(robotId: string) {
    const response = await api.get(`${V1}/management/robots/${robotId}/config`);
    return response.data;
  },

  /**
   * Update robot configuration.
   * 
   * @param robotId - Robot identifier
   * @param configType - Type of configuration to update
   * @param configData - New configuration data
   */
  async updateRobotConfig(robotId: string, configType: string, configData: Record<string, any>) {
    const response = await api.put(`${V1}/management/robots/${robotId}/config`, {
      config_type: configType,
      config_data: configData,
    });
    return response.data;
  },

  /**
   * Send emergency stop command to a robot.
   * This immediately stops all motors and actions.
   * 
   * @param robotId - Robot identifier
   * @returns Command response
   */
  async emergencyStop(robotId: string) {
    const response = await api.post(`${V1}/management/robots/${robotId}/emergency-stop`);
    return response.data as CommandResponse;
  },

  /**
   * Get overall system status.
   * @returns System status including uptime, resource usage, service health
   */
  async getSystemStatus() {
    const response = await api.get(`${V1}/management/system/status`);
    return response.data;
  },

  // ==========================================================================
  // PI PERFORMANCE (Raspberry Pi Metrics)
  // ==========================================================================

  /**
   * Get performance metrics for a Raspberry Pi.
   * 
   * @param host - Host identifier (robot_id)
   * @param timeRange - Time range to query
   * @returns Array of performance data points
   */
  async getPiPerformance(host: string, timeRange: string = '5m') {
    const response = await api.get(`${V1}/pi/perf/${host}`, {
      params: { time_range: timeRange }
    });
    return response.data;
  },

  // ==========================================================================
  // SERVO DATA
  // ==========================================================================

  /**
   * Get servo data for a robot.
   * 
   * @param robotId - Robot identifier
   * @param timeRange - Time range to query
   * @returns Servo status data
   */
  async getServoData(robotId: string, timeRange: string = '5m') {
    const response = await api.get(`${V1}/robot-data/servos/${robotId}`, {
      params: { time_range: timeRange }
    });
    return response.data;
  },

  // ==========================================================================
  // JOB TRACKING
  // ==========================================================================

  /**
   * Get job summary for a robot (current/latest job only).
   * @param robotId - Robot identifier
   * @returns Job summary with progress and history
   */
  async getJobSummary(robotId: string) {
    const response = await api.get(`${V1}/robot-data/job-summary/${robotId}`);
    return response.data;
  },

  /**
   * Get cumulative job stats for a robot (across ALL jobs).
   * @param robotId - Robot identifier (optional - if not provided, returns stats for all robots)
   * @returns Cumulative stats including total items processed, jobs completed, etc.
   */
  async getCumulativeJobStats(robotId?: string) {
    const params = robotId ? `?robot_id=${robotId}` : '';
    const response = await api.get(`${V1}/robots-db/jobs/cumulative-stats${params}`);
    return response.data;
  },

  /**
   * Get overall job stats across ALL robots and ALL jobs.
   * @returns Aggregated statistics useful for dashboard summary cards
   */
  async getOverallJobStats() {
    const response = await api.get(`${V1}/robots-db/jobs/overall-stats`);
    return response.data;
  },

  /**
   * Get job history from database.
   * @param limit - Maximum number of jobs to return (default: 50)
   * @param robotId - Optional robot ID to filter
   * @returns Array of historical jobs
   */
  async getJobHistory(limit: number = 50, robotId?: string) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (robotId) {
      params.append('robot_id', robotId);
    }
    const response = await api.get(`${V1}/robots-db/jobs/history?${params}`);
    return response.data;
  },

  /**
   * Trigger a QR scan event (for testing).
   * 
   * @param robotId - Robot identifier
   * @param qr - QR code content
   */
  async triggerScan(robotId: string, qr: string) {
    const response = await api.post(`${V1}/robot-data/trigger-scan`, {
      robot_id: robotId,
      qr: qr
    });
    return response.data;
  },

  /**
   * Send a robot command via MQTT.
   * @param command - Command object
   */
  async sendRobotCommand(command: Record<string, any>) {
    const response = await api.post(`${V1}/robot-data/command`, command);
    return response.data;
  },

  // ==========================================================================
  // REPORT GENERATION
  // ==========================================================================

  /**
   * Generate a new report from data.
   * 
   * @param reportType - Type of report (performance, job, maintenance)
   * @param timeRange - Time range to analyze
   * @param robotId - Optional robot ID to filter
   * @returns Generated report
   */
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

  /**
   * Get AI analysis status (Gemini availability).
   * @returns AI status object
   */
  async getAIStatus() {
    const response = await api.get(`${V1}/reports/ai-status`);
    return response.data;
  },

  /**
   * Download a report as PDF.
   * 
   * @param reportId - Report ID
   * @param includeAI - Whether to include AI analysis
   * @returns PDF blob
   */
  async downloadPDF(reportId: number, includeAI: boolean = true): Promise<Blob> {
    const response = await api.get(`${V1}/reports/${reportId}/pdf`, {
      params: { include_ai: includeAI },
      responseType: 'blob'  // Important: tells Axios to expect binary data
    });
    return response.data;
  },

  // ==========================================================================
  // ALERTS API
  // ==========================================================================
  
  /**
   * Get alerts with optional filtering.
   * 
   * @param params - Filter parameters (severity, robot_id, etc.)
   * @returns Array of alert objects
   */
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

  /**
   * Get alert statistics.
   * 
   * @param timeRange - Time range for statistics
   * @param robotId - Optional robot ID filter
   * @returns Alert statistics object
   */
  async getAlertStats(timeRange: string = '24h', robotId?: string) {
    const params = new URLSearchParams({ time_range: timeRange });
    if (robotId) params.append('robot_id', robotId);
    
    const response = await api.get(`${V1}/alerts/stats?${params}`);
    return response.data as AlertStats;
  },

  /**
   * Create a new alert.
   * @param alert - Alert data
   * @returns Created alert
   */
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

  /**
   * Acknowledge an alert.
   * 
   * @param alertId - Alert ID
   * @param acknowledgedBy - Username of acknowledger
   */
  async acknowledgeAlert(alertId: number, acknowledgedBy: string = 'user') {
    const response = await api.post(`${V1}/alerts/${alertId}/acknowledge?acknowledged_by=${acknowledgedBy}`);
    return response.data;
  },

  /**
   * Mark an alert as resolved.
   * @param alertId - Alert ID
   */
  async resolveAlert(alertId: number) {
    const response = await api.post(`${V1}/alerts/${alertId}/resolve`);
    return response.data;
  },

  /**
   * Acknowledge all unacknowledged alerts.
   * 
   * @param robotId - Optional robot ID filter
   * @param acknowledgedBy - Username of acknowledger
   */
  async acknowledgeAllAlerts(robotId?: string, acknowledgedBy: string = 'user') {
    const params = new URLSearchParams({ acknowledged_by: acknowledgedBy });
    if (robotId) params.append('robot_id', robotId);
    
    const response = await api.post(`${V1}/alerts/acknowledge-all?${params}`);
    return response.data;
  },

  /**
   * Delete an alert.
   * @param alertId - Alert ID
   */
  async deleteAlert(alertId: number) {
    const response = await api.delete(`${V1}/alerts/${alertId}`);
    return response.data;
  },

  /**
   * Get alert thresholds.
   * @param robotId - Optional robot ID filter
   * @returns Array of threshold configurations
   */
  async getThresholds(robotId?: string) {
    const params = robotId ? `?robot_id=${robotId}` : '';
    const response = await api.get(`${V1}/alerts/thresholds${params}`);
    return response.data as AlertThreshold[];
  },

  /**
   * Get default threshold values.
   * @returns Default thresholds for all metric types
   */
  async getDefaultThresholds() {
    const response = await api.get(`${V1}/alerts/thresholds/defaults`);
    return response.data;
  },

  /**
   * Create or update a threshold.
   * @param threshold - Threshold data
   * @returns Created/updated threshold
   */
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

  /**
   * Update an existing threshold.
   * 
   * @param thresholdId - Threshold ID
   * @param update - Fields to update
   * @returns Updated threshold
   */
  async updateThreshold(thresholdId: number, update: {
    warning_threshold?: number;
    critical_threshold?: number;
    enabled?: boolean;
  }) {
    const response = await api.put(`${V1}/alerts/thresholds/${thresholdId}`, update);
    return response.data as AlertThreshold;
  },

  /**
   * Delete a threshold.
   * @param thresholdId - Threshold ID
   */
  async deleteThreshold(thresholdId: number) {
    const response = await api.delete(`${V1}/alerts/thresholds/${thresholdId}`);
    return response.data;
  },

  // ==========================================================================
  // LOGS API
  // ==========================================================================
  
  /**
   * Get system logs with optional filtering.
   * @param params - Filter parameters
   * @returns Array of log entries
   */
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

  /**
   * Get log statistics.
   * 
   * @param timeRange - Time range for statistics
   * @param robotId - Optional robot ID filter
   * @returns Log statistics object
   */
  async getLogStats(timeRange: string = '24h', robotId?: string) {
    const params = new URLSearchParams({ time_range: timeRange });
    if (robotId) params.append('robot_id', robotId);
    
    const response = await api.get(`${V1}/logs/stats?${params}`);
    return response.data as LogStats;
  },

  /**
   * Create a new log entry.
   * @param log - Log data
   * @returns Created log entry
   */
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

  /**
   * Get command history logs.
   * 
   * @param robotId - Optional robot ID filter
   * @param timeRange - Time range to query
   * @param limit - Maximum entries to return
   * @returns Array of command log entries
   */
  async getCommandHistory(robotId?: string, timeRange: string = '24h', limit: number = 50) {
    const params = new URLSearchParams({ time_range: timeRange, limit: String(limit) });
    if (robotId) params.append('robot_id', robotId);
    
    const response = await api.get(`${V1}/logs/commands?${params}`);
    return response.data as LogEntry[];
  },

  /**
   * Get error logs (ERROR and CRITICAL levels).
   * 
   * @param robotId - Optional robot ID filter
   * @param timeRange - Time range to query
   * @param limit - Maximum entries to return
   * @returns Array of error log entries
   */
  async getErrorLogs(robotId?: string, timeRange: string = '24h', limit: number = 50) {
    const params = new URLSearchParams({ time_range: timeRange, limit: String(limit) });
    if (robotId) params.append('robot_id', robotId);
    
    const response = await api.get(`${V1}/logs/errors?${params}`);
    return response.data as LogEntry[];
  },

  /**
   * Delete old log entries.
   * @param days - Delete logs older than this many days
   */
  async clearOldLogs(days: number = 30) {
    const response = await api.delete(`${V1}/logs/clear?days=${days}`);
    return response.data;
  },

  /**
   * Export logs as JSON or CSV.
   * 
   * @param format - Export format ('json' or 'csv')
   * @param params - Filter parameters
   * @returns Blob containing exported data
   */
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

  /**
   * Get available log categories.
   * @returns Array of category names
   */
  async getLogCategories() {
    const response = await api.get(`${V1}/logs/categories`);
    return response.data as string[];
  },

  /**
   * Get available log levels with metadata.
   * @returns Log level configuration
   */
  async getLogLevels() {
    const response = await api.get(`${V1}/logs/levels`);
    return response.data;
  },

  // ==========================================================================
  // AUTHENTICATION API
  // ==========================================================================
  
  /**
   * Log in with username and password.
   * 
   * @param username - User's username
   * @param password - User's password
   * @returns Access token and user object
   */
  async login(username: string, password: string) {
    const response = await api.post(`${V1}/auth/login`, { username, password });
    const { access_token, user } = response.data;
    
    // Store the token for future requests
    tokenService.setToken(access_token);
    
    return { access_token, user };
  },

  /**
   * Get current authenticated user.
   * @returns User object
   */
  async getCurrentUser() {
    const response = await api.get(`${V1}/auth/me`);
    return response.data;
  },

  /**
   * Log out the current user.
   * Removes the stored authentication token.
   */
  logout() {
    tokenService.removeToken();
  },

  // ==========================================================================
  // USER MANAGEMENT API (Admin only)
  // ==========================================================================
  
  /**
   * Get all users (admin only).
   * @returns Array of user objects
   */
  async getUsers() {
    const response = await api.get(`${V1}/users`);
    return response.data;
  },

  /**
   * Get a specific user by ID (admin only).
   * @param userId - User ID
   * @returns User object
   */
  async getUser(userId: string) {
    const response = await api.get(`${V1}/users/${userId}`);
    return response.data;
  },

  /**
   * Create a new user (admin only).
   * @param userData - New user data
   * @returns Created user object
   */
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'operator' | 'viewer';
  }) {
    const response = await api.post(`${V1}/users`, userData);
    return response.data;
  },

  /**
   * Update an existing user (admin only).
   * 
   * @param userId - User ID
   * @param userData - Fields to update
   * @returns Updated user object
   */
  async updateUser(userId: string, userData: {
    email?: string;
    password?: string;
    role?: 'admin' | 'operator' | 'viewer';
    is_active?: boolean;
  }) {
    const response = await api.put(`${V1}/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Delete a user (admin only).
   * @param userId - User ID
   */
  async deleteUser(userId: string) {
    const response = await api.delete(`${V1}/users/${userId}`);
    return response.data;
  },
};

// Export the API service as the default export
export default apiService;
