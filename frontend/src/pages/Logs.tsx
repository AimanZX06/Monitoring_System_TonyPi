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
import { useTheme } from '../contexts/ThemeContext';

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

const Logs: React.FC = () => {
  const { isDark } = useTheme();
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

  const LOG_LEVELS = {
    INFO: { color: 'blue', icon: Info, bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50', border: isDark ? 'border-blue-700' : 'border-blue-200', text: isDark ? 'text-blue-400' : 'text-blue-700' },
    WARNING: { color: 'yellow', icon: AlertTriangle, bg: isDark ? 'bg-yellow-900/30' : 'bg-yellow-50', border: isDark ? 'border-yellow-700' : 'border-yellow-200', text: isDark ? 'text-yellow-400' : 'text-yellow-700' },
    ERROR: { color: 'red', icon: AlertCircle, bg: isDark ? 'bg-red-900/30' : 'bg-red-50', border: isDark ? 'border-red-700' : 'border-red-200', text: isDark ? 'text-red-400' : 'text-red-700' },
    CRITICAL: { color: 'purple', icon: XCircle, bg: isDark ? 'bg-purple-900/30' : 'bg-purple-50', border: isDark ? 'border-purple-700' : 'border-purple-200', text: isDark ? 'text-purple-400' : 'text-purple-700' }
  };

  const LOG_CATEGORIES = [
    { value: 'mqtt', label: 'MQTT', color: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800' },
    { value: 'api', label: 'API', color: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800' },
    { value: 'database', label: 'Database', color: isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800' },
    { value: 'system', label: 'System', color: isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800' },
    { value: 'command', label: 'Command', color: isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-800' },
    { value: 'robot', label: 'Robot', color: isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-800' },
    { value: 'alert', label: 'Alert', color: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800' },
    { value: 'report', label: 'Report', color: isDark ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-100 text-teal-800' },
    { value: 'servo', label: 'Servo', color: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-800' },
    { value: 'vision', label: 'Vision', color: isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-100 text-cyan-800' },
    { value: 'battery', label: 'Battery', color: isDark ? 'bg-lime-900/30 text-lime-400' : 'bg-lime-100 text-lime-800' },
    { value: 'sensor', label: 'Sensor', color: isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-100 text-rose-800' },
    { value: 'job', label: 'Job', color: isDark ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-100 text-violet-800' },
    { value: 'movement', label: 'Movement', color: isDark ? 'bg-sky-900/30 text-sky-400' : 'bg-sky-100 text-sky-800' },
  ];

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
    return cat ? cat.color : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800');
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
        <span className={`ml-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FileText className={`h-6 w-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
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
              className={`btn-secondary flex items-center gap-2 text-sm ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
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
        <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <Bot className={`h-6 w-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Viewing Logs For</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedRobot || 'All Robots'}
                </p>
              </div>
            </div>
            <select
              value={selectedRobot}
              onChange={(e) => setSelectedRobot(e.target.value)}
              className={`px-4 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-500 focus:border-transparent min-w-[200px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-slate-300'}`}
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
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Logs</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{stats.total}</p>
            </div>
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Info</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>{stats.info}</p>
            </div>
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
              <p className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>Warning</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-yellow-300' : 'text-yellow-900'}`}>{stats.warning}</p>
            </div>
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>Error</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-red-300' : 'text-red-900'}`}>{stats.error}</p>
            </div>
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
              <p className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Critical</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>{stats.critical}</p>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'all' 
                ? 'bg-blue-600 text-white' 
                : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-1" />
            All Logs
          </button>
          <button
            onClick={() => setViewMode('errors')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'errors' 
                ? 'bg-red-600 text-white' 
                : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Errors Only
          </button>
          <button
            onClick={() => setViewMode('commands')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'commands' 
                ? 'bg-orange-600 text-white' 
                : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Terminal className="h-4 w-4 inline mr-1" />
            Commands
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Filters:</span>
          </div>

          {viewMode === 'all' && (
            <>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className={`px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
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
                className={`px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
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
            className={`px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
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
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Logs by Category</h3>
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
            <FileText className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No logs found</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Try adjusting your filters</p>
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
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                            <Bot className="h-3 w-3" />
                            {log.robot_id}
                          </span>
                        ) : (
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                            System
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(log.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm font-mono truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {log.message}
                      </p>
                    </div>
                  </div>
                  <button className={`p-1 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>Timestamp</p>
                        <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{formatDate(log.timestamp)}</p>
                      </div>
                      <div>
                        <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>Level</p>
                        <p className={`font-medium ${levelConfig.text}`}>{log.level}</p>
                      </div>
                      <div>
                        <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>Category</p>
                        <p className={`font-medium capitalize ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{log.category}</p>
                      </div>
                      <div>
                        <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>Robot ID</p>
                        <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{log.robot_id || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Full Message:</p>
                      <pre className={`p-4 rounded-lg text-sm overflow-x-auto font-mono whitespace-pre-wrap ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-900 text-gray-100'}`}>
                        {log.message}
                      </pre>
                    </div>
                    
                    {log.details && (
                      <div>
                        <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Details (Stack Trace / Additional Info):</p>
                        <pre className={`p-4 rounded-lg text-xs overflow-x-auto font-mono border ${isDark ? 'bg-gray-900 text-gray-300 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
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
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Showing first 100 logs. Use filters to narrow down results.
          </p>
        </div>
      )}
    </div>
  );
};

export default Logs;
