import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Loader, 
  Package,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Bot,
  BarChart3,
  Timer,
  Target
} from 'lucide-react';
import { apiService, handleApiError } from '../utils/api';

interface JobSummary {
  robot_id: string;
  start_time: string | null;
  end_time: string | null;
  items_total: number;
  items_done: number;
  percent_complete: number | null;
  last_item: any;
  history: Array<{time: string, item: any}>;
}

interface OverallStats {
  totalRobots: number;
  activeJobs: number;
  completedJobs: number;
  notStartedJobs: number;
  totalItemsProcessed: number;
  totalItemsTarget: number;
  averageCompletion: number;
  totalDuration: string;
}

const Jobs: React.FC = () => {
  const [robots, setRobots] = useState<string[]>([]);
  const [jobSummaries, setJobSummaries] = useState<{[key: string]: JobSummary}>({});
  const [loading, setLoading] = useState(true);
  const [expandedRobots, setExpandedRobots] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Get all robots
        const robotStatus = await apiService.getRobotStatus();
        const robotIds = robotStatus.map(r => r.robot_id);
        setRobots(robotIds);

        // Fetch job summary for each robot
        const summaries: {[key: string]: JobSummary} = {};
        for (const robotId of robotIds) {
          try {
            const jobData = await apiService.getJobSummary(robotId);
            summaries[robotId] = jobData;
          } catch (err) {
            // Job might not exist for this robot
            console.error(`Error fetching job for ${robotId}:`, handleApiError(err));
          }
        }
        setJobSummaries(summaries);
      } catch (err) {
        console.error('Error fetching jobs:', handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const calculateDuration = (start: string | null, end: string | null): string => {
    if (!start) return 'N/A';
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const calculateDurationSeconds = (start: string | null, end: string | null): number => {
    if (!start) return 0;
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  };

  const formatTotalDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getOverallStats = (): OverallStats => {
    const jobs = Object.values(jobSummaries);
    const activeJobs = jobs.filter(j => j.start_time && !j.end_time);
    const completedJobs = jobs.filter(j => j.end_time);
    const jobsWithProgress = jobs.filter(j => j.start_time);
    
    const totalItemsProcessed = jobs.reduce((sum, j) => sum + (j.items_done || 0), 0);
    const totalItemsTarget = jobs.reduce((sum, j) => sum + (j.items_total || 0), 0);
    
    const averageCompletion = jobsWithProgress.length > 0
      ? jobsWithProgress.reduce((sum, j) => sum + (j.percent_complete || 0), 0) / jobsWithProgress.length
      : 0;

    const totalDurationSeconds = jobs.reduce((sum, j) => 
      sum + calculateDurationSeconds(j.start_time, j.end_time), 0);

    return {
      totalRobots: robots.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      notStartedJobs: robots.length - jobsWithProgress.length,
      totalItemsProcessed,
      totalItemsTarget,
      averageCompletion,
      totalDuration: formatTotalDuration(totalDurationSeconds)
    };
  };

  const getStatusBadge = (job: JobSummary | undefined) => {
    if (!job) {
      return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">No Data</span>;
    }
    if (job.end_time) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
        <CheckCircle className="h-4 w-4" />
        Completed
      </span>;
    }
    if (job.start_time) {
      return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
        <Loader className="h-4 w-4 animate-spin" />
        In Progress
      </span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Not Started</span>;
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

  const getRobotStatus = (job: JobSummary | undefined): 'active' | 'completed' | 'idle' => {
    if (!job || !job.start_time) return 'idle';
    if (job.end_time) return 'completed';
    return 'active';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6" />
          Job Tracking & Summary
        </h2>
        <p className="text-gray-600 mt-1">
          Monitor job progress, completion percentage, and timing for all robots
        </p>
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
          {/* Total Robots */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-200">
                <Bot className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600">Total Robots</p>
                <p className="text-xl font-bold text-slate-900">{stats.totalRobots}</p>
              </div>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-200">
                <Loader className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600">Active Jobs</p>
                <p className="text-xl font-bold text-blue-900">{stats.activeJobs}</p>
              </div>
            </div>
          </div>

          {/* Completed Jobs */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-200">
                <CheckCircle className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-green-600">Completed Jobs</p>
                <p className="text-xl font-bold text-green-900">{stats.completedJobs}</p>
              </div>
            </div>
          </div>

          {/* Idle Robots */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-200">
                <Clock className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Idle / No Job</p>
                <p className="text-xl font-bold text-gray-900">{stats.notStartedJobs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Items Processed */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Items Processed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalItemsProcessed}
                    {stats.totalItemsTarget > 0 && (
                      <span className="text-sm font-normal text-gray-500"> / {stats.totalItemsTarget}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Average Completion */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Average Completion</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stats.averageCompletion.toFixed(1)}%</p>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.averageCompletion}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Duration */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Timer className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Run Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDuration}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* PER ROBOT BREAKDOWN */}
      {/* ============================================ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Bot className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Per Robot Breakdown</h3>
          <span className="ml-auto text-sm text-gray-500">{robots.length} robot(s)</span>
        </div>

        {robots.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No robots connected. Start a robot to see job data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {robots.map(robotId => {
              const job = jobSummaries[robotId];
              const status = getRobotStatus(job);
              const isExpanded = expandedRobots.has(robotId);
              
              return (
                <div 
                  key={robotId} 
                  className={`rounded-xl border transition-all duration-200 ${
                    status === 'active' ? 'border-blue-200 bg-blue-50/50' :
                    status === 'completed' ? 'border-green-200 bg-green-50/50' :
                    'border-gray-200 bg-gray-50/50'
                  }`}
                >
                  {/* Robot Header - Always Visible */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/50 transition-colors rounded-xl"
                    onClick={() => toggleRobotExpansion(robotId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Status Indicator */}
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'active' ? 'bg-blue-500 animate-pulse' :
                          status === 'completed' ? 'bg-green-500' :
                          'bg-gray-400'
                        }`} />
                        
                        {/* Robot Info */}
                        <div>
                          <h4 className="font-semibold text-gray-900">{robotId}</h4>
                          <p className="text-sm text-gray-500">
                            {job?.start_time 
                              ? `Duration: ${calculateDuration(job.start_time, job.end_time)}`
                              : 'No active job'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Quick Stats */}
                        {job?.start_time && (
                          <div className="hidden sm:flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-gray-500">Items</p>
                              <p className="font-semibold text-gray-900">
                                {job.items_done}{job.items_total > 0 && `/${job.items_total}`}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500">Progress</p>
                              <p className="font-semibold text-gray-900">
                                {(job.percent_complete || 0).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Status Badge */}
                        {getStatusBadge(job)}

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

                    {/* Progress Bar (visible in collapsed state too) */}
                    {job?.items_total > 0 && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              job.end_time ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${job.percent_complete || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && job?.start_time && (
                    <div className="px-4 pb-4 border-t border-gray-200/50">
                      <div className="pt-4 space-y-4">
                        {/* Detailed Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Items Done</p>
                            <p className="text-lg font-bold text-gray-900">{job.items_done}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Total Items</p>
                            <p className="text-lg font-bold text-gray-900">{job.items_total || 'N/A'}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Completion</p>
                            <p className="text-lg font-bold text-gray-900">{(job.percent_complete || 0).toFixed(1)}%</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Duration</p>
                            <p className="text-lg font-bold text-gray-900">{calculateDuration(job.start_time, job.end_time)}</p>
                          </div>
                        </div>

                        {/* Time Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <span className="font-medium">Start Time:</span>{' '}
                              {formatDateTime(job.start_time)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <div>
                              <span className="font-medium">End Time:</span>{' '}
                              {formatDateTime(job.end_time)}
                            </div>
                          </div>
                        </div>

                        {/* Last Item */}
                        {job.last_item && (
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Last Processed Item:</p>
                            <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                              {JSON.stringify(job.last_item, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Recent History */}
                        {job.history && job.history.length > 0 && (
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Recent History ({job.history.length} items):
                            </p>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {job.history.slice(-5).reverse().map((entry, idx) => (
                                <div key={idx} className="text-xs bg-gray-50 p-2 rounded flex items-center gap-2">
                                  <span className="text-gray-500 whitespace-nowrap">
                                    {new Date(entry.time).toLocaleTimeString()}
                                  </span>
                                  <span className="text-gray-700 truncate">
                                    {JSON.stringify(entry.item)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message for robots with no job data */}
                  {isExpanded && (!job || !job.start_time) && (
                    <div className="px-4 pb-4 border-t border-gray-200/50">
                      <div className="pt-4 text-center text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No job data available for this robot</p>
                        <p className="text-xs text-gray-400 mt-1">Start a job to see tracking information</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Summary Table (Optional detailed view) */}
      {robots.length > 0 && Object.keys(jobSummaries).length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Comparison</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Robot ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Items Done</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Items</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Progress</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Duration</th>
                </tr>
              </thead>
              <tbody>
                {robots.map(robotId => {
                  const job = jobSummaries[robotId];
                  const status = getRobotStatus(job);
                  
                  return (
                    <tr key={robotId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{robotId}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'active' ? 'bg-blue-100 text-blue-800' :
                          status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {status === 'active' && <Loader className="h-3 w-3 mr-1 animate-spin" />}
                          {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">{job?.items_done || 0}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{job?.items_total || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                status === 'completed' ? 'bg-green-500' :
                                status === 'active' ? 'bg-blue-500' :
                                'bg-gray-400'
                              }`}
                              style={{ width: `${job?.percent_complete || 0}%` }}
                            />
                          </div>
                          <span className="text-gray-900 w-12 text-right">
                            {(job?.percent_complete || 0).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {job?.start_time ? calculateDuration(job.start_time, job.end_time) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Table Footer with Totals */}
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4 text-gray-700">Total</td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600 text-xs">
                      {stats.activeJobs} active, {stats.completedJobs} done
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">{stats.totalItemsProcessed}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{stats.totalItemsTarget || '-'}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{stats.averageCompletion.toFixed(1)}% avg</td>
                  <td className="py-3 px-4 text-right text-gray-600">{stats.totalDuration}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
