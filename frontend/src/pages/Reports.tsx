import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Plus, RefreshCw, AlertCircle, CheckCircle, Sparkles, Wrench } from 'lucide-react';
import { apiService, handleApiError } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';
import { Report } from '../types';

interface AIStatus {
  gemini_available: boolean;
  pdf_available: boolean;
  message: string;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    );
  }

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

      {/* Reports List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Generated Reports ({reports.length})
        </h3>
        
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reports yet. Generate one above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{report.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {report.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        {report.report_type === 'maintenance' ? (
                          <Wrench className="h-4 w-4 text-orange-500" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        {report.report_type === 'maintenance' ? 'Servo Maintenance' : report.report_type}
                      </span>
                      {report.robot_id && (
                        <span>Robot: {report.robot_id}</span>
                      )}
                      <span>Created: {formatDate(report.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadPDF(report.id, true)}
                      className="btn-primary flex items-center gap-2"
                      title="Download PDF with AI Analysis"
                    >
                      <Download className="h-4 w-4" />
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
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(report.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;




