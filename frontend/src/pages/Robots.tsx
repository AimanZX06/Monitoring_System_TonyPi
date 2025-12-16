import React, { useState, useEffect } from 'react';
import { Activity, Battery, MapPin, Clock, Power, Settings, Trash2, Plus, Search } from 'lucide-react';
import { apiService } from '../utils/api';
import { RobotData } from '../types';

const Robots: React.FC = () => {
  const [robots, setRobots] = useState<RobotData[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<RobotData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchRobots();
    const interval = setInterval(fetchRobots, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRobots = async () => {
    try {
      const data = await apiService.getRobotStatus();
      setRobots(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching robots:', error);
      setLoading(false);
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
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
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
          <h1 className="text-2xl font-bold text-gray-900">Robot Management</h1>
          <p className="text-gray-600">Manage and monitor all connected robots</p>
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search robots by ID or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Robots</p>
              <p className="text-2xl font-bold">{robots.length}</p>
            </div>
            <Activity className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online</p>
              <p className="text-2xl font-bold text-green-600">
                {robots.filter(r => r.status === 'online').length}
              </p>
            </div>
            <Power className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-red-600">
                {robots.filter(r => r.status === 'offline').length}
              </p>
            </div>
            <Power className="text-red-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Battery</p>
              <p className="text-2xl font-bold">
                {robots.length > 0
                  ? Math.round(robots.reduce((sum, r) => sum + (r.battery_percentage || 0), 0) / robots.length)
                  : 0}%
              </p>
            </div>
            <Battery className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Robot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRobots.map((robot) => (
          <div
            key={robot.robot_id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
            onClick={() => setSelectedRobot(robot)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{robot.name || robot.robot_id}</h3>
                  <p className="text-xs text-gray-500">ID: {robot.robot_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(robot.status)}`}></div>
                <span className="text-xs font-medium text-gray-600 capitalize">{robot.status}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              {/* Battery */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="text-gray-400" size={16} />
                  <span className="text-sm text-gray-600">Battery</span>
                </div>
                <span className={`text-sm font-semibold ${getBatteryColor(robot.battery_percentage || 0)}`}>
                  {robot.battery_percentage?.toFixed(1) || 'N/A'}%
                </span>
              </div>

              {/* Location */}
              {robot.location && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-gray-400" size={16} />
                    <span className="text-sm text-gray-600">Position</span>
                  </div>
                  <span className="text-sm font-mono text-gray-900">
                    ({robot.location.x.toFixed(1)}, {robot.location.y.toFixed(1)})
                  </span>
                </div>
              )}

              {/* Last Seen */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="text-gray-400" size={16} />
                  <span className="text-sm text-gray-600">Last Seen</span>
                </div>
                <span className="text-sm text-gray-900">{formatLastSeen(robot.last_seen)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRobot(robot);
                }}
                className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle settings
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remove robot ${robot.robot_id}?`)) {
                    // Handle delete
                  }
                }}
                className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRobots.length === 0 && (
        <div className="text-center py-12">
          <Activity className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No robots found</h3>
          <p className="text-gray-600">
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
            className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedRobot.name || selectedRobot.robot_id}
                </h2>
                <p className="text-gray-600">Robot ID: {selectedRobot.robot_id}</p>
              </div>
              <button
                onClick={() => setSelectedRobot(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedRobot.status)}`}></div>
                    <p className="font-semibold capitalize">{selectedRobot.status}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Battery Level</p>
                  <p className={`font-semibold ${getBatteryColor(selectedRobot.battery_percentage || 0)}`}>
                    {selectedRobot.battery_percentage?.toFixed(1) || 'N/A'}%
                  </p>
                </div>
              </div>

              {selectedRobot.location && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Location</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">X</p>
                      <p className="font-mono font-semibold">{selectedRobot.location.x.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Y</p>
                      <p className="font-mono font-semibold">{selectedRobot.location.y.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Z</p>
                      <p className="font-mono font-semibold">{selectedRobot.location.z.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRobot.sensors && Object.keys(selectedRobot.sensors).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Sensor Data</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedRobot.sensors).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-mono font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Last Seen</p>
                <p className="font-semibold">{new Date(selectedRobot.last_seen).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Send Command
              </button>
              <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                View History
              </button>
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
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Robot</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Robot ID</label>
                <input
                  type="text"
                  placeholder="e.g., tonypi_001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Robot Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., TonyPi Unit 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle add robot
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
