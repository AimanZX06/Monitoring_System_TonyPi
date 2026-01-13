import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  RefreshCw, 
  Filter, 
  Download, 
  Search,
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  Terminal,
  Clock,
  Bot,
  Trash2,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';
import { RobotData } from '../types';
import { apiService, handleApiError } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';

interface LogEntry {
  id: number;
  level: string;
  category: string;
  message: string;
  robot_id: string | null;
  details: any;
  timestamp: string;
}

interface LogStats {
  total: number;
  info: number;
  warning: number;
  error: number;
  critical: number;
  by_category: Record<string, number>;
}

const LOG_LEVELS = {
  INFO: { color: 'blue', icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  WARNING: { color: 'yellow', icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  ERROR: { color: 'red', icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  CRITICAL: { color: 'purple', icon: XCircle, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }
};

const LOG_CATEGORIES = [
  { value: 'mqtt', label: 'MQTT', color: 'bg-green-100 text-green-800' },
  { value: 'api', label: 'API', color: 'bg-blue-100 text-blue-800' },
  { value: 'database', label: 'Database', color: 'bg-purple-100 text-purple-800' },
  { value: 'system', label: 'System', color: 'bg-gray-100 text-gray-800' },
  { value: 'command', label: 'Command', color: 'bg-orange-100 text-orange-800' },
  { value: 'robot', label: 'Robot', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'alert', label: 'Alert', color: 'bg-red-100 text-red-800' },
  { value: 'report', label: 'Report', color: 'bg-teal-100 text-teal-800' }
];

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRobot, setSelectedRobot] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [robots, setRobots] = useState<string[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'all' | 'errors' | 'commands'>('all');

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedLevel, selectedCategory, selectedRobot, timeRange, viewMode]);

  const fetchData = async () => {
    try {
      let logsData;
      
      if (viewMode === 'errors') {
        logsData = await apiService.getErrorLogs(selectedRobot || undefined, timeRange);
      } else if (viewMode === 'commands') {
        logsData = await apiService.getCommandHistory(selectedRobot || undefined, timeRange);
      } else {
        logsData = await apiService.getLogs({
          level: selectedLevel || undefined,
          category: selectedCategory || undefined,
          robot_id: selectedRobot || undefined,
          search: searchQuery || undefined,
          time_range: timeRange
        });
      }
      
      const [statsData, robotsData] = await Promise.all([
        apiService.getLogStats(timeRange, selectedRobot || undefined),
        apiService.getRobotStatus()
      ]);
      
      setLogs(logsData);
      setStats(statsData);
      setRobots(robotsData.map((r: any) => r.robot_id));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const blob = await apiService.exportLogs(format, {
        time_range: timeRange,
        level: selectedLevel || undefined,
        category: selectedCategory || undefined,
        robot_id: selectedRobot || undefined
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      success('Export Complete', `Logs exported as ${format.toUpperCase()}`);
    } catch (err) {
      showError('Export Failed', handleApiError(err));
    }
  };

  const clearOldLogs = async () => {
    if (!window.confirm('Delete logs older than 30 days?')) return;
    try {
      await apiService.clearOldLogs(30);
      success('Logs Cleared', 'Old logs have been removed');
      fetchData();
    } catch (err) {
      showError('Error', handleApiError(err));
    }
  };

  const toggleExpand = (logId: number) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getLevelConfig = (level: string) => {
    return LOG_LEVELS[level as keyof typeof LOG_LEVELS] || LOG_LEVELS.INFO;
  };

  const getCategoryBadge = (category: string) => {
    const cat = LOG_CATEGORIES.find(c => c.value === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
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
        <span className="ml-3 text-gray-600">Loading logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-gray-600" />
            Logs & Activity History
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportLogs('json')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Download className="h-4 w-4" />
              JSON
            </button>
            <button
              onClick={() => exportLogs('csv')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={clearOldLogs}
              className="btn-secondary flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear Old
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
        <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Bot className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Viewing Logs For</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedRobot || 'All Robots'}
                </p>
              </div>
            </div>
            <select
              value={selectedRobot}
              onChange={(e) => setSelectedRobot(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent min-w-[200px]"
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-600">Total Logs</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600">Info</p>
              <p className="text-2xl font-bold text-blue-900">{stats.info}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs text-yellow-600">Warning</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.warning}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-xs text-red-600">Error</p>
              <p className="text-2xl font-bold text-red-900">{stats.error}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-600">Critical</p>
              <p className="text-2xl font-bold text-purple-900">{stats.critical}</p>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-1" />
            All Logs
          </button>
          <button
            onClick={() => setViewMode('errors')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'errors' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Errors Only
          </button>
          <button
            onClick={() => setViewMode('commands')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'commands' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Terminal className="h-4 w-4 inline mr-1" />
            Commands
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filters:</span>
          </div>

          {viewMode === 'all' && (
            <>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Levels</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="CRITICAL">Critical</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Categories</option>
                {LOG_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </>
          )}

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

          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              className="btn-primary text-sm"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Category Stats */}
      {stats && stats.by_category && viewMode === 'all' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Logs by Category</h3>
          <div className="flex flex-wrap gap-3">
            {LOG_CATEGORIES.map((cat) => {
              const count = stats.by_category[cat.value] || 0;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value === selectedCategory ? '' : cat.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat.value
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : ''
                  } ${cat.color}`}
                >
                  {cat.label}: {count}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No logs found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          logs.map((log) => {
            const levelConfig = getLevelConfig(log.level);
            const isExpanded = expandedLogs.has(log.id);
            const LevelIcon = levelConfig.icon;
            
            return (
              <div
                key={log.id}
                className={`card border-l-4 ${levelConfig.border} hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => toggleExpand(log.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-1.5 rounded ${levelConfig.bg}`}>
                      <LevelIcon className={`h-4 w-4 ${levelConfig.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelConfig.bg} ${levelConfig.text}`}>
                          {log.level}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryBadge(log.category)}`}>
                          {log.category}
                        </span>
                        {log.robot_id ? (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                            <Bot className="h-3 w-3" />
                            {log.robot_id}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                            System
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-900 text-sm font-mono truncate">
                        {log.message}
                      </p>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Timestamp</p>
                        <p className="font-mono text-gray-900">{formatDate(log.timestamp)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Level</p>
                        <p className={`font-medium ${levelConfig.text}`}>{log.level}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Category</p>
                        <p className="font-medium text-gray-900 capitalize">{log.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Robot ID</p>
                        <p className="font-medium text-gray-900">{log.robot_id || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-500 text-sm mb-2">Full Message:</p>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto font-mono whitespace-pre-wrap">
                        {log.message}
                      </pre>
                    </div>
                    
                    {log.details && (
                      <div>
                        <p className="text-gray-500 text-sm mb-2">Details (Stack Trace / Additional Info):</p>
                        <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto font-mono border border-gray-200">
                          {JSON.stringify(log.details, null, 2)}
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

      {/* Load More */}
      {logs.length >= 100 && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Showing first 100 logs. Use filters to narrow down results.
          </p>
        </div>
      )}
    </div>
  );
};

export default Logs;
