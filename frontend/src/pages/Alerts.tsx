import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  RefreshCw,
  Filter,
  Sliders,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Bot,
  Thermometer,
  Battery,
  Cpu,
  Settings,
  Clock,
  Save,
  Activity,
  Zap
} from 'lucide-react';
import { apiService, handleApiError } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';

interface Alert {
  id: number;
  robot_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  source: string | null;
  value: number | null;
  threshold: number | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved: boolean;
  resolved_at: string | null;
  details: any;
  created_at: string;
}

interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  unacknowledged: number;
  unresolved: number;
}

interface Threshold {
  id: number;
  robot_id: string | null;
  metric_type: string;
  warning_threshold: number;
  critical_threshold: number;
  enabled: boolean;
}

const Alerts: React.FC = () => {
  const { isDark } = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedRobot, setSelectedRobot] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [showResolved, setShowResolved] = useState<boolean>(false);
  const [robots, setRobots] = useState<string[]>([]);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());
  const [thresholdValues, setThresholdValues] = useState<Record<string, { warning: number; critical: number }>>({});

  const { success, error: showError } = useNotification();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedSeverity, selectedRobot, timeRange, showResolved]);

  const fetchData = async () => {
    try {
      const [alertsData, statsData, robotsData] = await Promise.all([
        apiService.getAlerts({
          severity: selectedSeverity || undefined,
          robot_id: selectedRobot || undefined,
          time_range: timeRange,
          resolved: showResolved ? undefined : false
        }),
        apiService.getAlertStats(timeRange, selectedRobot || undefined),
        apiService.getRobotStatus()
      ]);
      
      setAlerts(alertsData);
      setStats(statsData);
      setRobots(robotsData.map((r: any) => r.robot_id));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setLoading(false);
    }
  };

  const fetchThresholds = async () => {
    try {
      const data = await apiService.getThresholds(selectedRobot || undefined);
      setThresholds(data);
      
      const values: Record<string, { warning: number; critical: number }> = {};
      let defaultThresholds: any = {};
      
      try {
        defaultThresholds = await apiService.getDefaultThresholds();
      } catch (err) {
        console.warn('Could not fetch default thresholds, using fallback values:', err);
      }
      
      const metricTypes = [
        { type: 'cpu', defaults: defaultThresholds.cpu },
        { type: 'memory', defaults: defaultThresholds.memory },
        { type: 'temperature', defaults: defaultThresholds.temperature },
        { type: 'battery', defaults: defaultThresholds.battery },
        { type: 'servo_temp', defaults: defaultThresholds.servo_temp },
        { type: 'servo_voltage', defaults: defaultThresholds.servo_voltage },
      ];
      
      metricTypes.forEach(({ type, defaults }) => {
        const threshold = data.find(t => t.metric_type === type && !t.robot_id);
        values[type] = {
          warning: threshold?.warning_threshold ?? defaults?.warning ?? 70,
          critical: threshold?.critical_threshold ?? defaults?.critical ?? 90,
        };
      });
      
      setThresholdValues(values);
    } catch (err) {
      console.error('Error fetching thresholds:', err);
    }
  };

  const acknowledgeAlert = async (alertId: number) => {
    try {
      await apiService.acknowledgeAlert(alertId);
      success('Alert Acknowledged', 'Alert has been acknowledged');
      fetchData();
    } catch (err) {
      showError('Error', handleApiError(err));
    }
  };

  const resolveAlert = async (alertId: number) => {
    try {
      await apiService.resolveAlert(alertId);
      success('Alert Resolved', 'Alert has been marked as resolved');
      fetchData();
    } catch (err) {
      showError('Error', handleApiError(err));
    }
  };

  const acknowledgeAll = async () => {
    try {
      await apiService.acknowledgeAllAlerts(selectedRobot || undefined);
      success('All Acknowledged', 'All alerts have been acknowledged');
      fetchData();
    } catch (err) {
      showError('Error', handleApiError(err));
    }
  };

  const deleteAlert = async (alertId: number) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await apiService.deleteAlert(alertId);
      success('Alert Deleted', 'Alert has been removed');
      fetchData();
    } catch (err) {
      showError('Error', handleApiError(err));
    }
  };

  const toggleExpand = (alertId: number) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />;
      case 'warning':
        return <AlertTriangle className={`h-5 w-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />;
      default:
        return <Info className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium";
    switch (severity) {
      case 'critical':
        return <span className={`${baseClass} ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'}`}>Critical</span>;
      case 'warning':
        return <span className={`${baseClass} ${isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800'}`}>Warning</span>;
      default:
        return <span className={`${baseClass} ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>Info</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="h-4 w-4 text-orange-500" />;
      case 'battery':
        return <Battery className="h-4 w-4 text-green-500" />;
      case 'servo':
        return <Settings className="h-4 w-4 text-purple-500" />;
      case 'cpu':
      case 'memory':
        return <Cpu className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <span className={`ml-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading alerts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Bell className={`h-6 w-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            Alerts & Notifications
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await fetchThresholds();
                setShowThresholdModal(true);
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Sliders className="h-4 w-4" />
              Thresholds
            </button>
            <button
              onClick={fetchData}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Robot Selector - Prominent */}
        <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-800' : 'bg-blue-100'}`}>
                <Bot className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Viewing Alerts For</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedRobot || 'All Robots'}
                </p>
              </div>
            </div>
            <select
              value={selectedRobot}
              onChange={(e) => setSelectedRobot(e.target.value)}
              className={`px-4 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-blue-300'}`}
            >
              <option value="">All Robots</option>
              {robots.map((robot) => (
                <option key={robot} value={robot}>{robot}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{stats.total}</p>
            </div>
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>Critical</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-red-300' : 'text-red-900'}`}>{stats.critical}</p>
            </div>
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
              <p className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>Warning</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-yellow-300' : 'text-yellow-900'}`}>{stats.warning}</p>
            </div>
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Info</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>{stats.info}</p>
            </div>
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
              <p className={`text-xs ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Unacknowledged</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-orange-300' : 'text-orange-900'}`}>{stats.unacknowledged}</p>
            </div>
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
              <p className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Unresolved</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>{stats.unresolved}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Filters:</span>
          </div>
          
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className={`px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className={`rounded ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
            />
            Show Resolved
          </label>

          {stats && stats.unacknowledged > 0 && (
            <button
              onClick={acknowledgeAll}
              className="ml-auto btn-primary flex items-center gap-2 text-sm"
            >
              <CheckCircle className="h-4 w-4" />
              Acknowledge All ({stats.unacknowledged})
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="card text-center py-12">
            <Bell className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No alerts found</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>System is running smoothly!</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isExpanded = expandedAlerts.has(alert.id);
            return (
              <div
                key={alert.id}
                className={`card border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-red-500' :
                  alert.severity === 'warning' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                } ${alert.resolved ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{alert.title}</h4>
                        {getSeverityBadge(alert.severity)}
                        {getTypeIcon(alert.alert_type)}
                        {alert.resolved && (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                            Resolved
                          </span>
                        )}
                        {alert.acknowledged && !alert.resolved && (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-700'}`}>
                            Acknowledged
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{alert.message}</p>
                      <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {alert.robot_id ? (
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                            <Bot className="h-3 w-3" />
                            {alert.robot_id}
                          </span>
                        ) : (
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                            <Activity className="h-3 w-3" />
                            System-wide
                          </span>
                        )}
                        {alert.source && (
                          <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>Source: {alert.source}</span>
                        )}
                        {alert.value !== null && alert.threshold !== null && (
                          <span className={`font-medium px-2 py-0.5 rounded ${isDark ? 'text-red-400 bg-red-900/20' : 'text-red-600 bg-red-50'}`}>
                            Value: {alert.value.toFixed(1)} (threshold: {alert.threshold})
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(alert.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-50'}`}
                        title="Acknowledge"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'}`}
                        title="Mark as Resolved"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleExpand(alert.id)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>Created</p>
                        <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{formatDate(alert.created_at)}</p>
                      </div>
                      {alert.acknowledged_at && (
                        <div>
                          <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>Acknowledged</p>
                          <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{formatDate(alert.acknowledged_at)}</p>
                          {alert.acknowledged_by && (
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>by {alert.acknowledged_by}</p>
                          )}
                        </div>
                      )}
                      {alert.resolved_at && (
                        <div>
                          <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>Resolved</p>
                          <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{formatDate(alert.resolved_at)}</p>
                        </div>
                      )}
                      <div>
                        <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>Alert Type</p>
                        <p className={`font-medium capitalize ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{alert.alert_type}</p>
                      </div>
                    </div>
                    {alert.details && (
                      <div className="mt-4">
                        <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Additional Details:</p>
                        <pre className={`p-3 rounded text-xs overflow-x-auto ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                          {JSON.stringify(alert.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Threshold Configuration Modal */}
      {showThresholdModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowThresholdModal(false)}
        >
          <div
            className={`rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Sliders className="h-5 w-5 text-blue-600" />
                  Alert Thresholds
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Configure warning and critical thresholds for monitoring
                </p>
              </div>
              <button
                onClick={() => setShowThresholdModal(false)}
                className={isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Default Thresholds */}
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>Default Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { type: 'cpu', label: 'CPU Usage (%)', icon: Cpu, hint: 'Alert when above' },
                    { type: 'memory', label: 'Memory Usage (%)', icon: Cpu, hint: 'Alert when above' },
                    { type: 'temperature', label: 'CPU Temperature (°C)', icon: Thermometer, hint: 'Alert when above' },
                    { type: 'battery', label: 'Battery Level (%)', icon: Battery, hint: 'Alert when below' },
                    { type: 'servo_temp', label: 'Servo Temperature (°C)', icon: Settings, hint: 'Alert when above' },
                    { type: 'servo_voltage', label: 'Servo Voltage (V)', icon: Zap, hint: 'Alert when below' },
                  ].map((metric) => {
                    const threshold = thresholds.find(t => t.metric_type === metric.type && !t.robot_id);
                    const currentValues = thresholdValues[metric.type] || {
                      warning: threshold?.warning_threshold || 70,
                      critical: threshold?.critical_threshold || 90,
                    };
                    
                    return (
                      <div key={metric.type} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <metric.icon className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{metric.label}</span>
                          </div>
                          <span className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{metric.hint}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <label className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>Warning</label>
                            <input
                              type="number"
                              step={metric.type === 'servo_voltage' ? '0.1' : '1'}
                              value={currentValues.warning}
                              onChange={(e) => {
                                setThresholdValues(prev => ({
                                  ...prev,
                                  [metric.type]: {
                                    ...prev[metric.type],
                                    warning: parseFloat(e.target.value) || 0,
                                  }
                                }));
                              }}
                              className={`w-full px-2 py-1 border rounded text-sm ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                            />
                          </div>
                          <div>
                            <label className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>Critical</label>
                            <input
                              type="number"
                              step={metric.type === 'servo_voltage' ? '0.1' : '1'}
                              value={currentValues.critical}
                              onChange={(e) => {
                                setThresholdValues(prev => ({
                                  ...prev,
                                  [metric.type]: {
                                    ...prev[metric.type],
                                    critical: parseFloat(e.target.value) || 0,
                                  }
                                }));
                              }}
                              className={`w-full px-2 py-1 border rounded text-sm ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`p-4 rounded-lg space-y-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>How thresholds work:</strong>
                </p>
                <ul className={`text-sm list-disc list-inside space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li><strong>CPU, Memory, Temperature, Servo Temp:</strong> Alert when value goes <em>above</em> threshold</li>
                  <li><strong>Battery, Servo Voltage:</strong> Alert when value goes <em>below</em> threshold</li>
                </ul>
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Alerts are automatically generated when robot data exceeds these thresholds.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowThresholdModal(false)}
                className={`flex-1 px-4 py-2 border rounded-lg ${isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const savePromises = Object.entries(thresholdValues).map(([metricType, values]) => {
                      return apiService.createOrUpdateThreshold({
                        robot_id: selectedRobot || undefined,
                        metric_type: metricType,
                        warning_threshold: values.warning,
                        critical_threshold: values.critical,
                        enabled: true,
                      });
                    });
                    
                    await Promise.all(savePromises);
                    success('Thresholds Saved', 'Alert thresholds have been updated');
                    setShowThresholdModal(false);
                    fetchThresholds();
                  } catch (err) {
                    showError('Error', handleApiError(err));
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
