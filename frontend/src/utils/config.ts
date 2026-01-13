/**
 * Centralized configuration for the TonyPi Monitoring System
 * All URLs and settings should be configured here
 */

// API Configuration
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
