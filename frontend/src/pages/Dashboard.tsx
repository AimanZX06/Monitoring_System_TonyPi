import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Battery, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { apiService } from '../utils/api';
import { RobotData } from '../types';

// Simple utility functions instead of importing
const formatDate = (date: string) => new Date(date).toLocaleString();
const getStatusColor = (status: string) => status === 'online' ? 'text-green-600' : 'text-red-600';
const getBatteryColor = (level: number) => level > 50 ? 'text-green-600' : level > 20 ? 'text-yellow-600' : 'text-red-600';

const Dashboard: React.FC = () => {
  const [robotData, setRobotData] = useState<RobotData[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [jobStats, setJobStats] = useState<any>({ activeJobs: 0, completedToday: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [robots, status] = await Promise.all([
          apiService.getRobotStatus(),
          apiService.getSystemStatus()
        ]);
        
        setRobotData(robots);
        setSystemStatus(status);
        
        // Fetch job statistics
        if (robots.length > 0) {
          let activeCount = 0;
          let completedCount = 0;
          let totalItemsProcessed = 0;
          
          for (const robot of robots) {
            try {
              const response = await fetch(`/api/robot-data/job-summary/${robot.robot_id}`);
              if (response.ok) {
                const jobData = await response.json();
                if (jobData.start_time && !jobData.end_time) {
                  activeCount++;
                } else if (jobData.end_time) {
                  const today = new Date().toDateString();
                  const endDate = new Date(jobData.end_time).toDateString();
                  if (today === endDate) {
                    completedCount++;
                  }
                }
                totalItemsProcessed += jobData.items_done || 0;
              }
            } catch (e) {
              console.error(`Error fetching job for ${robot.robot_id}:`, e);
            }
          }
          
          setJobStats({ activeJobs: activeCount, completedToday: completedCount, totalItems: totalItemsProcessed });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up periodic refresh
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Active Robots',
      value: systemStatus?.active_robots || robotData.filter(r => r.status === 'online').length,
      icon: Activity,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Active Jobs',
      value: jobStats.activeJobs,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Completed Today',
      value: jobStats.completedToday,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Items Processed',
      value: jobStats.totalItems,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div key={index} className="card">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Robot Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {robotData.map((robot) => (
          <div key={robot.robot_id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {robot.name || robot.robot_id}
                  </h3>
                  <p className="text-sm text-gray-500">ID: {robot.robot_id}</p>
                </div>
              </div>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(robot.status)}`}>
                {robot.status.toUpperCase()}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {/* Battery */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Battery className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Battery</span>
                </div>
                <span className={`text-sm font-medium ${getBatteryColor(robot.battery_percentage)}`}>
                  {robot.battery_percentage?.toFixed(1) || 'N/A'}%
                </span>
              </div>

              {/* Location */}
              {robot.location && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Position</span>
                  </div>
                  <span className="text-sm font-mono text-gray-900">
                    ({robot.location.x.toFixed(1)}, {robot.location.y.toFixed(1)})
                  </span>
                </div>
              )}

              {/* Last Seen */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Last Seen</span>
                </div>
                <span className="text-sm text-gray-900">
                  {formatDate(robot.last_seen)}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button className="btn-primary text-xs px-3 py-1">
                  View Details
                </button>
                <button className="btn-secondary text-xs px-3 py-1">
                  Send Command
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Services Status */}
      {systemStatus?.services && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Services</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(systemStatus.services).map(([service, status]) => (
              <div key={service} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'running' ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {service.replace('_', ' ')}
                  </p>
                  <p className={`text-xs ${
                    status === 'running' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {String(status)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Usage */}
      {systemStatus?.resource_usage && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Usage</h3>
          <div className="space-y-4">
            {Object.entries(systemStatus.resource_usage).map(([resource, usage]) => {
              const usageNum = Number(usage);
              return (
                <div key={resource}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">
                      {resource.replace('_', ' ')}
                    </span>
                    <span className="font-medium">{usageNum}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full ${
                        usageNum > 80 ? 'bg-red-500' : usageNum > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${usageNum}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;