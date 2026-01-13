import React, { useState, useEffect } from 'react';
import Monitoring from './pages/Monitoring';
import Jobs from './pages/Jobs';
import Robots from './pages/Robots';
import Servos from './pages/Servos';
import Reports from './pages/Reports';
import Sensors from './pages/Sensors';
import Alerts from './pages/Alerts';
import Logs from './pages/Logs';
import { Activity, Wifi, WifiOff, Clock, Zap, AlertCircle, BookOpen, CheckCircle, HelpCircle, X, Compass, Bell, FileText } from 'lucide-react';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/Toast';
import { apiService } from './utils/api';

interface RobotData {
  robot_id: string;
  battery_level: number;
  location: { x: number; y: number; z: number };
  sensors: { [key: string]: number };
  status: string;
  last_seen: string;
}

interface SensorReading {
  timestamp: string;
  sensor_type: string;
  value: number;
  unit: string;
}

// Inner component that uses notifications
const TonyPiAppContent: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [systemStatus] = useState<string>('Online');
  const [robotData, setRobotData] = useState<RobotData | null>(null);
  const [allRobots, setAllRobots] = useState<RobotData[]>([]);
  const [recentSensors, setRecentSensors] = useState<SensorReading[]>([]);
  const [jobStats, setJobStats] = useState<any>({ activeJobs: 0, completedToday: 0, totalItems: 0 });
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [selectedRobotId, setSelectedRobotId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [systemServices, setSystemServices] = useState<any>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  
  // useNotification available if needed for future features

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch robot data periodically
  useEffect(() => {
    const fetchRobotData = async () => {
      try {
        const [robots, status] = await Promise.all([
          apiService.getRobotStatus(),
          apiService.getSystemStatus()
        ]);
        
        setAllRobots(robots as any);
        if (status?.services) {
          setSystemServices(status.services);
        }
        
        if (robots.length > 0) {
          // Use selected robot or default to first robot
          const targetRobot = selectedRobotId 
            ? robots.find(r => r.robot_id === selectedRobotId) 
            : robots[0];
          
          if (targetRobot) {
            setRobotData(targetRobot as any);
            // Auto-set selected robot if not set
            if (!selectedRobotId) {
              setSelectedRobotId(targetRobot.robot_id);
            }
          }
          setIsConnected(true);
          
          // Fetch job statistics
          let activeCount = 0;
          let completedCount = 0;
          let totalItemsProcessed = 0;
          
          for (const robot of robots) {
            try {
              const jobData = await apiService.getJobSummary(robot.robot_id);
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
            } catch (e) {
              // Job summary might not exist yet
            }
          }
          setJobStats({ activeJobs: activeCount, completedToday: completedCount, totalItems: totalItemsProcessed });
        } else {
          setIsConnected(false);
        }

        const sensors = await apiService.getSensorData('sensors', '1m');
        setRecentSensors(sensors.slice(-10) as any);
      } catch (err) {
        console.error('Error fetching robot data:', err);
        setIsConnected(false);
      }
    };

    fetchRobotData();
    const interval = setInterval(fetchRobotData, 5000);
    return () => clearInterval(interval);
  }, [selectedRobotId]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'sensors', label: 'Sensors', icon: Compass },
    { id: 'robots', label: 'Robots', icon: Activity },
    { id: 'servos', label: 'Servos', icon: Zap },
    { id: 'jobs', label: 'Jobs', icon: Zap },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'reports', label: 'Reports', icon: AlertCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TonyPi Robot Monitoring System
                </h1>
                <p className="text-sm text-gray-500">Real-time monitoring and control</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{currentTime || 'Loading...'}</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                title="Getting Started Guide"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Help</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200 sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 py-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`tab-button ${
                  selectedTab === tab.id ? 'tab-button-active' : 'tab-button-inactive'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Performance Tab */}
        {selectedTab === 'performance' && (
          <div className="fade-in">
            <Monitoring />
          </div>
        )}

        {/* Jobs Tab */}
        {selectedTab === 'jobs' && (
          <div className="fade-in">
            <Jobs />
          </div>
        )}

        {/* Robots Tab */}
        {selectedTab === 'robots' && (
          <div className="fade-in">
            <Robots />
          </div>
        )}

        {/* Servos Tab */}
        {selectedTab === 'servos' && (
          <div className="fade-in">
            <Servos />
          </div>
        )}

        {/* Reports Tab */}
        {selectedTab === 'reports' && (
          <div className="fade-in">
            <Reports />
          </div>
        )}

        {/* Alerts Tab */}
        {selectedTab === 'alerts' && (
          <div className="fade-in">
            <Alerts />
          </div>
        )}

        {/* Logs Tab */}
        {selectedTab === 'logs' && (
          <div className="fade-in">
            <Logs />
          </div>
        )}

        {/* Sensors Tab */}
        {selectedTab === 'sensors' && (
          <div className="fade-in">
            <Sensors />
          </div>
        )}

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6 fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <Activity className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Robots</p>
                    <p className="text-2xl font-bold text-gray-900">{allRobots.filter(r => r.status === 'online').length}</p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{jobStats.activeJobs}</p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-50">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed Today</p>
                    <p className="text-2xl font-bold text-gray-900">{jobStats.completedToday}</p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Items Processed</p>
                    <p className="text-2xl font-bold text-gray-900">{jobStats.totalItems}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  System Status
                </h2>
                <div className={`status-${systemStatus === 'Online' ? 'online' : 'offline'}`}>
                  {systemStatus}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-600 mb-1">Backend Status</p>
                  <p className={`text-lg font-semibold ${systemStatus === 'Online' ? 'text-green-600' : 'text-red-600'}`}>
                    {systemStatus}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm text-gray-600 mb-1">Robot Connection</p>
                  <p className={`text-lg font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-sm text-gray-600 mb-1">Current Time</p>
                  <p className="text-lg font-semibold text-gray-900">{currentTime || 'Loading...'}</p>
                </div>
              </div>
            </div>

            {/* Robot Status Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Robot Status
                </h2>
                {allRobots.length > 0 && (
                  <select
                    value={selectedRobotId}
                    onChange={(e) => setSelectedRobotId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {allRobots.map((robot) => (
                      <option key={robot.robot_id} value={robot.robot_id}>
                        {robot.robot_id} {robot.status === 'online' ? '(Online)' : '(Offline)'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {robotData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Robot ID</p>
                      <p className="text-lg font-semibold text-gray-900">{robotData.robot_id}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{robotData.status}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                      <p className="text-sm text-gray-600 mb-1">Battery Level</p>
                      <p className="text-lg font-semibold text-gray-900">{robotData.battery_level?.toFixed(1) || 'N/A'}%</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <p className="text-sm text-gray-600 mb-2">Position</p>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">X: {robotData.location?.x?.toFixed(2) || 0}</p>
                        <p className="text-sm font-medium text-gray-700">Y: {robotData.location?.y?.toFixed(2) || 0}</p>
                        <p className="text-sm font-medium text-gray-700">Z: {robotData.location?.z?.toFixed(2) || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No robot connected. Start the robot simulator to see data.</p>
                </div>
              )}
            </div>

            {/* System Services Status */}
            {systemServices && Object.keys(systemServices).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Services</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(systemServices).map(([service, status]) => (
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

            {/* Sensor Data Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Recent Sensor Data
                </h2>
                {selectedRobotId && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {selectedRobotId}
                  </span>
                )}
              </div>
              {recentSensors.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {recentSensors.slice(-6).map((sensor, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{sensor.sensor_type}</span>
                        <span className="text-lg font-bold text-blue-600">
                          {sensor.value} <span className="text-sm text-gray-500">{sensor.unit}</span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(sensor.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No sensor data available. Start robot to see live data.</p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Getting Started with TonyPi Robot
              </h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Connect Your TonyPi Robot</h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  <li className="pl-2">
                    <span className="font-medium">Copy robot_client folder</span> to your Raspberry Pi 5
                  </li>
                  <li className="pl-2">
                    <span className="font-medium">Install dependencies:</span>
                    <code className="ml-2 bg-gray-100 px-3 py-1 rounded text-sm">pip install -r requirements.txt</code>
                  </li>
                  <li className="pl-2">
                    <span className="font-medium">Run the client:</span>
                    <code className="ml-2 bg-gray-100 px-3 py-1 rounded text-sm">python3 tonypi_client.py --broker YOUR_PC_IP</code>
                  </li>
                  <li className="pl-2">
                    <span className="font-medium">Or test with simulator:</span>
                    <code className="ml-2 bg-gray-100 px-3 py-1 rounded text-sm">python3 simulator.py</code>
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> Replace YOUR_PC_IP with the IP address of this computer running the monitoring system.
                </p>
              </div>

                <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Tab Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Overview</h4>
                    <p className="text-sm text-gray-600">System status and robot summary</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Performance</h4>
                    <p className="text-sm text-gray-600">CPU, Memory, Disk metrics</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Sensors</h4>
                    <p className="text-sm text-gray-600">IMU & environmental sensor data</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Robots</h4>
                    <p className="text-sm text-gray-600">Robot management & control</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Servos</h4>
                    <p className="text-sm text-gray-600">Servo motor monitoring</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Jobs</h4>
                    <p className="text-sm text-gray-600">Task tracking & progress</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <h4 className="font-medium text-gray-900">Alerts</h4>
                    <p className="text-sm text-gray-600">Real-time alerts & thresholds</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="font-medium text-gray-900">Logs</h4>
                    <p className="text-sm text-gray-600">System logs & activity history</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Reports</h4>
                    <p className="text-sm text-gray-600">Generate PDF reports with AI</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">Documentation</h4>
                    <p className="text-sm text-gray-600">Check the GETTING_STARTED_WITH_TONYPI_ROBOT.md file for detailed setup instructions.</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-gray-900 mb-2">Simulator</h4>
                    <p className="text-sm text-gray-600">Use the simulator to test the system without a physical robot.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component wrapped with NotificationProvider
const TonyPiApp: React.FC = () => {
  return (
    <NotificationProvider>
      <TonyPiAppContent />
      <ToastContainer />
    </NotificationProvider>
  );
};

export default TonyPiApp;
