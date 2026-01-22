/**
 * =============================================================================
 * Monitoring Page Component - System Performance Dashboard
 * =============================================================================
 * 
 * This component displays real-time system performance metrics for TonyPi robots,
 * providing a Task Manager-like view of CPU, memory, disk, and temperature.
 * 
 * KEY FEATURES:
 *   - Real-time performance metrics with auto-refresh (5 seconds)
 *   - Color-coded status indicators (green/yellow/red)
 *   - Historical charts using Recharts library
 *   - Embedded Grafana panels for advanced analytics
 *   - Robot selection dropdown for multi-robot support
 *   - System uptime display
 * 
 * METRICS DISPLAYED:
 *   - CPU Usage:       Raspberry Pi CPU utilization percentage
 *   - Memory Usage:    RAM utilization percentage
 *   - Disk Usage:      SD card storage utilization
 *   - CPU Temperature: Processor temperature in Celsius
 *   - Uptime:          Time since last boot
 * 
 * THRESHOLDS (color-coded):
 *   CPU:         Warning > 60%, Danger > 80%
 *   Memory:      Warning > 70%, Danger > 85%
 *   Disk:        Warning > 75%, Danger > 90%
 *   Temperature: Warning > 60°C, Danger > 75°C
 * 
 * DATA FLOW:
 *   1. Fetch robot list from /api/v1/robot-data/status
 *   2. Fetch performance data from /api/v1/pi-perf/{robot_id}
 *   3. Group data by timestamp and extract metrics
 *   4. Update charts and metric cards
 *   5. Auto-refresh every 5 seconds
 * 
 * CHARTS:
 *   - CPU & Memory line chart (combined view)
 *   - Disk Usage line chart
 *   - Temperature line chart
 *   - Embedded Grafana panels for advanced visualization
 */

// =============================================================================
// IMPORTS
// =============================================================================

import React, { useState, useEffect } from 'react';

// Recharts - charting library for React
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Lucide React icons
import { Activity, Cpu, HardDrive, Thermometer, Clock, ExternalLink, TrendingUp } from 'lucide-react';

