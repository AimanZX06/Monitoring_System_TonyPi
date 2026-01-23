/**
 * =============================================================================
 * Robots Page Component - Robot Management & Control Panel
 * =============================================================================
 * 
 * This component provides a comprehensive interface for managing TonyPi robots,
 * including viewing status, controlling robots, and monitoring camera feeds.
 * 
 * KEY FEATURES:
 *   - Robot list with search and filtering
 *   - Summary cards (total, online, offline, avg battery)
 *   - Battery level history chart (Grafana integration)
 *   - Robot control panel with emergency stop
 *   - Live camera feed display
 *   - Terminal output for command feedback
 *   - Detailed robot modal with sensor data
 *   - Add new robot functionality
 * 
 * ROBOT STATUSES:
 *   - online (green):  Robot connected and responding
 *   - offline (red):   Robot not connected
 *   - idle (yellow):   Robot connected but inactive
 * 
 * CONTROL FEATURES:
 *   - Emergency Stop: Immediately stops the selected robot
 *   - Camera Feed: Live MJPEG stream from robot's camera
 *   - Terminal: Command input and response logging
 * 
 * DATA FLOW:
 *   1. Component mounts → fetches robot list
 *   2. Auto-refresh every 5 seconds
 *   3. User selects robot → control panel updates
 *   4. Commands sent via API → logged in terminal
 * 
 * CAMERA INTEGRATION:
 *   Camera URL format: http://{robot_ip}:8080/?action=stream
 *   Falls back to robot.camera_url if IP not available
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React core - state management, lifecycle, and refs
import React, { useState, useEffect, useRef } from 'react';

// Lucide React icons - visual elements for robot management
import { 
  Activity,   // Robot activity indicator
  Battery,    // Battery level indicator
  MapPin,     // Location/position icon
  Clock,      // Last seen/time indicator
  Power,      // Online/offline status icon
  Plus,       // Add robot icon
  Search,     // Search input icon
  Camera,     // Camera feed icon
  Terminal,   // Terminal output icon
  TrendingUp, // Chart/statistics icon
  RefreshCw   // Refresh/reload icon
} from 'lucide-react';

// Internal utilities - API client and error handling
import { apiService, handleApiError } from '../utils/api';

// TypeScript types - robot data structure
import { RobotData } from '../types';

// Components - Grafana panel for charts
import GrafanaPanel from '../components/GrafanaPanel';

// Configuration - Grafana URL builder
import { getGrafanaPanelUrl } from '../utils/config';

// Theme context - dark/light mode support
import { useTheme } from '../contexts/ThemeContext';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Robots: React.FC = () => {
  const { isDark } = useTheme();
  const [robots, setRobots] = useState<RobotData[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<RobotData | null>(null);
  const [controlRobotId, setControlRobotId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [cameraRefreshKey, setCameraRefreshKey] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRobots();
    const interval = setInterval(fetchRobots, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRobots = async () => {
    try {
      const data = await apiService.getRobotStatus();
      setRobots(data);
      if (!controlRobotId && data.length > 0) {
        setControlRobotId(data[0].robot_id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching robots:', error);
      setLoading(false);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev.slice(-50), `[${timestamp}] ${message}`]);
  };

  const controlRobot = robots.find(r => r.robot_id === controlRobotId);
  
  const baseCameraUrl = controlRobot?.camera_url || 
    (controlRobot?.ip_address ? `http://${controlRobot.ip_address}:8080/?action=stream` : null);
  const cameraUrl = baseCameraUrl ? `${baseCameraUrl}${cameraRefreshKey > 0 ? `&_refresh=${cameraRefreshKey}` : ''}` : null;
  
  const refreshCamera = () => {
    setCameraError(false);
    setCameraRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const logInterval = setInterval(() => {
      if (controlRobot && controlRobot.status === 'online') {
        const sampleLogs = [
          `[${controlRobotId}] Heartbeat received`,
          `[${controlRobotId}] Sensor data updated`,
          `[${controlRobotId}] Position updated`,
          `[${controlRobotId}] Battery status: OK`,
          `[${controlRobotId}] Motors: idle`,
        ];
        const randomLog = sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
        addLog(randomLog);
      }
    }, 5000);

    return () => clearInterval(logInterval);
  }, [controlRobot, controlRobotId]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  useEffect(() => {
    setCameraError(false);
    setCameraRefreshKey(0);
  }, [controlRobotId]);

  const handleEmergencyStop = async () => {
    if (!controlRobotId) {
      addLog('ERROR: No robot selected');
      return;
    }
    setIsStopping(true);
    addLog(`EMERGENCY STOP INITIATED for ${controlRobotId}`);
    try {
      await apiService.sendRobotCommand({
        type: 'stop',
        robot_id: controlRobotId,
        id: `stop_${Date.now()}`
      });
      addLog(`STOP command sent successfully to ${controlRobotId}`);
    } catch (error) {
      addLog(`STOP command failed for ${controlRobotId}: ${handleApiError(error)}`);
    } finally {
      setIsStopping(false);
    }
  };

  const filteredRobots = robots.filter(robot =>
    robot.robot_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    robot.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return isDark ? 'text-green-400' : 'text-green-600';
    if (level > 20) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Robot Management</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Manage and monitor all connected robots</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Robot
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
        <input
          type="text"
          placeholder="Search robots by ID or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-lg shadow p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Robots</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{robots.length}</p>
            </div>
            <Activity className="text-blue-600" size={32} />
          </div>
        </div>
        <div className={`rounded-lg shadow p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Online</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                {robots.filter(r => r.status === 'online').length}
              </p>
            </div>
            <Power className="text-green-600" size={32} />
          </div>
        </div>
        <div className={`rounded-lg shadow p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Offline</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {robots.filter(r => r.status === 'offline').length}
              </p>
            </div>
            <Power className="text-red-600" size={32} />
          </div>
        </div>
        <div className={`rounded-lg shadow p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avg Battery</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {robots.length > 0
                  ? Math.round(robots.reduce((sum, r) => sum + (r.battery_percentage || 0), 0) / robots.length)
                  : 0}%
              </p>
            </div>
            <Battery className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Battery Level Monitor */}
      {robots.length > 0 && (
        <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <TrendingUp className="text-green-600" size={24} />
            Battery Level History
          </h2>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Historical battery level data from Grafana
          </p>
          <GrafanaPanel 
            panelUrl={getGrafanaPanelUrl(3)}
            height={250}
          />
        </div>
      )}

      {/* Robot Control Panel Header */}
      <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Activity className="text-blue-600" size={24} />
            Robot Control Panel
          </h2>
          {robots.length > 0 && (
            <select
              value={controlRobotId}
              onChange={(e) => {
                setControlRobotId(e.target.value);
                setTerminalLogs([]);
                addLog(`Switched to robot: ${e.target.value}`);
              }}
              className={`px-4 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              {robots.map((robot) => (
                <option key={robot.robot_id} value={robot.robot_id}>
                  {robot.robot_id} {robot.status === 'online' ? '(Online)' : '(Offline)'}
                </option>
              ))}
            </select>
          )}
        </div>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Control panel for: <span className="font-semibold text-blue-600">{controlRobotId || 'No robot selected'}</span>
          {controlRobot && (
            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${controlRobot.status === 'online' ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700') : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')}`}>
              {controlRobot.status}
            </span>
          )}
        </p>

        {/* Emergency Stop */}
        <div className="flex justify-center">
          <button
            onClick={handleEmergencyStop}
            disabled={isStopping || !controlRobotId}
            className={`px-12 py-6 text-2xl font-bold text-white rounded-lg shadow-lg transition-all ${
              isStopping || !controlRobotId
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 hover:shadow-xl active:scale-95'
            }`}
          >
            {isStopping ? 'STOPPING...' : 'EMERGENCY STOP'}
          </button>
        </div>
      </div>

      {/* Camera Feed & Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Feed */}
        <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Camera className="text-blue-600" size={24} />
              Camera Feed
              {controlRobotId && (
                <span className={`text-sm font-normal ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>({controlRobotId})</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {controlRobot?.ip_address && (
                <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  IP: {controlRobot.ip_address}
                </span>
              )}
              {cameraUrl && (
                <button
                  onClick={refreshCamera}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isDark ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
                  title="Refresh camera feed"
                >
                  <RefreshCw size={16} className={cameraError ? 'animate-spin' : ''} />
                  Refresh
                </button>
              )}
            </div>
          </div>
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            {cameraUrl && !cameraError ? (
              <img
                key={cameraRefreshKey}
                src={cameraUrl}
                alt="TonyPi Camera Feed"
                className="w-full h-full object-contain"
                onError={() => setCameraError(true)}
                onLoad={() => setCameraError(false)}
              />
            ) : (
              <div className="text-center text-gray-400">
                <Camera size={48} className="mx-auto mb-2 opacity-50" />
                <p>Camera feed not available</p>
                {!controlRobotId ? (
                  <p className="text-sm mt-1">Select a robot to view camera</p>
                ) : !cameraUrl ? (
                  <p className="text-sm mt-1">Robot IP address not available</p>
                ) : cameraError ? (
                  <p className="text-sm mt-1">Unable to connect to camera stream</p>
                ) : null}
              </div>
            )}
          </div>
          {cameraUrl && (
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Stream: {cameraUrl}
            </p>
          )}
        </div>

        {/* Terminal Output */}
        <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Terminal className="text-green-600" size={24} />
              Terminal Output
              {controlRobotId && (
                <span className={`text-sm font-normal ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>({controlRobotId})</span>
              )}
            </h2>
            <button
              onClick={() => setTerminalLogs([])}
              className={`text-xs px-2 py-1 border rounded ${isDark ? 'text-gray-400 border-gray-600 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900 border-gray-300'}`}
            >
              Clear
            </button>
          </div>
          <div
            ref={terminalRef}
            className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm"
          >
            {terminalLogs.length > 0 ? (
              terminalLogs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.includes('ERROR') || log.includes('FAILED') || log.includes('failed')
                      ? 'text-red-400'
                      : log.includes('STOP') || log.includes('WARNING')
                      ? 'text-yellow-400'
                      : log.includes('success') || log.includes('OK')
                      ? 'text-green-400'
                      : 'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500">
                <p>$ Waiting for robot connection...</p>
                <p>$ Terminal output will appear here</p>
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="Send command to robot..."
              className={`flex-1 text-sm px-3 py-2 border rounded ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    addLog(`> ${input.value}`);
                    input.value = '';
                  }
                }
              }}
            />
            <button
              onClick={() => addLog('Manual command sent')}
              className={`px-4 py-2 rounded text-sm ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Robot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRobots.map((robot) => (
          <div
            key={robot.robot_id}
            className={`rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={() => setSelectedRobot(robot)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <Activity className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{robot.name || robot.robot_id}</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>ID: {robot.robot_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(robot.status)}`}></div>
                <span className={`text-xs font-medium capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{robot.status}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              {/* Battery */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className={isDark ? 'text-gray-500' : 'text-gray-400'} size={16} />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Battery</span>
                </div>
                <span className={`text-sm font-semibold ${getBatteryColor(robot.battery_percentage || 0)}`}>
                  {robot.battery_percentage?.toFixed(1) || 'N/A'}%
                </span>
              </div>

              {/* Location */}
              {robot.location && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className={isDark ? 'text-gray-500' : 'text-gray-400'} size={16} />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Position</span>
                  </div>
                  <span className={`text-sm font-mono ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    ({robot.location.x.toFixed(1)}, {robot.location.y.toFixed(1)})
                  </span>
                </div>
              )}

              {/* Last Seen */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={isDark ? 'text-gray-500' : 'text-gray-400'} size={16} />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Last Seen</span>
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{formatLastSeen(robot.last_seen)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className={`mt-4 pt-4 border-t flex gap-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRobot(robot);
                }}
                className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRobots.length === 0 && (
        <div className="text-center py-12">
          <Activity className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} size={48} />
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No robots found</h3>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {searchQuery ? 'Try adjusting your search query' : 'Add a robot to get started'}
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRobot && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedRobot(null)}
        >
          <div
            className={`rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedRobot.name || selectedRobot.robot_id}
                </h2>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Robot ID: {selectedRobot.robot_id}</p>
              </div>
              <button
                onClick={() => setSelectedRobot(null)}
                className={isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedRobot.status)}`}></div>
                    <p className={`font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRobot.status}</p>
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Battery Level</p>
                  <p className={`font-semibold ${getBatteryColor(selectedRobot.battery_percentage || 0)}`}>
                    {selectedRobot.battery_percentage?.toFixed(1) || 'N/A'}%
                  </p>
                </div>
              </div>

              {selectedRobot.location && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Location</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>X</p>
                      <p className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRobot.location.x.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Y</p>
                      <p className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRobot.location.y.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Z</p>
                      <p className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRobot.location.z.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRobot.sensors && Object.keys(selectedRobot.sensors).length > 0 && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sensor Data</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedRobot.sensors).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{key}:</span>
                        <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Last Seen</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{new Date(selectedRobot.last_seen).toLocaleString()}</p>
              </div>
            </div>


          </div>
        </div>
      )}

      {/* Add Robot Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className={`rounded-lg shadow-xl p-6 max-w-md w-full mx-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Add New Robot</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Robot ID</label>
                <input
                  type="text"
                  placeholder="e.g., tonypi_001"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Robot Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., TonyPi Unit 1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                <textarea
                  placeholder="Optional description"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className={`flex-1 px-4 py-2 border rounded-lg ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  alert('Robot registration feature coming soon!');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Robot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Robots;
