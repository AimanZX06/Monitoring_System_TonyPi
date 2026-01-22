/**
 * =============================================================================
 * Grafana Utility Functions - Panel Integration and Health Checking
 * =============================================================================
 * 
 * This module provides utilities for integrating Grafana dashboards into the
 * React frontend, including health checks and URL building.
 * 
 * FEATURES:
 *   - Grafana availability checking with timeout
 *   - Panel URL building with variable support
 *   - Dashboard URL generation
 *   - Configurable via environment variables
 * 
 * ENVIRONMENT VARIABLES:
 *   - REACT_APP_GRAFANA_URL:     Grafana base URL (default: http://localhost:3000)
 *   - REACT_APP_GRAFANA_ENABLED: Enable/disable Grafana (default: true)
 * 
 * URL FORMATS:
 *   Panel (solo):     /d-solo/{uid}/{uid}?panelId={id}&...
 *   Dashboard (full): /d/{uid}
 * 
 * PANEL EMBEDDING:
 *   Grafana panels are embedded via iframes using the d-solo endpoint.
 *   This provides a single panel without the full dashboard UI.
 * 
 * USAGE:
 *   import { buildGrafanaPanelUrl, checkGrafanaAvailability } from './grafana';
 *   
 *   // Check if Grafana is available
 *   const isAvailable = await checkGrafanaAvailability();
 *   
 *   // Build panel URL
 *   const url = buildGrafanaPanelUrl('tonypi', 1, {
 *     robotId: 'tonypi_001',
 *     from: 'now-1h',
 *     theme: 'dark'
 *   });
 *   
 *   // Use in iframe
 *   <iframe src={url} />
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

// Grafana base URL - defaults to localhost for development
const GRAFANA_URL = process.env.REACT_APP_GRAFANA_URL || 'http://localhost:3000';

// Feature flag to enable/disable Grafana integration entirely
const GRAFANA_ENABLED = process.env.REACT_APP_GRAFANA_ENABLED !== 'false'; // Default: true (enabled)

/**
 * Check if Grafana service is available
 * Uses a simple fetch to the Grafana health endpoint
 */
export const checkGrafanaAvailability = async (): Promise<boolean> => {
  if (!GRAFANA_ENABLED) {
    return false;
  }

  try {
    // Try to fetch Grafana's public API endpoint
    // Using no-cors mode to avoid CORS issues, but we can detect network errors
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(`${GRAFANA_URL}/api/health`, {
      method: 'GET',
      mode: 'no-cors', // Avoid CORS issues
      cache: 'no-cache',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return true; // If no error, assume available
  } catch (error) {
    // Network error or timeout - Grafana likely unavailable
    return false;
  }
};

/**
 * Build Grafana panel URL
 */
export const buildGrafanaPanelUrl = (
  dashboardUid: string,
  panelId: number,
  options: {
    robotId?: string;
    from?: string;
    to?: string;
    refresh?: string;
    theme?: 'light' | 'dark';
  } = {}
): string => {
  const {
    robotId,
    from = 'now-1h',
    to = 'now',
    refresh = '5s',
    theme = 'light'
  } = options;

  const params = new URLSearchParams({
    orgId: '1',
    refresh,
    theme,
    panelId: panelId.toString(),
    from,
    to
  });

  if (robotId) {
    params.append('var-robot_id', robotId);
  }

  return `${GRAFANA_URL}/d-solo/${dashboardUid}/${dashboardUid}?${params.toString()}`;
};

/**
 * Get Grafana dashboard URL
 */
export const getGrafanaDashboardUrl = (dashboardUid: string): string => {
  return `${GRAFANA_URL}/d/${dashboardUid}`;
};

export { GRAFANA_URL, GRAFANA_ENABLED };