// Internal utilities
import { apiService } from '../utils/api';
import GrafanaPanel from '../components/GrafanaPanel';
import { getGrafanaPanelUrl, getGrafanaDashboardUrl } from '../utils/config';
import { useTheme } from '../contexts/ThemeContext';

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
  const { isDark } = useTheme();
  const [robotId, setRobotId] = useState('');
  const [allRobots, setAllRobots] = useState<{robot_id: string, status: string}[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const robots = await apiService.getRobotStatus();
        setAllRobots(robots.map(r => ({ robot_id: r.robot_id, status: r.status })));
        
        if (robots.length === 0) {
          setLoading(false);
          return;
        }
        
        const targetRobot = robotId ? robots.find(r => r.robot_id === robotId) : robots[0];
        if (!targetRobot) {
          setLoading(false);
          return;
        }
        
        if (!robotId && targetRobot) {
          setRobotId(targetRobot.robot_id);
        }
        
        const perfData = await apiService.getPiPerformance(targetRobot.robot_id, '10m');
        
        if (perfData && perfData.length > 0) {
          const timeGroups: { [key: string]: any } = {};
          
          perfData.forEach((d: any) => {
            if (!d.field || !d.field.startsWith('system_')) return;
            
            const timestamp = new Date(d.time);
            if (isNaN(timestamp.getTime())) return;
            
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
          
          const sortedData = Object.values(timeGroups)
            .sort((a: any, b: any) => a.timestamp - b.timestamp)
            .slice(-20)
            .map(({ time, cpu, memory, disk, temperature }: any) => ({ 
              time, cpu, memory, disk, temperature 
            }));
          
          setChartData(sortedData);
          
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

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getColorClass = (value: number, thresholds: {warning: number, danger: number}) => {
    if (value >= thresholds.danger) return isDark ? 'text-red-400' : 'text-red-600';
    if (value >= thresholds.warning) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-green-400' : 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
      bgColor: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
      thresholds: {warning: 60, danger: 80}
    },
    {
      title: 'Memory Usage',
      value: metrics?.memory_percent || 0,
      unit: '%',
      icon: Activity,
      color: getColorClass(metrics?.memory_percent || 0, {warning: 70, danger: 85}),
      bgColor: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
      thresholds: {warning: 70, danger: 85}
    },
    {
      title: 'Disk Usage',
      value: metrics?.disk_usage || 0,
      unit: '%',
      icon: HardDrive,
      color: getColorClass(metrics?.disk_usage || 0, {warning: 75, danger: 90}),
      bgColor: isDark ? 'bg-orange-900/30' : 'bg-orange-50',
      thresholds: {warning: 75, danger: 90}
    },
    {
      title: 'CPU Temperature',
      value: metrics?.temperature || 0,
      unit: '°C',
      icon: Thermometer,
      color: getColorClass(metrics?.temperature || 0, {warning: 60, danger: 75}),
      bgColor: isDark ? 'bg-red-900/30' : 'bg-red-50',
      thresholds: {warning: 60, danger: 75}
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Activity className="h-6 w-6" />
              Performance / Task Manager
            </h2>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Real-time Raspberry Pi system metrics: CPU, Memory, Disk, and Temperature
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {allRobots.length > 0 && (
              <select
                value={robotId}
                onChange={(e) => setRobotId(e.target.value)}
                className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                {allRobots.map((robot) => (
                  <option key={robot.robot_id} value={robot.robot_id}>
                    {robot.robot_id} {robot.status === 'online' ? '(Online)' : '(Offline)'}
                  </option>
                ))}
              </select>
            )}
            {metrics && (
              <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Clock className="h-4 w-4" />
                <span className="text-sm">Uptime: {formatUptime(metrics.uptime)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      {metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, index) => (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{card.title}</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-3xl font-bold ${card.color}`}>
                      {card.value.toFixed(1)}
                    </p>
                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{card.unit}</span>
                  </div>
                </div>
              </div>
              <div className={`mt-3 w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    card.value >= card.thresholds.danger
                      ? 'bg-red-600'
                      : card.value >= card.thresholds.warning
                      ? 'bg-yellow-500'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(card.value, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8">
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            No performance records. Click "Refresh Performance" after the robot publishes telemetry.
          </p>
        </div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <>
          <div className="card">
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>CPU & Memory Usage Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="time" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft', fill: isDark ? '#9ca3af' : '#6b7280' }} stroke={isDark ? '#9ca3af' : '#6b7280'} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', color: isDark ? '#fff' : '#000' }} />
                <Legend />
                <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU %" strokeWidth={2} />
                <Line type="monotone" dataKey="memory" stroke="#8b5cf6" name="Memory %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Disk Usage</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="time" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <YAxis domain={[0, 100]} stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', color: isDark ? '#fff' : '#000' }} />
                  <Line type="monotone" dataKey="disk" stroke="#f59e0b" name="Disk %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>CPU Temperature</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="time" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <YAxis domain={[0, 100]} stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', color: isDark ? '#fff' : '#000' }} />
                  <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Temp °C" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafana Embedded Dashboards */}
          <div className="space-y-6 mt-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Advanced System Analytics</h3>
                </div>
                <a
                  href={getGrafanaDashboardUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Open Full Dashboard
                  <ExternalLink size={16} />
                </a>
              </div>
              
              <div className="mb-6">
                <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>System Performance (CPU & Memory)</h4>
                <GrafanaPanel 
                  panelUrl={getGrafanaPanelUrl(1)}
                  height={350}
                />
              </div>

              <div>
                <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>CPU Temperature Gauge</h4>
                <GrafanaPanel 
                  panelUrl={getGrafanaPanelUrl(2)}
                  height={250}
                />
              </div>

              <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-semibold">Pro Tip:</span> These charts auto-refresh every 5 seconds. 
                  Click "Open Full Dashboard" to access all Grafana features including time range selection, 
                  zoom, and custom queries. For sensor data, visit the <strong>Sensors</strong> tab.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Monitoring;
