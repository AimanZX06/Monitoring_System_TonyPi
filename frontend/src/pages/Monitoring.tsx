import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Cpu, HardDrive, Thermometer, Clock, ExternalLink, TrendingUp } from 'lucide-react';
import { apiService } from '../utils/api';
import GrafanaPanel from '../components/GrafanaPanel';
import { checkGrafanaAvailability, buildGrafanaPanelUrl, getGrafanaDashboardUrl, GRAFANA_ENABLED } from '../utils/grafana';

interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  disk_usage: number;
  temperature: number;
  uptime: number;
  timestamp: string;
}

interface ChartDataPoint {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
  temperature: number;
}

const Monitoring: React.FC = () => {
  const [robotId, setRobotId] = useState('');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [grafanaAvailable, setGrafanaAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        // Auto-detect robot ID from connected robots
        const robots = await apiService.getRobotStatus();
        
        if (robots.length === 0) {
          setLoading(false);
          return;
        }
        
        // Use first robot or the one matching robotId
        const targetRobot = robotId ? robots.find(r => r.robot_id === robotId) : robots[0];
        if (!targetRobot) {
          setLoading(false);
          return;
        }
        
        // Auto-set robot ID if not manually set
        if (!robotId && targetRobot) {
          setRobotId(targetRobot.robot_id);
        }
        
        // Get detailed performance data
        const perfData = await apiService.getPiPerformance(targetRobot.robot_id, '10m');
        
        if (perfData && perfData.length > 0) {
          // Group data by timestamp
          const timeGroups: { [key: string]: any } = {};
          
          perfData.forEach((d: any) => {
            if (!d.field || !d.field.startsWith('system_')) return;
            
            const timestamp = new Date(d.time);
            if (isNaN(timestamp.getTime())) return; // Skip invalid dates
            
            const timeKey = timestamp.toLocaleTimeString();
            
            if (!timeGroups[timeKey]) {
              timeGroups[timeKey] = { 
                time: timeKey, 
                timestamp: timestamp,
                cpu: 0, 
                memory: 0, 
                disk: 0, 
                temperature: 0,
                uptime: 0
              };
            }
            
            if (d.field === 'system_cpu_percent') timeGroups[timeKey].cpu = d.value;
            if (d.field === 'system_memory_percent') timeGroups[timeKey].memory = d.value;
            if (d.field === 'system_disk_usage') timeGroups[timeKey].disk = d.value;
            if (d.field === 'system_temperature') timeGroups[timeKey].temperature = d.value;
            if (d.field === 'system_uptime') timeGroups[timeKey].uptime = d.value;
          });
          
          // Sort by timestamp and take latest 20
          const sortedData = Object.values(timeGroups)
            .sort((a: any, b: any) => a.timestamp - b.timestamp)
            .slice(-20)
            .map(({ time, cpu, memory, disk, temperature }: any) => ({ 
              time, cpu, memory, disk, temperature 
            }));
          
          setChartData(sortedData);
          
          // Get latest values for metric cards
          const latest = Object.values(timeGroups).sort((a: any, b: any) => b.timestamp - a.timestamp)[0] as any;
          
          if (latest) {
            setMetrics({
              cpu_percent: latest.cpu || 0,
              memory_percent: latest.memory || 0,
              disk_usage: latest.disk || 0,
              temperature: latest.temperature || 0,
              uptime: latest.uptime || 0,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 5000);
    return () => clearInterval(interval);
  }, [robotId]);

  // Check Grafana availability on mount and periodically
  useEffect(() => {
    if (!GRAFANA_ENABLED) {
      setGrafanaAvailable(false);
      return;
    }

    const checkGrafana = async () => {
      const available = await checkGrafanaAvailability();
      setGrafanaAvailable(available);
    };

    checkGrafana();
    const interval = setInterval(checkGrafana, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getColorClass = (value: number, thresholds: {warning: number, danger: number}) => {
    if (value >= thresholds.danger) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'CPU Usage',
      value: metrics?.cpu_percent || 0,
      unit: '%',
      icon: Cpu,
      color: getColorClass(metrics?.cpu_percent || 0, {warning: 60, danger: 80}),
      bgColor: 'bg-blue-50',
      thresholds: {warning: 60, danger: 80}
    },
    {
      title: 'Memory Usage',
      value: metrics?.memory_percent || 0,
      unit: '%',
      icon: Activity,
      color: getColorClass(metrics?.memory_percent || 0, {warning: 70, danger: 85}),
      bgColor: 'bg-purple-50',
      thresholds: {warning: 70, danger: 85}
    },
    {
      title: 'Disk Usage',
      value: metrics?.disk_usage || 0,
      unit: '%',
      icon: HardDrive,
      color: getColorClass(metrics?.disk_usage || 0, {warning: 75, danger: 90}),
      bgColor: 'bg-orange-50',
      thresholds: {warning: 75, danger: 90}
    },
    {
      title: 'CPU Temperature',
      value: metrics?.temperature || 0,
      unit: '°C',
      icon: Thermometer,
      color: getColorClass(metrics?.temperature || 0, {warning: 60, danger: 75}),
      bgColor: 'bg-red-50',
      thresholds: {warning: 60, danger: 75}
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Performance / Task Manager
            </h2>
            <p className="text-gray-600 mt-1">
              Real-time Raspberry Pi system metrics: CPU, Memory, Disk, and Temperature
            </p>
          </div>
          {metrics && (
            <div className="text-right">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Uptime: {formatUptime(metrics.uptime)}</span>
              </div>
              <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">
                {robotId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      {metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, index) => (
            <div key={index} className="metric-card fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bgColor} shadow-sm`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <div className="flex items-baseline gap-1">
                    <p className={`text-3xl font-bold ${card.color}`}>
                      {card.value.toFixed(1)}
                    </p>
                    <span className="text-sm text-gray-500">{card.unit}</span>
                  </div>
                </div>
              </div>
              {/* Enhanced Progress bar */}
              <div className="progress-bar">
                <div
                  className={`progress-fill ${
                    card.value >= card.thresholds.danger
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : card.value >= card.thresholds.warning
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                      : 'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  style={{ width: `${Math.min(card.value, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No performance records. Click "Refresh Performance" after the robot publishes telemetry.
          </p>
        </div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <>
          <div className="card hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">CPU & Memory Usage Over Time</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full pulse-live"></div>
                <span>Live</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#3b82f6" 
                  name="CPU %" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#8b5cf6" 
                  name="Memory %" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Disk Usage</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis domain={[0, 100]} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="disk" 
                    stroke="#f59e0b" 
                    name="Disk %" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CPU Temperature</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis domain={[0, 100]} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#ef4444" 
                    name="Temp °C" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafana Embedded Dashboards - Always shown when enabled */}
          {GRAFANA_ENABLED && (
            <div className="space-y-6 mt-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics (Grafana)</h3>
                    {grafanaAvailable === true && (
                      <span className="text-xs text-green-600">● Online</span>
                    )}
                    {grafanaAvailable === false && (
                      <span className="text-xs text-yellow-600">Loading...</span>
                    )}
                  </div>
                  <a
                    href={getGrafanaDashboardUrl('tonypi-robot-monitoring')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Open Full Dashboard
                    <ExternalLink size={16} />
                  </a>
                </div>
                
                {/* CPU & Memory Panel */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">System Performance</h4>
                  <GrafanaPanel 
                    panelUrl={buildGrafanaPanelUrl('tonypi-robot-monitoring', 1, { robotId, refresh: '5s', theme: 'light' })}
                    height={350}
                    showFallback={true}
                  />
                </div>

                {/* Gauges Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">CPU Temperature</h4>
                    <GrafanaPanel 
                      panelUrl={buildGrafanaPanelUrl('tonypi-robot-monitoring', 2, { robotId, refresh: '5s', theme: 'light' })}
                      height={250}
                      showFallback={true}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Battery Level</h4>
                    <GrafanaPanel 
                      panelUrl={buildGrafanaPanelUrl('tonypi-robot-monitoring', 3, { robotId, refresh: '5s', theme: 'light' })}
                      height={250}
                      showFallback={true}
                    />
                  </div>
                </div>

                {/* Sensor Data Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Accelerometer (X, Y, Z)</h4>
                    <GrafanaPanel 
                      panelUrl={buildGrafanaPanelUrl('tonypi-robot-monitoring', 4, { robotId, refresh: '5s', theme: 'light' })}
                      height={300}
                      showFallback={true}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Gyroscope (X, Y, Z)</h4>
                    <GrafanaPanel 
                      panelUrl={buildGrafanaPanelUrl('tonypi-robot-monitoring', 5, { robotId, refresh: '5s', theme: 'light' })}
                      height={300}
                      showFallback={true}
                    />
                  </div>
                </div>

                {/* Additional Sensors */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Distance Sensor</h4>
                    <GrafanaPanel 
                      panelUrl={buildGrafanaPanelUrl('tonypi-robot-monitoring', 6, { robotId, refresh: '5s', theme: 'light' })}
                      height={250}
                      showFallback={true}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Light Level</h4>
                    <GrafanaPanel 
                      panelUrl={buildGrafanaPanelUrl('tonypi-robot-monitoring', 7, { robotId, refresh: '5s', theme: 'light' })}
                      height={250}
                      showFallback={true}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Servo Angle</h4>
                    <GrafanaPanel 
                      panelUrl={buildGrafanaPanelUrl('tonypi-robot-monitoring', 8, { robotId, refresh: '5s', theme: 'light' })}
                      height={250}
                      showFallback={true}
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Pro Tip:</span> These Grafana charts auto-refresh every 5 seconds. 
                    Click "Open Full Dashboard" to access all Grafana features including time range selection, 
                    zoom, and custom queries. All panels are embedded directly in the frontend for seamless monitoring.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Monitoring;