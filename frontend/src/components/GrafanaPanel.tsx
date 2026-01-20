import React from 'react';

interface GrafanaPanelProps {
  /** Full iframe URL to the Grafana panel (from Share -> Embed) */
  panelUrl: string;
  width?: string | number;
  height?: string | number;
}

const GrafanaPanel: React.FC<GrafanaPanelProps> = ({ panelUrl, width = '100%', height = 400 }) => {
  // Basic sanitization: ensure url starts with http
  const src = panelUrl && (panelUrl.startsWith('http://') || panelUrl.startsWith('https://')) ? panelUrl : '';

  return (
    <div style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
      {src ? (
        <iframe
          title="Grafana Panel"
          src={src}
          style={{ width: '100%', height: '100%', border: 0 }}
          allow="fullscreen"
        />
      ) : (
        <div style={{ padding: 12, color: '#666' }}>
          Grafana panel URL not configured or invalid.
        </div>
      )}
    </div>
  );
};

export default GrafanaPanel;
