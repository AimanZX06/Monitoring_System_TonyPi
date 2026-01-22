/**
 * =============================================================================
 * Servos Page Component - Servo Motor Health Monitoring Dashboard
 * =============================================================================
 * 
 * This component provides detailed monitoring of TonyPi robot servo motors,
 * displaying real-time position, temperature, voltage, and health status.
 * 
 * KEY FEATURES:
 *   - Real-time servo data with auto-refresh (5 seconds)
 *   - Color-coded alert levels (normal/warning/critical)
 *   - Individual servo cards with all metrics
 *   - Summary statistics (total, normal, warning, critical)
 *   - Embedded Grafana panel for angle history
 *   - Robot selection dropdown
 * 
 * SERVO METRICS:
 *   - Position:     Current angle in degrees (0-180)
 *   - Temperature:  Motor temperature in Celsius
 *   - Voltage:      Input voltage in Volts
 *   - Torque:       Enabled/Disabled status
 *   - Alert Level:  Health status (normal/warning/critical)
 * 
 * ALERT THRESHOLDS:
 *   Temperature:
 *     - Normal:   < 50°C (green)
 *     - Warning:  50-70°C (yellow)
 *     - Critical: > 70°C (red)
 * 
 * TONYPI SERVO IDS:
 *   Bus Servos (ID 1-6):
 *     - 1: Right hip
 *     - 2: Right knee
 *     - 3: Right ankle
 *     - 4: Left hip
 *     - 5: Left knee
 *     - 6: Left ankle
 * 
 * DATA FLOW:
 *   1. Fetch robot list from /api/v1/robot-data/status
 *   2. Select robot → fetch servo data from /api/v1/robot-data/servos/{id}
 *   3. Display individual servo cards with metrics
 *   4. Auto-refresh every 5 seconds
 */

// =============================================================================
// IMPORTS
// =============================================================================

import React, { useState, useEffect } from 'react';

// Lucide React icons for servo metrics
import { Activity, Thermometer, Zap, Settings, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';

// Internal utilities and components
import { apiService, handleApiError } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';
import GrafanaPanel from '../components/GrafanaPanel';
import { getGrafanaPanelUrl } from '../utils/config';
import { useTheme } from '../contexts/ThemeContext';

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
  const { isDark } = useTheme();
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
      case 'critical': return isDark ? 'border-red-600 bg-red-900/20' : 'border-red-500 bg-red-50';
      case 'warning': return isDark ? 'border-yellow-600 bg-yellow-900/20' : 'border-yellow-500 bg-yellow-50';
      default: return isDark ? 'border-green-600 bg-green-900/20' : 'border-green-500 bg-green-50';
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertCircle className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />;
      case 'warning': return <AlertCircle className={`h-5 w-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />;
      default: return null;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 70) return isDark ? 'text-red-400' : 'text-red-600';
    if (temp > 50) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-green-400' : 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <span className={`ml-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading servos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Settings className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
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
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
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
          <div className={`p-4 rounded-lg mb-4 border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
            <p className={`flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-800'}`}>
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
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Servos</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{servoData.servo_count}</p>
              </div>
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Normal</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  {Object.values(servoData.servos).filter(s => s.alert_level === 'normal').length}
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Warning</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {Object.values(servoData.servos).filter(s => s.alert_level === 'warning').length}
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Critical</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
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
                  <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{servo.name}</h4>
                  {getAlertIcon(servo.alert_level)}
                </div>

                <div className="space-y-3">
                  {/* Position */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Activity className="h-4 w-4" />
                        Position
                      </span>
                      <span className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {servo.position.toFixed(1)}°
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.abs(servo.position / 180) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Thermometer className="h-4 w-4" />
                        Temperature
                      </span>
                      <span className={`text-lg font-bold ${getTemperatureColor(servo.temperature)}`}>
                        {servo.temperature.toFixed(1)}°C
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 mt-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
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
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Zap className="h-4 w-4" />
                        Voltage
                      </span>
                      <span className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                        {servo.voltage.toFixed(2)}V
                      </span>
                    </div>
                  </div>

                  {/* Torque Status */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Torque</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        servo.torque_enabled
                          ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                          : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {servo.torque_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Servo ID */}
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Servo ID</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>#{servo.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Servo Angle Grafana Panel */}
          <div className="card">
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <TrendingUp className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              Servo Angle History
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Historical servo position data from Grafana
            </p>
            <GrafanaPanel 
              panelUrl={getGrafanaPanelUrl(8)}
              height={300}
            />
          </div>

          {/* Last Update */}
          <div className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Last updated: {new Date(servoData.timestamp).toLocaleString()}
          </div>
        </>
      ) : selectedRobot && !error ? (
        <div className="card text-center py-12">
          <AlertCircle className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No servo data available for {selectedRobot}</p>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Make sure the robot is sending servo data via MQTT
          </p>
        </div>
      ) : !selectedRobot ? (
        <div className="card text-center py-12">
          <Settings className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Please select a robot to view servo data</p>
        </div>
      ) : null}
    </div>
  );
};

export default Servos;
