/**
 * Grafana utility functions
 * Handles Grafana availability checking and URL configuration
 */

// Grafana configuration - defaults to enabled and localhost:3000
const GRAFANA_URL = process.env.REACT_APP_GRAFANA_URL || 'http://localhost:3000';
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

