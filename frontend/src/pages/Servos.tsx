import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Zap, Settings, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService, handleApiError } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';

interface ServoData {
  id: number;
  name: string;
  position: number;
  temperature: number;
  voltage: number;
  torque_enabled: boolean;
  alert_level: 'normal' | 'warning' | 'critical';
}

interface ServoStatusResponse {
  robot_id: string;
  servos: { [key: string]: ServoData };
  servo_count: number;
  timestamp: string;
}

const Servos: React.FC = () => {
  const [robots, setRobots] = useState<string[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<string>('');
  const [servoData, setServoData] = useState<ServoStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { warning } = useNotification();

  useEffect(() => {
    fetchRobots();
  }, []);

  useEffect(() => {
    if (selectedRobot) {
      fetchServoData();
      const interval = setInterval(fetchServoData, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedRobot]);

  const fetchRobots = async () => {
    try {
      const robotStatus = await apiService.getRobotStatus();
      const robotIds = robotStatus.map(r => r.robot_id);
      setRobots(robotIds);
      if (robotIds.length > 0 && !selectedRobot) {
        setSelectedRobot(robotIds[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching robots:', err);
      setError(handleApiError(err));
      setLoading(false);
    }
  };

  const fetchServoData = async () => {
    if (!selectedRobot) return;
    
    try {
      const data = await apiService.getServoData(selectedRobot);
      // Check if we actually have servo data
      if (data && data.servos && Object.keys(data.servos).length > 0) {
        setServoData(data);
        setError(null);
      } else {
        setError('No servo data available yet. Make sure the robot is sending servo data.');
        setServoData(null);
      }
    } catch (err: any) {
      const errorMsg = handleApiError(err);
      console.error('Error fetching servo data:', err);
      if (err?.response?.status === 404) {
        setError('No servo data found. The robot may not be sending servo data yet.');
      } else {
        setError(errorMsg);
      }
      setServoData(null);
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-green-500 bg-green-50';
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default: return null;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 70) return 'text-red-600';
    if (temp > 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading servos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            Servo Motor Monitoring
          </h2>
          <button
            onClick={fetchServoData}
            className="btn-secondary flex items-center gap-2"
            disabled={!selectedRobot}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Robot Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Robot
          </label>
          <select
            value={selectedRobot}
            onChange={(e) => setSelectedRobot(e.target.value)}
            className="input-field"
          >
            <option value="">-- Select Robot --</option>
            {robots.map((robotId) => (
              <option key={robotId} value={robotId}>
                {robotId}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Servo Data */}
      {servoData && servoData.servos && Object.keys(servoData.servos).length > 0 ? (
        <>
          {/* Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Total Servos</p>
                <p className="text-2xl font-bold text-blue-600">{servoData.servo_count}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Normal</p>
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(servoData.servos).filter(s => s.alert_level === 'normal').length}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-600 mb-1">Warning</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {Object.values(servoData.servos).filter(s => s.alert_level === 'warning').length}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600 mb-1">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {Object.values(servoData.servos).filter(s => s.alert_level === 'critical').length}
                </p>
              </div>
            </div>
          </div>

          {/* Servo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(servoData.servos).map(([servoName, servo]) => (
              <div
                key={servoName}
                className={`card border-2 ${getAlertColor(servo.alert_level)}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{servo.name}</h4>
                  {getAlertIcon(servo.alert_level)}
                </div>

                <div className="space-y-3">
                  {/* Position */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        Position
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {servo.position.toFixed(1)}°
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.abs(servo.position / 180) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Thermometer className="h-4 w-4" />
                        Temperature
                      </span>
                      <span className={`text-lg font-bold ${getTemperatureColor(servo.temperature)}`}>
                        {servo.temperature.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          servo.temperature > 70 ? 'bg-red-600' :
                          servo.temperature > 50 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min((servo.temperature / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Voltage */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        Voltage
                      </span>
                      <span className="text-lg font-bold text-purple-600">
                        {servo.voltage.toFixed(2)}V
                      </span>
                    </div>
                  </div>

                  {/* Torque Status */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Torque</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        servo.torque_enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {servo.torque_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Servo ID */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Servo ID</span>
                      <span className="text-sm font-medium text-gray-900">#{servo.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Last Update */}
          <div className="text-center text-sm text-gray-500">
            Last updated: {new Date(servoData.timestamp).toLocaleString()}
          </div>
        </>
      ) : selectedRobot && !error ? (
        <div className="card text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No servo data available for {selectedRobot}</p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure the robot is sending servo data via MQTT
          </p>
        </div>
      ) : !selectedRobot ? (
        <div className="card text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please select a robot to view servo data</p>
        </div>
      ) : null}
    </div>
  );
};

export default Servos;
