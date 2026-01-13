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
  Activity
} from 'lucide-react';
import { apiService, handleApiError } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';

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
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium";
    switch (severity) {
      case 'critical':
        return <span className={`${baseClass} bg-red-100 text-red-800`}>Critical</span>;
      case 'warning':
        return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>Warning</span>;
      default:
        return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Info</span>;
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
        <span className="ml-3 text-gray-600">Loading alerts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-red-600" />
            Alerts & Notifications
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchThresholds();
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
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Viewing Alerts For</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedRobot || 'All Robots'}
                </p>
              </div>
            </div>
            <select
              value={selectedRobot}
              onChange={(e) => setSelectedRobot(e.target.value)}
              className="px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
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
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-600">Total</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-xs text-red-600">Critical</p>
              <p className="text-2xl font-bold text-red-900">{stats.critical}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs text-yellow-600">Warning</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.warning}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600">Info</p>
              <p className="text-2xl font-bold text-blue-900">{stats.info}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <p className="text-xs text-orange-600">Unacknowledged</p>
              <p className="text-2xl font-bold text-orange-900">{stats.unacknowledged}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-600">Unresolved</p>
              <p className="text-2xl font-bold text-purple-900">{stats.unresolved}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filters:</span>
          </div>
          
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded border-gray-300"
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
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No alerts found</p>
            <p className="text-sm text-gray-500 mt-1">System is running smoothly!</p>
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
                        <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                        {getSeverityBadge(alert.severity)}
                        {getTypeIcon(alert.alert_type)}
                        {alert.resolved && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                            Resolved
                          </span>
                        )}
                        {alert.acknowledged && !alert.resolved && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                            Acknowledged
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {alert.robot_id ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                            <Bot className="h-3 w-3" />
                            {alert.robot_id}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                            <Activity className="h-3 w-3" />
                            System-wide
                          </span>
                        )}
                        {alert.source && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded">Source: {alert.source}</span>
                        )}
                        {alert.value !== null && alert.threshold !== null && (
                          <span className="text-red-600 font-medium px-2 py-0.5 bg-red-50 rounded">
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
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Acknowledge"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Mark as Resolved"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleExpand(alert.id)}
                      className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Created</p>
                        <p className="font-medium">{formatDate(alert.created_at)}</p>
                      </div>
                      {alert.acknowledged_at && (
                        <div>
                          <p className="text-gray-500">Acknowledged</p>
                          <p className="font-medium">{formatDate(alert.acknowledged_at)}</p>
                          {alert.acknowledged_by && (
                            <p className="text-xs text-gray-400">by {alert.acknowledged_by}</p>
                          )}
                        </div>
                      )}
                      {alert.resolved_at && (
                        <div>
                          <p className="text-gray-500">Resolved</p>
                          <p className="font-medium">{formatDate(alert.resolved_at)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500">Alert Type</p>
                        <p className="font-medium capitalize">{alert.alert_type}</p>
                      </div>
                    </div>
                    {alert.details && (
                      <div className="mt-4">
                        <p className="text-gray-500 text-sm mb-2">Additional Details:</p>
                        <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
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
            className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-blue-600" />
                  Alert Thresholds
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure warning and critical thresholds for monitoring
                </p>
              </div>
              <button
                onClick={() => setShowThresholdModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Default Thresholds */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Default Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { type: 'cpu', label: 'CPU Usage (%)', icon: Cpu },
                    { type: 'memory', label: 'Memory Usage (%)', icon: Cpu },
                    { type: 'temperature', label: 'Temperature (C)', icon: Thermometer },
                    { type: 'battery', label: 'Battery Level (%)', icon: Battery },
                    { type: 'servo_temp', label: 'Servo Temperature (C)', icon: Settings },
                  ].map((metric) => {
                    const threshold = thresholds.find(t => t.metric_type === metric.type && !t.robot_id);
                    return (
                      <div key={metric.type} className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <metric.icon className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{metric.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <label className="text-xs text-yellow-600">Warning</label>
                            <input
                              type="number"
                              defaultValue={threshold?.warning_threshold || 70}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-red-600">Critical</label>
                            <input
                              type="number"
                              defaultValue={threshold?.critical_threshold || 90}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> When a metric exceeds the warning threshold, a warning alert is generated.
                  Exceeding the critical threshold generates a critical alert.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowThresholdModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  success('Thresholds Saved', 'Alert thresholds have been updated');
                  setShowThresholdModal(false);
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
