import React, { useState, useEffect } from 'react';
import GrafanaPanel from './components/GrafanaPanel';
import Monitoring from './pages/Monitoring';
import Jobs from './pages/Jobs';
import Robots from './pages/Robots';
import Servos from './pages/Servos';
import { Activity, Wifi, WifiOff, Clock, Zap, AlertCircle } from 'lucide-react';

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

const TonyPiApp: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [systemStatus, setSystemStatus] = useState<string>('Online');
  const [robotData, setRobotData] = useState<RobotData | null>(null);
  const [recentSensors, setRecentSensors] = useState<SensorReading[]>([]);
  const [jobSummary, setJobSummary] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [selectedQR, setSelectedQR] = useState<string>('QR12345');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [commandResponse, setCommandResponse] = useState<string>('');

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
        const statusResponse = await fetch('http://localhost:8000/api/robot-data/status');
        if (statusResponse.ok) {
          const robots = await statusResponse.json();
          if (robots.length > 0) {
            setRobotData(robots[0]);
            setIsConnected(true);
            try {
              const js = await fetch(`http://localhost:8000/api/robot-data/job-summary/${robots[0].robot_id}`);
              if (js.ok) {
                const jdata = await js.json();
                setJobSummary(jdata);
              }
            } catch (e) {
              // ignore
            }
          } else {
            setIsConnected(false);
          }
        }

        const sensorsResponse = await fetch('http://localhost:8000/api/robot-data/sensors?measurement=sensors&time_range=1m');
        if (sensorsResponse.ok) {
          const sensors = await sensorsResponse.json();
          setRecentSensors(sensors.slice(-10));
        }
      } catch (error) {
        console.error('Error fetching robot data:', error);
        setIsConnected(false);
      }
    };

    fetchRobotData();
    const interval = setInterval(fetchRobotData, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendRobotCommand = async (command: any) => {
    try {
      const response = await fetch('http://localhost:8000/api/robot-data/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      });
      
      if (response.ok) {
        setCommandResponse(`Command sent: ${command.type}`);
        setTimeout(() => setCommandResponse(''), 3000);
      } else {
        setCommandResponse(`Command failed: ${response.statusText}`);
      }
    } catch (error) {
      setCommandResponse(`Command error: ${error}`);
    }
  };

  const moveRobot = (direction: string, distance: number = 1.0) => {
    sendRobotCommand({
      type: 'move',
      direction: direction,
      distance: distance,
      speed: 0.5,
      id: `cmd_${Date.now()}`
    });
  };

  const requestRobotStatus = () => {
    sendRobotCommand({
      type: 'status_request',
      id: `status_${Date.now()}`
    });
  };

  const stopRobot = () => {
    sendRobotCommand({
      type: 'stop',
      id: `stop_${Date.now()}`
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'robots', label: 'Robots' },
    { id: 'servos', label: 'Servos' }
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

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6 fade-in">
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
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Robot Status
              </h2>
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

            {/* Sensor Data Card */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Recent Sensor Data
              </h2>
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

            {/* Robot Controls Card */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Robot Controls
              </h2>

              {/* Job Summary */}
              <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Summary</h3>
                {jobSummary ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Start Time</p>
                      <p className="text-sm font-medium text-gray-900">{jobSummary.start_time || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">End Time</p>
                      <p className="text-sm font-medium text-gray-900">{jobSummary.end_time || 'In Progress'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Progress</p>
                      <p className="text-sm font-medium text-gray-900">
                        {jobSummary.percent_complete !== null ? `${jobSummary.percent_complete}%` : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Items</p>
                      <p className="text-sm font-medium text-gray-900">
                        {jobSummary.items_done}/{jobSummary.items_total || 'unknown'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No job data yet.</p>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <select
                    value={selectedQR}
                    onChange={(e) => setSelectedQR(e.target.value)}
                    className="input-field flex-1"
                  >
                    <option value="QR12345">QR12345 - Widget A</option>
                    <option value="QR67890">QR67890 - Gadget B</option>
                    <option value="QR00001">QR00001 - Box C</option>
                    <option value="QR_UNKNOWN">QR_UNKNOWN - Not found</option>
                  </select>
                  <button
                    onClick={async () => {
                      if (!robotData) {
                        alert('No robot connected');
                        return;
                      }
            try {
              const res = await fetch('http://localhost:8000/api/robot-data/trigger-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ robot_id: robotData.robot_id, qr: selectedQR })
              });
              if (res.ok) {
                alert('Scan triggered');
                const js = await fetch(`http://localhost:8000/api/robot-data/job-summary/${robotData.robot_id}`);
                if (js.ok) setJobSummary(await js.json());
              } else {
                alert('Failed to trigger scan');
              }
                      } catch (e: any) {
                        alert('Error: ' + String(e));
                      }
                    }}
                    className="btn-primary"
                  >
                    Trigger Scan
                  </button>
                </div>
              </div>

              {/* Movement Controls */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Movement Controls</h3>
                <div className="flex justify-center">
                  <div className="grid grid-cols-3 gap-2 max-w-[200px]">
                    <div></div>
                    <button
                      onClick={() => moveRobot('forward')}
                      className="btn-primary py-3"
                    >
                      ↑
                    </button>
                    <div></div>
                    <button
                      onClick={() => moveRobot('left')}
                      className="btn-primary py-3"
                    >
                      ←
                    </button>
                    <button
                      onClick={stopRobot}
                      className="btn-danger py-3 font-bold"
                    >
                      STOP
                    </button>
                    <button
                      onClick={() => moveRobot('right')}
                      className="btn-primary py-3"
                    >
                      →
                    </button>
                    <div></div>
                    <button
                      onClick={() => moveRobot('backward')}
                      className="btn-primary py-3"
                    >
                      ↓
                    </button>
                    <div></div>
                  </div>
                </div>
              </div>

              {/* System Controls */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">System Controls</h3>
                <div className="flex gap-3">
                  <button onClick={requestRobotStatus} className="btn-success flex-1">
                    Refresh Status
                  </button>
                  <button
                    onClick={() => {
          fetch('http://localhost:8000/api/health')
            .then(res => res.json())
            .then(data => alert('Backend Status: ' + JSON.stringify(data)))
            .catch(err => alert('Backend connection failed: ' + err.message));
                    }}
                    className="btn-secondary flex-1"
                  >
                    Test Backend
                  </button>
                </div>
              </div>

              {commandResponse && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Last Command:</strong> {commandResponse}
                  </p>
                </div>
              )}
            </div>

            {/* Getting Started Card */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                Getting Started
              </h2>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">To connect your TonyPi robot:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Copy robot_client folder to your Raspberry Pi 5</li>
                  <li>Install dependencies: <code className="bg-gray-100 px-2 py-1 rounded">pip install -r requirements.txt</code></li>
                  <li>Run: <code className="bg-gray-100 px-2 py-1 rounded">python3 tonypi_client.py --broker YOUR_PC_IP</code></li>
                  <li>Or test with simulator: <code className="bg-gray-100 px-2 py-1 rounded">python3 simulator.py</code></li>
                </ol>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Replace YOUR_PC_IP with the IP address of this computer running the monitoring system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TonyPiApp;
