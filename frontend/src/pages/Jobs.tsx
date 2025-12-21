import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Loader, 
  Package,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { apiService } from '../utils/api';

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

const Jobs: React.FC = () => {
  const [robots, setRobots] = useState<string[]>([]);
  const [jobSummaries, setJobSummaries] = useState<{[key: string]: JobSummary}>({});
  const [loading, setLoading] = useState(true);

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
            const response = await fetch(`http://localhost:8000/api/robot-data/job-summary/${robotId}`);
            if (response.ok) {
              summaries[robotId] = await response.json();
            }
          } catch (error) {
            console.error(`Error fetching job for ${robotId}:`, error);
          }
        }
        setJobSummaries(summaries);
      } catch (error) {
        console.error('Error fetching jobs:', error);
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

  const calculateDuration = (start: string | null, end: string | null) => {
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

  const getStatusBadge = (job: JobSummary) => {
    if (job.end_time) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Completed</span>;
    }
    if (job.start_time) {
      return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
        <Loader className="h-4 w-4 animate-spin" />
        In Progress
      </span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Not Started</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Active Jobs</p>
              <p className="text-3xl font-bold text-blue-600">
                {Object.values(jobSummaries).filter(j => j.start_time && !j.end_time).length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-md">
              <Loader className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="metric-card fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Completed Jobs</p>
              <p className="text-3xl font-bold text-green-600">
                {Object.values(jobSummaries).filter(j => j.end_time).length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-100 to-green-200 shadow-md">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="metric-card fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Items Processed</p>
              <p className="text-3xl font-bold text-purple-600">
                {Object.values(jobSummaries).reduce((sum, j) => sum + j.items_done, 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 shadow-md">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Job List */}
      {robots.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No robots connected. Start a robot to see job data.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {robots.map(robotId => {
            const job = jobSummaries[robotId];
            
            if (!job || !job.start_time) {
              return (
                <div key={robotId} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{robotId}</h3>
                      <p className="text-sm text-gray-500">No active or recent jobs</p>
                    </div>
                    {getStatusBadge(job || {} as JobSummary)}
                  </div>
                </div>
              );
            }

            return (
              <div key={robotId} className="card">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{robotId}</h3>
                      <p className="text-sm text-gray-500">
                        Duration: {calculateDuration(job.start_time, job.end_time)}
                      </p>
                    </div>
                    {getStatusBadge(job)}
                  </div>

                  {/* Progress Bar */}
                  {job.items_total > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">
                          Progress: {job.items_done} / {job.items_total} items
                        </span>
                        <span className="font-semibold text-gray-900">
                          {job.percent_complete?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            job.end_time ? 'bg-green-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${job.percent_complete || 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Time Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <span className="font-medium">Start Time:</span>{' '}
                        {formatDateTime(job.start_time)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <div>
                        <span className="font-medium">End Time:</span>{' '}
                        {formatDateTime(job.end_time)}
                      </div>
                    </div>
                  </div>

                  {/* Last Item */}
                  {job.last_item && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Last Processed Item:</p>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(job.last_item, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Recent History */}
                  {job.history && job.history.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Recent History ({job.history.length} items):
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {job.history.slice(-5).reverse().map((entry, idx) => (
                          <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                            <span className="text-gray-500">{new Date(entry.time).toLocaleTimeString()}</span>
                            <span className="text-gray-700 ml-2">
                              {JSON.stringify(entry.item)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Jobs;
