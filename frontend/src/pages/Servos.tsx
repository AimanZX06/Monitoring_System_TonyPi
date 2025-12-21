import React, { useState, useEffect } from 'react';
import { 
  Thermometer, 
  Zap, 
  Gauge, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RotateCw,
  Activity
} from 'lucide-react';
import { apiService } from '../utils/api';
import { ServoStatusResponse, ServoData } from '../types';

const Servos: React.FC = () => {
  const [robots, setRobots] = useState<string[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<string>('');
  const [servoData, setServoData] = useState<ServoStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<ServoData[]>([]);

  useEffect(() => {
    const fetchRobots = async () => {
      try {
        const robotStatus = await apiService.getRobotStatus();
        const robotIds = robotStatus.map(r => r.robot_id);
        setRobots(robotIds);
        if (robotIds.length > 0 && !selectedRobot) {
          setSelectedRobot(robotIds[0]);
        }
      } catch (error) {
        console.error('Error fetching robots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRobots();
  }, []);

  useEffect(() => {
    if (!selectedRobot) return;

    const fetchServoData = async () => {
      try {
        const data = await apiService.getServoData(selectedRobot);
        console.log('Servo data received:', data); // Debug log
        
        if (data && data.servos && Object.keys(data.servos).length > 0) {
          setServoData(data);
          
          // Extract alerts
          const alertServos = Object.values(data.servos).filter(
            (servo: ServoData) => servo.alert_level === 'warning' || servo.alert_level === 'critical'
          ) as ServoData[];
          setAlerts(alertServos);
        } else {
          // No servo data - could be robot not sending or no data yet
          setServoData(data || null);
          setAlerts([]);
        }
      } catch (error) {
        console.error('Error fetching servo data:', error);
        setServoData(null);
        setAlerts([]);
      }
    };

    fetchServoData();
    const interval = setInterval(fetchServoData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [selectedRobot]);

  const getAlertIcon = (level?: string) => {
    switch (level) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getTemperatureColor = (temp?: number) => {
    if (!temp) return 'bg-gray-300';
    if (temp >= 75) return 'bg-red-500';
    if (temp >= 65) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (robots.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">⚙️ Servo Monitoring</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No robots connected. Connect a robot to see servo data.</p>
        </div>
      </div>
    );
  }

  const servos = servoData ? Object.values(servoData.servos) : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">⚙️ Servo Monitoring</h1>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Robot:</label>
          <select
            value={selectedRobot}
            onChange={(e) => setSelectedRobot(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {robots.map(robotId => (
              <option key={robotId} value={robotId}>{robotId}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Active Servo Alerts ({alerts.length})</h3>
          </div>
          <ul className="list-disc list-inside text-sm text-red-700">
            {alerts.map((alert, idx) => (
              <li key={idx}>
                {alert.name}: {alert.alert_level?.toUpperCase()} - 
                Temperature: {alert.temperature?.toFixed(1)}°C
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Servo Grid */}
      {servos.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No servo data available for {selectedRobot}</p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure the robot is connected and sending servo data via MQTT
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servos.map((servo: ServoData) => (
            <div
              key={servo.name}
              className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
                servo.alert_level === 'critical' ? 'border-red-500' :
                servo.alert_level === 'warning' ? 'border-yellow-500' :
                'border-green-500'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{servo.name}</h3>
                  <p className="text-xs text-gray-500">ID: {servo.id}</p>
                </div>
                {getAlertIcon(servo.alert_level)}
              </div>

              {/* Temperature */}
              {servo.temperature !== undefined && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Temperature: {servo.temperature.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getTemperatureColor(servo.temperature)}`}
                      style={{ width: `${Math.min((servo.temperature / 100) * 100, 100)}%` }}
                    />
                  </div>
                  {servo.temp_warning && (
                    <p className="text-xs text-yellow-600 mt-1">⚠️ Warning threshold</p>
                  )}
                  {servo.temp_critical && (
                    <p className="text-xs text-red-600 mt-1">🚨 Critical threshold</p>
                  )}
                </div>
              )}

              {/* Position */}
              {servo.position !== undefined && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <RotateCw className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Position: {servo.position}°
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.abs((servo.position + 180) / 360) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Voltage */}
              {servo.voltage !== undefined && (
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Voltage: {servo.voltage.toFixed(2)}V
                    </span>
                  </div>
                </div>
              )}

              {/* Torque State */}
              {servo.torque_enabled !== undefined && (
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Torque: {servo.torque_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  {servo.angle_min !== undefined && (
                    <div>Min: {servo.angle_min}°</div>
                  )}
                  {servo.angle_max !== undefined && (
                    <div>Max: {servo.angle_max}°</div>
                  )}
                  {servo.offset !== undefined && (
                    <div>Offset: {servo.offset}</div>
                  )}
                  {servo.simulated && (
                    <div className="col-span-2 text-yellow-600">⚠️ Simulated Data</div>
                  )}
                  {servo.error && (
                    <div className="col-span-2 text-red-600">❌ {servo.error}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {servoData && servos.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Servos</div>
            <div className="text-2xl font-bold text-gray-900">{servoData.servo_count}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Normal</div>
            <div className="text-2xl font-bold text-green-600">
              {servos.filter((s: ServoData) => s.alert_level === 'normal').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Warnings</div>
            <div className="text-2xl font-bold text-yellow-600">
              {servos.filter((s: ServoData) => s.alert_level === 'warning').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Critical</div>
            <div className="text-2xl font-bold text-red-600">
              {servos.filter((s: ServoData) => s.alert_level === 'critical').length}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Info:</span> Servo data updates every 5 seconds automatically.
          {servoData && servoData.timestamp && (
            <span> Last update: {new Date(servoData.timestamp).toLocaleTimeString()}</span>
          )}
        </p>
        {servoData && servoData.message && (
          <p className="text-sm text-yellow-800 mt-2">
            <span className="font-semibold">Note:</span> {servoData.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Servos;


