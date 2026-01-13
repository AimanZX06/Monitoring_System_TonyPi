import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Sparkles, 
  Wrench,
  Bot,
  BarChart3,
  Clock,
  ChevronDown,
  ChevronUp,
  Activity,
  Briefcase,
  Calendar,
  Filter
} from 'lucide-react';
import { apiService, handleApiError } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';
import { Report } from '../types';

interface AIStatus {
  gemini_available: boolean;
  pdf_available: boolean;
  message: string;
}

interface ReportStats {
  totalReports: number;
  performanceReports: number;
  jobReports: number;
  maintenanceReports: number;
  reportsToday: number;
  reportsThisWeek: number;
  robotsWithReports: number;
}

const Reports: React.FC = () => {
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
    
    // Add "All Robots" category for reports without specific robot
    grouped['All Robots'] = reports.filter(r => !r.robot_id);
    
    // Group by robot_id
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
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Performance</span>;
      case 'job':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Job Summary</span>;
      case 'maintenance':
        return <span className={`${baseClasses} bg-orange-100 text-orange-800`}>Maintenance</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{type}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading reports...</span>
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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
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
          <div className={`p-4 rounded-lg mb-4 ${aiStatus.gemini_available ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center gap-2">
              {aiStatus.gemini_available ? (
                <Sparkles className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <span className={aiStatus.gemini_available ? 'text-green-800' : 'text-yellow-800'}>
                {aiStatus.message}
              </span>
            </div>
            {!aiStatus.gemini_available && (
              <p className="text-sm text-yellow-700 mt-2">
                To enable AI-powered analysis, set the GEMINI_API_KEY environment variable in docker-compose.yml
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </p>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* OVERALL SUMMARY FOR ALL ROBOTS */}
      {/* ============================================ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Overall Summary (All Robots)</h3>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Reports */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-200">
                <FileText className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600">Total Reports</p>
                <p className="text-xl font-bold text-slate-900">{stats.totalReports}</p>
              </div>
            </div>
          </div>

          {/* Performance Reports */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-200">
                <Activity className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600">Performance</p>
                <p className="text-xl font-bold text-blue-900">{stats.performanceReports}</p>
              </div>
            </div>
          </div>

          {/* Job Reports */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-200">
                <Briefcase className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-green-600">Job Summary</p>
                <p className="text-xl font-bold text-green-900">{stats.jobReports}</p>
              </div>
            </div>
          </div>

          {/* Maintenance Reports */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-200">
                <Wrench className="h-5 w-5 text-orange-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-orange-600">Maintenance</p>
                <p className="text-xl font-bold text-orange-900">{stats.maintenanceReports}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Reports Today */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Reports Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reportsToday}</p>
              </div>
            </div>
          </div>

          {/* Reports This Week */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Clock className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reportsThisWeek}</p>
              </div>
            </div>
          </div>

          {/* Robots with Reports */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <Bot className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Robots with Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.robotsWithReports}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Report */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-600" />
          Generate New Report
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
        
        {/* Robot selection requirement note */}
        {(reportType === 'maintenance' || reportType === 'job') && !selectedRobot && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-4">
            <p className="text-amber-800 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {reportType === 'maintenance' 
                ? 'Servo Maintenance reports require selecting a specific robot.'
                : 'Job Summary reports require selecting a specific robot.'}
            </p>
          </div>
        )}
        
        {/* Maintenance report info */}
        {reportType === 'maintenance' && selectedRobot && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
            <p className="text-blue-800 text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span>
                <strong>Servo Maintenance Report</strong> will analyze servo temperature, voltage, and position data 
                to provide AI-powered maintenance recommendations.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* PER ROBOT BREAKDOWN */}
      {/* ============================================ */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Per Robot Breakdown</h3>
            <span className="text-sm text-gray-500">({reports.length} total reports)</span>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode('byRobot')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'byRobot' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                By Robot
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'all' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                All Reports
              </button>
            </div>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reports yet. Generate one above!</p>
          </div>
        ) : viewMode === 'byRobot' ? (
          /* By Robot View */
          <div className="space-y-3">
            {Object.entries(reportsByRobot).map(([robotId, robotReports]) => {
              if (robotReports.length === 0) return null;
              
              const isExpanded = expandedRobots.has(robotId);
              const isAllRobots = robotId === 'All Robots';
              
              // Count report types for this robot
              const performanceCount = robotReports.filter(r => r.report_type === 'performance').length;
              const jobCount = robotReports.filter(r => r.report_type === 'job').length;
              const maintenanceCount = robotReports.filter(r => r.report_type === 'maintenance').length;
              
              return (
                <div 
                  key={robotId} 
                  className={`rounded-xl border transition-all duration-200 ${
                    isAllRobots 
                      ? 'border-purple-200 bg-purple-50/50' 
                      : 'border-gray-200 bg-gray-50/50'
                  }`}
                >
                  {/* Robot Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/50 transition-colors rounded-xl"
                    onClick={() => toggleRobotExpansion(robotId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${
                          isAllRobots ? 'bg-purple-200' : 'bg-gray-200'
                        }`}>
                          {isAllRobots ? (
                            <BarChart3 className="h-5 w-5 text-purple-700" />
                          ) : (
                            <Bot className="h-5 w-5 text-gray-700" />
                          )}
                        </div>
                        
                        {/* Robot Info */}
                        <div>
                          <h4 className="font-semibold text-gray-900">{robotId}</h4>
                          <p className="text-sm text-gray-500">
                            {robotReports.length} report{robotReports.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Quick Stats */}
                        <div className="hidden sm:flex items-center gap-3 text-xs">
                          {performanceCount > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {performanceCount} Performance
                            </span>
                          )}
                          {jobCount > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              {jobCount} Job
                            </span>
                          )}
                          {maintenanceCount > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                              {maintenanceCount} Maintenance
                            </span>
                          )}
                        </div>

                        {/* Expand Icon */}
                        <button className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200/50">
                      <div className="pt-4 space-y-3">
                        {robotReports.map((report) => (
                          <div
                            key={report.id}
                            className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {getReportTypeIcon(report.report_type)}
                                  <h4 className="font-semibold text-gray-900">{report.title}</h4>
                                  {getReportTypeBadge(report.report_type)}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {report.description || 'No description'}
                                </p>
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
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
          /* All Reports View */
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getReportTypeIcon(report.report_type)}
                      <h4 className="text-lg font-semibold text-gray-900">{report.title}</h4>
                      {getReportTypeBadge(report.report_type)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {report.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
                
                {/* Report Data Preview */}
                {report.data && (
                  <div className="mt-4 p-3 bg-white rounded border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Report Data:</p>
                    <pre className="text-xs text-gray-700 overflow-x-auto max-h-32">
                      {JSON.stringify(report.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Summary Table */}
      {reports.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Reports Summary by Robot</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Robot ID</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Performance</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Job Summary</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Maintenance</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Latest Report</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reportsByRobot).map(([robotId, robotReports]) => {
                  if (robotReports.length === 0) return null;
                  
                  const performanceCount = robotReports.filter(r => r.report_type === 'performance').length;
                  const jobCount = robotReports.filter(r => r.report_type === 'job').length;
                  const maintenanceCount = robotReports.filter(r => r.report_type === 'maintenance').length;
                  const latestReport = robotReports.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )[0];
                  
                  return (
                    <tr key={robotId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {robotId === 'All Robots' ? (
                            <BarChart3 className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Bot className="h-4 w-4 text-gray-600" />
                          )}
                          <span className="font-medium text-gray-900">{robotId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {performanceCount > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold">
                            {performanceCount}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {jobCount > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 font-semibold">
                            {jobCount}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {maintenanceCount > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-800 font-semibold">
                            {maintenanceCount}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-semibold">
                          {robotReports.length}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 text-xs">
                        {formatShortDate(latestReport.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Table Footer with Totals */}
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4 text-gray-700">Total</td>
                  <td className="py-3 px-4 text-center text-blue-800">{stats.performanceReports}</td>
                  <td className="py-3 px-4 text-center text-green-800">{stats.jobReports}</td>
                  <td className="py-3 px-4 text-center text-orange-800">{stats.maintenanceReports}</td>
                  <td className="py-3 px-4 text-center text-gray-800">{stats.totalReports}</td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
