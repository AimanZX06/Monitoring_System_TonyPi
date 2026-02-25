# Grafana Integration - Frontend Visualization Layer

## Overview

The TonyPi Robot Monitoring System uses **Grafana 10.0.0** as the visualization layer (Layer 5 in the tech stack). Grafana connects to InfluxDB to display robot telemetry data as interactive charts and graphs, which are embedded directly into the React frontend via iframes.

---

## Architecture Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     Grafana Integration Architecture                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌───────────────────┐    ┌─────────────────────────┐  │
│  │ React       │    │ GrafanaPanel.tsx  │    │ grafana.ts (utils)      │  │
│  │ Dashboard   │───▶│ (iframe embed)    │───▶│ • buildGrafanaPanelUrl  │  │
│  │ Page        │    │ width, height     │    │ • checkAvailability     │  │
│  └─────────────┘    └────────┬──────────┘    └─────────────────────────┘  │
│                              │                                             │
│                              ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         Grafana Service                              │  │
│  │  ┌─────────────────┐   ┌──────────────────┐   ┌─────────────────┐   │  │
│  │  │ Dashboard Panel │   │ InfluxDB         │   │ Panel Types     │   │  │
│  │  │ /d-solo/{uid}   │◀──│ Data Source      │   │ • Time Series   │   │  │
│  │  │ ?panelId={id}   │   │ (Flux Queries)   │   │ • Gauge         │   │  │
│  │  └─────────────────┘   └──────────────────┘   │ • Stat          │   │  │
│  │                                                │ • Table         │   │  │
│  │  Environment Config:                           └─────────────────┘   │  │
│  │  • GF_AUTH_ANONYMOUS_ENABLED=true                                    │  │
│  │  • GF_SECURITY_ALLOW_EMBEDDING=true                                  │  │
│  │  • GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer                                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Alternative: Server-Side Rendering                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  grafana_proxy.py                                                    │  │
│  │  GET /api/grafana/render → Grafana Render API → PNG Image           │  │
│  │  (Uses API key, no CORS issues, static snapshots)                    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 📸 Screenshot Guide

### Frontend Components

| # | Screenshot Description | File | Lines | What to Capture |
|---|------------------------|------|-------|-----------------|
| 1 | **Module Docstring** - Purpose, features, common issues | `frontend/src/components/GrafanaPanel.tsx` | 1-36 | Complete documentation |
| 2 | **TypeScript Interface** - Props definition | `frontend/src/components/GrafanaPanel.tsx` | 52-70 | `GrafanaPanelProps` interface |
| 3 | **State Management** - Loading & error states | `frontend/src/components/GrafanaPanel.tsx` | 87-114 | useState hooks, handlers |
| 4 | **Iframe Rendering** - Panel embed with styles | `frontend/src/components/GrafanaPanel.tsx` | 147-163 | JSX with iframe |
| 5 | **Error Fallback UI** - Graceful degradation | `frontend/src/components/GrafanaPanel.tsx` | 135-145 | Error state UI |

### Utility Functions

| # | Screenshot Description | File | Lines | What to Capture |
|---|------------------------|------|-------|-----------------|
| 6 | **Module Docstring** - Configuration, URL formats | `frontend/src/utils/grafana.ts` | 1-42 | Usage examples |
| 7 | **Health Check** - Availability with timeout | `frontend/src/utils/grafana.ts` | 54-82 | `checkGrafanaAvailability()` |
| 8 | **URL Builder** - Panel URL with variables | `frontend/src/utils/grafana.ts` | 84-120 | `buildGrafanaPanelUrl()` |

### Backend Proxy (Alternative Method)

| # | Screenshot Description | File | Lines | What to Capture |
|---|------------------------|------|-------|-----------------|
| 9 | **Proxy Docstring** - Why proxy? Security benefits | `backend/routers/grafana_proxy.py` | 1-46 | Full header documentation |
| 10 | **Render Endpoint** - Server-side panel rendering | `backend/routers/grafana_proxy.py` | 66-103 | `render_panel()` function |

### Docker Configuration

| # | Screenshot Description | File | Lines | What to Capture |
|---|------------------------|------|-------|-----------------|
| 11 | **Grafana Service** - Docker with environment vars | `docker-compose.yml` | 242-321 | Complete service config |
| 12 | **Embedding Config** - Anonymous auth, CORS settings | `docker-compose.yml` | 284-296 | GF_* environment variables |

---

## Key Implementation Details

### 1. GrafanaPanel Component (Lines 81-163)

The `GrafanaPanel` component is a reusable React component that embeds Grafana panels via iframes:

```tsx
const GrafanaPanel: React.FC<GrafanaPanelProps> = ({ 
  panelUrl, 
  width = '100%',   // Default to full width
  height = 400,     // Default to 400px height
  showFallback = true
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // URL validation - must start with http:// or https://
  const src = panelUrl && (panelUrl.startsWith('http://') || 
              panelUrl.startsWith('https://')) ? panelUrl : '';

  return (
    <div style={containerStyle}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}
      <iframe
        title="Grafana Panel"
        src={src}
        style={{ width: '100%', height: '100%', border: 0 }}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};
```

**Key Features:**
- **Loading Spinner** - Shows while panel loads
- **Error Fallback** - Graceful message when Grafana unavailable
- **URL Validation** - Prevents invalid URLs
- **Customizable Size** - Width/height as props

---

### 2. URL Builder Function (Lines 87-120)

The `buildGrafanaPanelUrl` function constructs proper Grafana embed URLs with query parameters:

