import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface GrafanaPanelProps {
  /** Full iframe URL to the Grafana panel (from Share -> Embed) */
  panelUrl: string;
  width?: string | number;
  height?: string | number;
  /** Show fallback message if panel fails to load */
  showFallback?: boolean;
}

const GrafanaPanel: React.FC<GrafanaPanelProps> = ({ 
  panelUrl, 
  width = '100%', 
  height = 400,
  showFallback = true 
}) => {
  const [hasError, setHasError] = useState(false);
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
