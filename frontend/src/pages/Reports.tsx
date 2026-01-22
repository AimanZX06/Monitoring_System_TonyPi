/**
 * =============================================================================
 * Reports Page Component - Report Generation & PDF Export
 * =============================================================================
 * 
 * This component manages the generation, viewing, and downloading of robot
 * monitoring reports. Reports can include AI-powered analysis if the Gemini
 * API is configured.
 * 
 * REPORT TYPES:
 *   1. Performance Report
 *      - System resource usage (CPU, memory, temperature)
 *      - Historical trends and patterns
 *      - AI recommendations for optimization
 * 
 *   2. Job Summary Report
 *      - Task execution statistics
 *      - Success/failure rates
 *      - Processing times and efficiency
 *      - Requires specific robot selection
 * 
 *   3. Maintenance Report
 *      - Servo temperature and voltage analysis
 *      - Wear and tear predictions
 *      - Maintenance schedule recommendations
 *      - Requires specific robot selection
 * 
 * KEY FEATURES:
 *   - Generate reports with configurable time ranges
 *   - Download as PDF (with or without AI analysis)
 *   - View reports grouped by robot
 *   - AI-powered insights (when Gemini API is available)
 *   - Report statistics dashboard
 *   - Delete old reports
 * 
 * AI INTEGRATION:
 *   The system can integrate with Google Gemini API for intelligent
 *   analysis. When enabled (via GEMINI_API_KEY environment variable):
 *   - Reports include AI-generated insights
 *   - Trend analysis and predictions
 *   - Maintenance recommendations
 *   - Anomaly detection
 * 
 * DATA FLOW:
 *   1. Component mounts → fetch reports, AI status, and robots
 *   2. User selects parameters and generates report
 *   3. Backend processes data and stores report
 *   4. User downloads PDF (calls backend PDF generation endpoint)
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React core - state management and lifecycle
import React, { useState, useEffect } from 'react';

// Lucide React icons - visual elements for report management
import { 
  FileText,      // Main reports page icon
  Download,      // Download PDF button
  Trash2,        // Delete report button
  Plus,          // Generate new report button
  RefreshCw,     // Refresh/loading spinner
  AlertCircle,   // Error/warning indicator
  CheckCircle,   // Success indicator
  Sparkles,      // AI-powered feature indicator
  Wrench,        // Maintenance report icon
  Bot,           // Robot indicator
  BarChart3,     // Statistics/summary icon
  Clock,         // Timestamp indicator
  ChevronDown,   // Expand section
  ChevronUp,     // Collapse section
  Activity,      // Performance report icon
  Briefcase,     // Job report icon
  Calendar,      // Date-related stats
  Filter         // View mode filter
} from 'lucide-react';

// Internal utilities - API client and error handling
import { apiService, handleApiError } from '../utils/api';

// Notification context - toast messages for user feedback
import { useNotification } from '../contexts/NotificationContext';

// TypeScript types - Report type definition
import { Report } from '../types';

// Theme context - dark/light mode support
import { useTheme } from '../contexts/ThemeContext';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Status of AI features availability
 * Returned by the /api/v1/reports/ai-status endpoint
 */
interface AIStatus {
  gemini_available: boolean;  // Is Gemini API key configured?
  pdf_available: boolean;     // Is PDF generation working?
  message: string;            // Status message for display
}

/**
 * Computed statistics about reports in the system
 * Calculated client-side from the reports array
 */
interface ReportStats {
  totalReports: number;        // Total count of all reports
  performanceReports: number;  // Count of performance reports
  jobReports: number;          // Count of job summary reports
  maintenanceReports: number;  // Count of maintenance reports
  reportsToday: number;        // Reports generated today
  reportsThisWeek: number;     // Reports generated this week
  robotsWithReports: number;   // Unique robots with reports
}