```typescript
export const buildGrafanaPanelUrl = (
  dashboardUid: string,
  panelId: number,
  options: {
    robotId?: string;     // Robot ID variable for filtering
    from?: string;        // Start time (default: now-1h)
    to?: string;          // End time (default: now)
    refresh?: string;     // Auto-refresh rate (default: 5s)
    theme?: 'light' | 'dark';
  } = {}
): string => {
  const params = new URLSearchParams({
    orgId: '1',
    refresh: options.refresh || '5s',
    theme: options.theme || 'light',
    panelId: panelId.toString(),
    from: options.from || 'now-1h',
    to: options.to || 'now'
  });

  if (options.robotId) {
    params.append('var-robot_id', options.robotId);
  }

  return `${GRAFANA_URL}/d-solo/${dashboardUid}/${dashboardUid}?${params}`;
};
```

**URL Format:** `/d-solo/{dashboard_uid}/{dashboard_uid}?panelId={id}&from=now-1h&to=now&theme=light`

---

### 3. Health Check with Timeout (Lines 58-82)

The availability check uses `AbortController` for proper timeout handling:

```typescript
export const checkGrafanaAvailability = async (): Promise<boolean> => {
  if (!GRAFANA_ENABLED) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const response = await fetch(`${GRAFANA_URL}/api/health`, {
      method: 'GET',
      mode: 'no-cors',  // Avoid CORS issues
      cache: 'no-cache',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return true; // If no error, assume available
  } catch (error) {
    return false; // Network error or timeout
  }
};
```

---

### 4. Docker Configuration (Lines 259-321)

Grafana requires specific environment variables for iframe embedding:

```yaml
grafana:
  image: grafana/grafana:10.0.0
  container_name: tonypi_grafana
  ports:
    - "3000:3000"
  
  volumes:
    - ./grafana/data:/var/lib/grafana
    - ./grafana/provisioning:/etc/grafana/provisioning
  
  environment:
    # Admin credentials
    - GF_SECURITY_ADMIN_USER=${GRAFANA_USER}
    - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    
    # Plugins
    - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    
    # CRITICAL: Allow anonymous viewing for embedded panels
    - GF_AUTH_ANONYMOUS_ENABLED=true
    - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
    
    # CRITICAL: Allow embedding in iframes
    - GF_SECURITY_ALLOW_EMBEDDING=true
    
    # Cookie settings for cross-origin embedding
    - GF_SECURITY_COOKIE_SAMESITE=none
    
    # InfluxDB connection (passed to datasource provisioning)
    - INFLUXDB_TOKEN=${INFLUXDB_TOKEN}
```

**Critical Settings for Embedding:**
| Setting | Value | Purpose |
|---------|-------|---------|
| `GF_AUTH_ANONYMOUS_ENABLED` | `true` | Allow viewing without login |
| `GF_AUTH_ANONYMOUS_ORG_ROLE` | `Viewer` | Read-only access for anonymous |
| `GF_SECURITY_ALLOW_EMBEDDING` | `true` | Enable iframe embedding |
| `GF_SECURITY_COOKIE_SAMESITE` | `none` | Fix cross-origin cookie issues |

---

### 5. Server-Side Proxy (Alternative)

For static snapshots or when CORS is problematic, use the backend proxy:

```python
@router.get("/render")
async def render_panel(
    dashboard_uid: str = Query(...),
    panel_id: int = Query(...),
    from_time: str = Query("now-1h"),
    to_time: str = Query("now"),
    width: int = Query(1000),
    height: int = Query(500),
):
    """Render Grafana panel server-side and return PNG"""
    url = f"{GRAFANA_BASE}/render/d/{dashboard_uid}"
    headers = {"Authorization": f"Bearer {GRAFANA_KEY}"}
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(url, headers=headers, params=params)
    
    return Response(content=resp.content, media_type="image/png")
```

**Usage in HTML:** `<img src="/api/grafana/render?dashboard_uid=tonypi&panel_id=1" />`

---

## Panel Types Available

| Panel Type | Use Case | Example Data |
|------------|----------|--------------|
| **Time Series** | Historical trends | CPU usage over time |
| **Gauge** | Current value with thresholds | Battery percentage |
| **Stat** | Single value display | Total alerts |
| **Table** | Tabular data | Servo status list |
| **Bar Gauge** | Comparative values | Multi-robot comparison |
| **Heatmap** | Density visualization | Activity patterns |

---

## How to Get Panel Embed URL

1. Open Grafana dashboard (http://localhost:3000)
2. Click on a panel's title → **Share**
3. Select **Embed** tab
4. Copy the **iframe src** URL
5. Use in `GrafanaPanel` component:

```tsx
<GrafanaPanel 
  panelUrl="http://localhost:3000/d-solo/abc123/tonypi?panelId=2&from=now-1h"
  width={800}
  height={400}
/>
```

---

## Environment Variables

### Frontend (`.env` or Vite/CRA config)
```bash
REACT_APP_GRAFANA_URL=http://localhost:3000
REACT_APP_GRAFANA_ENABLED=true
```

### Backend (for proxy)
```bash
GRAFANA_BASE_URL=http://grafana:3000
GRAFANA_API_KEY=your-service-account-token
```

---

## Summary

The Grafana integration provides:

1. **Interactive Charts** - Time-series visualizations with zoom/pan
2. **Iframe Embedding** - Seamless integration in React dashboard
3. **Auto-Refresh** - Real-time updates every 5 seconds
4. **Variable Filtering** - Dynamic data based on robot_id
5. **Theme Support** - Light/dark themes matching frontend
6. **Fallback Handling** - Graceful degradation when unavailable

This implementation demonstrates modern dashboard embedding patterns suitable for industrial IoT monitoring systems.
