/**
 * =============================================================================
 * Configuration - Centralized Settings for TonyPi Monitoring System
 * =============================================================================
 * 
 * This file contains all configuration values for the frontend application.
 * Values can be overridden using environment variables (REACT_APP_* prefix).
 * 
 * ENVIRONMENT VARIABLES:
 *   - REACT_APP_API_URL        - Backend API URL (default: http://localhost:8000)
 *   - REACT_APP_MQTT_BROKER_URL - WebSocket MQTT URL (default: ws://localhost:9001)
 *   - REACT_APP_GRAFANA_URL    - Grafana dashboard URL (default: http://localhost:3000)
 * 
 * CONFIGURATION SECTIONS:
 *   1. API Configuration     - Backend REST API settings
 *   2. MQTT Configuration    - Real-time message broker settings
 *   3. Grafana Configuration - Dashboard visualization settings
 *   4. Polling Intervals     - Auto-refresh timing settings
 *   5. Alert Thresholds      - Frontend warning/danger thresholds
 * 
 * DOCKER vs LOCAL DEVELOPMENT:
 *   - In Docker: Services communicate via container names
 *   - Local: Services run on localhost with different ports
 *   - Environment variables should be set in .env or docker-compose.yml
 */

// =============================================================================
// API CONFIGURATION
// =============================================================================

// Base URL for the FastAPI backend server
// In Docker: http://backend:8000, Local: http://localhost:8000
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;
export const API_TIMEOUT = 10000;

// MQTT Configuration
export const MQTT_BROKER_URL = process.env.REACT_APP_MQTT_BROKER_URL || 'ws://localhost:9001';

// Grafana Configuration
export const GRAFANA_BASE_URL = process.env.REACT_APP_GRAFANA_URL || 'http://localhost:3000';
export const GRAFANA_DASHBOARD_UID = 'tonypi-robot-monitoring';

// Build Grafana panel URL
export const getGrafanaPanelUrl = (panelId: number, theme: 'light' | 'dark' = 'light') => {
  return `${GRAFANA_BASE_URL}/d-solo/${GRAFANA_DASHBOARD_UID}/${GRAFANA_DASHBOARD_UID}?orgId=1&refresh=5s&theme=${theme}&panelId=${panelId}`;
};

// Build full Grafana dashboard URL
export const getGrafanaDashboardUrl = () => {
  return `${GRAFANA_BASE_URL}/d/${GRAFANA_DASHBOARD_UID}`;
};

// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  robotStatus: 5000,
  sensorData: 5000,
  jobSummary: 5000,
  servoData: 5000,
  performance: 5000,
};

// Alert thresholds
export const THRESHOLDS = {
  cpu: { warning: 60, danger: 80 },
  memory: { warning: 70, danger: 85 },
  disk: { warning: 75, danger: 90 },
  temperature: { warning: 60, danger: 75 },
  battery: { warning: 30, danger: 15 },
};

export default {
  API_BASE_URL,
  API_VERSION,
  API_PREFIX,
  API_TIMEOUT,
  MQTT_BROKER_URL,
  GRAFANA_BASE_URL,
  GRAFANA_DASHBOARD_UID,
  getGrafanaPanelUrl,
  getGrafanaDashboardUrl,
  POLLING_INTERVALS,
  THRESHOLDS,
};
