/**
 * =============================================================================
 * GrafanaPanel Component - Embedded Grafana Dashboard Panel
 * =============================================================================
 * 
 * This component embeds a Grafana dashboard panel inside the React application
 * using an iframe. It displays time-series visualizations from the Grafana
 * service running alongside the monitoring system.
 * 
 * PURPOSE:
 *   Grafana is a powerful visualization tool that connects to InfluxDB to
 *   display robot telemetry data as charts and graphs. This component allows
 *   embedding those visualizations directly in the React frontend.
 * 
 * HOW TO GET PANEL URL:
 *   1. Open Grafana dashboard (typically http://localhost:3001)
 *   2. Click on a panel's title menu → Share → Embed
 *   3. Copy the iframe src URL (includes panel ID and query params)
 * 
 * FEATURES:
 *   - Loading spinner while panel loads
 *   - Error fallback when Grafana is unavailable
 *   - URL validation (must start with http:// or https://)
 *   - Configurable width and height
 *   - Auto-refresh support (via Grafana panel settings)
 * 
 * COMMON ISSUES:
 *   - Panel not loading: Check if Grafana service is running
 *   - CORS errors: Grafana must allow embedding (anonymous access enabled)
 *   - Empty panel: Check InfluxDB data source connection
 * 
 * GRAFANA CONFIGURATION (in docker-compose.yml):
 *   - GF_AUTH_ANONYMOUS_ENABLED=true   - Allow anonymous access
 *   - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer - Set anonymous role
 *   - GF_SECURITY_ALLOW_EMBEDDING=true  - Allow iframe embedding
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React core - state management and effects
import React, { useState, useEffect } from 'react';

// Lucide React icon - error state indicator
import { AlertCircle } from 'lucide-react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for the GrafanaPanel component
 */
interface GrafanaPanelProps {
  /** 
   * Full iframe URL to the Grafana panel (from Share -> Embed)
   * Example: "http://localhost:3001/d-solo/abc123/dashboard?panelId=2"
   */
  panelUrl: string;
  
  /** Width of the panel container (CSS value or number for pixels) */
  width?: string | number;
  
  /** Height of the panel container (CSS value or number for pixels) */
  height?: string | number;
  
  /** Show fallback message if panel fails to load (default: true) */
  showFallback?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * GrafanaPanel Component
 * 
 * Embeds a Grafana panel via iframe with loading state and error handling.
 */
const GrafanaPanel: React.FC<GrafanaPanelProps> = ({ 
  panelUrl, 
  width = '100%',   // Default to full width
  height = 400,     // Default to 400px height
  showFallback = true  // Show error message by default
}) => {
  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  
  // Track if the iframe failed to load
  const [hasError, setHasError] = useState(false);
  
  // Track loading state for spinner display
  const [isLoading, setIsLoading] = useState(true);

  // Basic sanitization: ensure url starts with http
  const src = panelUrl && (panelUrl.startsWith('http://') || panelUrl.startsWith('https://')) ? panelUrl : '';

  useEffect(() => {
    // Reset error state when URL changes
    setHasError(false);
    setIsLoading(true);
  }, [panelUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    position: 'relative'
  };

  if (!src) {
    return (
      <div style={containerStyle} className="flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <p className="text-sm text-gray-600">Grafana panel URL not configured or invalid.</p>
        </div>
      </div>
    );
  }

  if (hasError && showFallback) {
    return (
      <div style={containerStyle} className="flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">Grafana panel unavailable</p>
          <p className="text-xs text-gray-500">The Grafana service may be offline</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      <iframe
        title="Grafana Panel"
        src={src}
        style={{ width: '100%', height: '100%', border: 0 }}
        allow="fullscreen"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default GrafanaPanel;
