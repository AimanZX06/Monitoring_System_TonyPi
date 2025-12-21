# Frontend Improvements - Making Grafana Optional

## Implementation Plan

### 1. Add Grafana Availability Check

Create a utility to check if Grafana is available:

```typescript
// frontend/src/utils/grafana.ts
export const checkGrafanaAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
      mode: 'no-cors', // CORS workaround
      cache: 'no-cache'
    });
    return true;
  } catch (error) {
    return false;
  }
};
```

### 2. Update GrafanaPanel Component

Add error handling and fallback:

```typescript
// frontend/src/components/GrafanaPanel.tsx
const GrafanaPanel: React.FC<GrafanaPanelProps> = ({ panelUrl, width, height }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Grafana panel unavailable</p>
          <p className="text-sm text-gray-500">Advanced analytics require Grafana service</p>
        </div>
      </div>
    );
  }

  // ... rest of component
};
```

### 3. Update Monitoring Page

Add conditional rendering and availability check:

```typescript
// frontend/src/pages/Monitoring.tsx
const [grafanaAvailable, setGrafanaAvailable] = useState<boolean | null>(null);

useEffect(() => {
  checkGrafanaAvailability().then(setGrafanaAvailable);
}, []);

// In render:
{grafanaAvailable && (
  <div className="space-y-6 mt-6">
    {/* Grafana panels */}
  </div>
)}

{grafanaAvailable === false && (
  <div className="card mt-6">
    <div className="text-center py-8">
      <p className="text-gray-600 mb-2">Grafana Advanced Analytics</p>
      <p className="text-sm text-gray-500">
        Start Grafana container to enable advanced visualizations: 
        <code className="ml-2 bg-gray-100 px-2 py-1 rounded">docker compose up -d grafana</code>
      </p>
    </div>
  </div>
)}
```

### 4. Environment Variable Configuration

Add Grafana URL to environment:

```typescript
// frontend/src/utils/config.ts
export const GRAFANA_URL = process.env.REACT_APP_GRAFANA_URL || 'http://localhost:3000';
export const GRAFANA_ENABLED = process.env.REACT_APP_GRAFANA_ENABLED !== 'false';
```

### 5. Optional: Native Chart Replacements

Create native gauge components using Recharts:

```typescript
// frontend/src/components/GaugeChart.tsx
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  thresholds?: { warning: number; danger: number };
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ 
  value, 
  min = 0, 
  max = 100,
  thresholds = { warning: 70, danger: 90 }
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const data = [
    { name: 'Used', value: percentage },
    { name: 'Remaining', value: 100 - percentage }
  ];
  
  const color = percentage >= thresholds.danger 
    ? '#ef4444' 
    : percentage >= thresholds.warning 
    ? '#f59e0b' 
    : '#10b981';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          startAngle={180}
          endAngle={0}
          innerRadius={60}
          outerRadius={80}
          dataKey="value"
        >
          <Cell fill={color} />
          <Cell fill="#e5e7eb" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
```

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Add Grafana availability check
2. ✅ Add error handling to GrafanaPanel
3. ✅ Conditional rendering in Monitoring page
4. ✅ Environment variable for Grafana URL

### Phase 2: Enhanced Experience (2-4 hours)
1. ✅ Native gauge charts as fallback
2. ✅ Loading states
3. ✅ User-friendly error messages
4. ✅ Collapsible Grafana section

### Phase 3: Complete Independence (4-8 hours)
1. ✅ Replace all Grafana panels with native charts
2. ✅ Remove Grafana dependency entirely
3. ✅ Optimize chart performance
4. ✅ Add chart customization options

---

## Benefits

### After Implementation:
- ✅ System works perfectly without Grafana
- ✅ Clear user feedback when Grafana unavailable
- ✅ Professional error handling
- ✅ Easy to disable Grafana via environment variable
- ✅ Faster page loads (no iframe overhead)
- ✅ Better mobile support
- ✅ Consistent UI/UX