const Reports: React.FC = () => {
  const { isDark } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<string>('');
  const [robots, setRobots] = useState<string[]>([]);
  const [reportType, setReportType] = useState<string>('performance');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [expandedRobots, setExpandedRobots] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'all' | 'byRobot'>('byRobot');

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchReports();
    fetchAIStatus();
    fetchRobots();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await apiService.getReports();
      setReports(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(handleApiError(err));
      setLoading(false);
    }
  };

  const fetchRobots = async () => {
    try {
      const robotStatus = await apiService.getRobotStatus();
      const robotIds = robotStatus.map(r => r.robot_id);
      setRobots(robotIds);
      if (robotIds.length > 0 && !selectedRobot) {
        setSelectedRobot(robotIds[0]);
      }
    } catch (err) {
      console.error('Error fetching robots:', err);
    }
  };

  const fetchAIStatus = async () => {
    try {
      const data = await apiService.getAIStatus();
      setAIStatus(data);
    } catch (err) {
      console.error('Error fetching AI status:', err);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      await apiService.generateReport(reportType, timeRange, selectedRobot || undefined);
      await fetchReports();
      success('Report Generated', `${reportType} report created successfully`);
      setError(null);
    } catch (err: any) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      showError('Generation Failed', errorMsg);
    }
    setGenerating(false);
  };

  const downloadPDF = async (reportId: number, includeAI: boolean = true) => {
    setDownloading(reportId);
    try {
      const blob = await apiService.downloadPDF(reportId, includeAI);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('Download Complete', 'PDF report downloaded successfully');
    } catch (err: any) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      showError('Download Failed', errorMsg);
    }
    setDownloading(null);
  };

  const deleteReport = async (reportId: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await apiService.deleteReport(reportId);
      await fetchReports();
      info('Report Deleted', 'Report has been removed');
    } catch (err: any) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      showError('Delete Failed', errorMsg);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getReportStats = (): ReportStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const reportsToday = reports.filter(r => new Date(r.created_at) >= today).length;
    const reportsThisWeek = reports.filter(r => new Date(r.created_at) >= weekAgo).length;
    
    const robotsWithReports = new Set(reports.filter(r => r.robot_id).map(r => r.robot_id)).size;

    return {
      totalReports: reports.length,
      performanceReports: reports.filter(r => r.report_type === 'performance').length,
      jobReports: reports.filter(r => r.report_type === 'job').length,
      maintenanceReports: reports.filter(r => r.report_type === 'maintenance').length,
      reportsToday,
      reportsThisWeek,
      robotsWithReports
    };
  };

  const getReportsByRobot = (): { [key: string]: Report[] } => {
    const grouped: { [key: string]: Report[] } = {};
    
    grouped['All Robots'] = reports.filter(r => !r.robot_id);
    
    reports.filter(r => r.robot_id).forEach(report => {
      const robotId = report.robot_id!;
      if (!grouped[robotId]) {
        grouped[robotId] = [];
      }
      grouped[robotId].push(report);
    });

    return grouped;
  };

  const toggleRobotExpansion = (robotId: string) => {
    setExpandedRobots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(robotId)) {
        newSet.delete(robotId);
      } else {
        newSet.add(robotId);
      }
      return newSet;
    });
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'job':
        return <Briefcase className="h-4 w-4 text-green-500" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getReportTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (type) {
      case 'performance':
        return <span className={`${baseClasses} ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>Performance</span>;
      case 'job':
        return <span className={`${baseClasses} ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'}`}>Job Summary</span>;
      case 'maintenance':
        return <span className={`${baseClasses} ${isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-800'}`}>Maintenance</span>;
      default:
        return <span className={`${baseClasses} ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800'}`}>{type}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <span className={`ml-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading reports...</span>
      </div>
    );
  }

  const stats = getReportStats();
  const reportsByRobot = getReportsByRobot();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FileText className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            Reports & PDF Export
          </h2>
          <button
            onClick={fetchReports}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* AI Status */}
        {aiStatus && (
          <div className={`p-4 rounded-lg mb-4 border ${aiStatus.gemini_available ? (isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200') : (isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200')}`}>
            <div className="flex items-center gap-2">
              {aiStatus.gemini_available ? (
                <Sparkles className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              ) : (
                <AlertCircle className={`h-5 w-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              )}
              <span className={aiStatus.gemini_available ? (isDark ? 'text-green-300' : 'text-green-800') : (isDark ? 'text-yellow-300' : 'text-yellow-800')}>
                {aiStatus.message}
              </span>
            </div>
            {!aiStatus.gemini_available && (
              <p className={`text-sm mt-2 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                To enable AI-powered analysis, set the GEMINI_API_KEY environment variable in docker-compose.yml
              </p>
            )}
          </div>
        )}

        {error && (
          <div className={`p-4 rounded-lg mb-4 border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
            <p className={`flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-800'}`}>
              <AlertCircle className="h-5 w-5" />
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Overall Summary */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-primary-600" />
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Overall Summary (All Robots)</h3>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <FileText className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`} />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Reports</p>
                <p className={`text-xl font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{stats.totalReports}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-800' : 'bg-blue-200'}`}>
                <Activity className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Performance</p>
                <p className={`text-xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>{stats.performanceReports}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 border ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-green-800' : 'bg-green-200'}`}>
                <Briefcase className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-700'}`} />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>Job Summary</p>
                <p className={`text-xl font-bold ${isDark ? 'text-green-300' : 'text-green-900'}`}>{stats.jobReports}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 border ${isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-800' : 'bg-orange-200'}`}>
                <Wrench className={`h-5 w-5 ${isDark ? 'text-orange-400' : 'text-orange-700'}`} />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Maintenance</p>
                <p className={`text-xl font-bold ${isDark ? 'text-orange-300' : 'text-orange-900'}`}>{stats.maintenanceReports}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`rounded-xl p-4 border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                <Calendar className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Reports Today</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.reportsToday}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
                <Clock className={`h-5 w-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>This Week</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.reportsThisWeek}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-teal-900/30' : 'bg-teal-100'}`}>
                <Bot className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Robots with Reports</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.robotsWithReports}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Report */}
      <div className="card">
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Plus className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          Generate New Report
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Robot (Optional)
            </label>
            <select
              value={selectedRobot}
              onChange={(e) => setSelectedRobot(e.target.value)}
              className="input-field"
            >
              <option value="">All Robots</option>
              {robots.map((robotId) => (
                <option key={robotId} value={robotId}>
                  {robotId}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              <option value="performance">Performance</option>
              <option value="job">Job Summary</option>
              <option value="maintenance">Servo Maintenance</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-field"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={generating || ((reportType === 'maintenance' || reportType === 'job') && !selectedRobot)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
        
        {(reportType === 'maintenance' || reportType === 'job') && !selectedRobot && (
          <div className={`p-3 rounded-lg mt-4 border ${isDark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
              <AlertCircle className="h-4 w-4" />
              {reportType === 'maintenance' 
                ? 'Servo Maintenance reports require selecting a specific robot.'
                : 'Job Summary reports require selecting a specific robot.'}
            </p>
          </div>
        )}
        
        {reportType === 'maintenance' && selectedRobot && (
          <div className={`p-3 rounded-lg mt-4 border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
            <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              <Wrench className="h-4 w-4" />
              <span>
                <strong>Servo Maintenance Report</strong> will analyze servo temperature, voltage, and position data 
                to provide AI-powered maintenance recommendations.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Per Robot Breakdown */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary-600" />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Per Robot Breakdown</h3>
            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>({reports.length} total reports)</span>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Filter className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <div className={`flex rounded-lg border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setViewMode('byRobot')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'byRobot' 
                    ? 'bg-primary-600 text-white' 
                    : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                By Robot
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'all' 
                    ? 'bg-primary-600 text-white' 
                    : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                All Reports
              </button>
            </div>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No reports yet. Generate one above!</p>
          </div>
        ) : viewMode === 'byRobot' ? (
          <div className="space-y-3">
            {Object.entries(reportsByRobot).map(([robotId, robotReports]) => {
              if (robotReports.length === 0) return null;
              
              const isExpanded = expandedRobots.has(robotId);
              const isAllRobots = robotId === 'All Robots';
              
              const performanceCount = robotReports.filter(r => r.report_type === 'performance').length;
              const jobCount = robotReports.filter(r => r.report_type === 'job').length;
              const maintenanceCount = robotReports.filter(r => r.report_type === 'maintenance').length;
              
              return (
                <div 
                  key={robotId} 
                  className={`rounded-xl border transition-all duration-200 ${
                    isAllRobots 
                      ? (isDark ? 'border-purple-700 bg-purple-900/20' : 'border-purple-200 bg-purple-50/50')
                      : (isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50')
                  }`}
                >
                  <div 
                    className={`p-4 cursor-pointer transition-colors rounded-xl ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-white/50'}`}
                    onClick={() => toggleRobotExpansion(robotId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          isAllRobots ? (isDark ? 'bg-purple-800' : 'bg-purple-200') : (isDark ? 'bg-gray-700' : 'bg-gray-200')
                        }`}>
                          {isAllRobots ? (
                            <BarChart3 className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-700'}`} />
                          ) : (
                            <Bot className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-700'}`} />
                          )}
                        </div>
                        
                        <div>
                          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{robotId}</h4>
                          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {robotReports.length} report{robotReports.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 text-xs">
                          {performanceCount > 0 && (
                            <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                              {performanceCount} Performance
                            </span>
                          )}
                          {jobCount > 0 && (
                            <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                              {jobCount} Job
                            </span>
                          )}
                          {maintenanceCount > 0 && (
                            <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                              {maintenanceCount} Maintenance
                            </span>
                          )}
                        </div>

                        <button className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}>
                          {isExpanded ? (
                            <ChevronUp className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          ) : (
                            <ChevronDown className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={`px-4 pb-4 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                      <div className="pt-4 space-y-3">
                        {robotReports.map((report) => (
                          <div
                            key={report.id}
                            className={`p-4 rounded-lg border hover:shadow-md transition-shadow ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {getReportTypeIcon(report.report_type)}
                                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{report.title}</h4>
                                  {getReportTypeBadge(report.report_type)}
                                </div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {report.description || 'No description'}
                                </p>
                                <p className={`text-xs mt-2 flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  <Clock className="h-3 w-3" />
                                  Created: {formatDate(report.created_at)}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={(e) => { e.stopPropagation(); downloadPDF(report.id, true); }}
                                  disabled={downloading === report.id}
                                  className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3"
                                  title="Download PDF with AI Analysis"
                                >
                                  {downloading === report.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                  PDF
                                  {aiStatus?.gemini_available && (
                                    <Sparkles className="h-3 w-3" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); downloadPDF(report.id, false); }}
                                  className="btn-secondary flex items-center gap-1 text-sm py-1.5 px-3"
                                  title="Download PDF without AI"
                                >
                                  <Download className="h-4 w-4" />
                                  Basic
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}
                                  className="btn-danger flex items-center gap-1 text-sm py-1.5 px-2"
                                  title="Delete Report"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className={`p-4 rounded-lg border hover:shadow-md transition-shadow ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getReportTypeIcon(report.report_type)}
                      <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{report.title}</h4>
                      {getReportTypeBadge(report.report_type)}
                    </div>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {report.description || 'No description'}
                    </p>
                    <div className={`flex items-center gap-4 mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {report.robot_id && (
                        <span className="flex items-center gap-1">
                          <Bot className="h-4 w-4" />
                          {report.robot_id}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadPDF(report.id, true)}
                      disabled={downloading === report.id}
                      className="btn-primary flex items-center gap-2"
                      title="Download PDF with AI Analysis"
                    >
                      {downloading === report.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      PDF
                      {aiStatus?.gemini_available && (
                        <Sparkles className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={() => downloadPDF(report.id, false)}
                      className="btn-secondary flex items-center gap-2"
                      title="Download PDF without AI"
                    >
                      <Download className="h-4 w-4" />
                      Basic
                    </button>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="btn-danger flex items-center gap-2"
                      title="Delete Report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
