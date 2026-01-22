/**
 * =============================================================================
 * Sensors Page Component - IMU and Environmental Sensor Dashboard
 * =============================================================================
 * 
 * This component displays real-time sensor data from TonyPi robots, including
 * IMU readings (accelerometer, gyroscope) and environmental sensors.
 * 
 * KEY FEATURES:
 *   - Real-time sensor data with auto-refresh (5 seconds)
 *   - Embedded Grafana panels for historical visualization
 *   - Grouped sensor readings by type
 *   - Robot selection dropdown
 *   - Responsive card grid layout
 * 
 * SENSOR TYPES DISPLAYED:
 *   IMU Sensors:
 *     - Accelerometer (X, Y, Z) - Motion/tilt detection
 *     - Gyroscope (X, Y, Z) - Angular velocity
 *   
 *   Environmental Sensors:
 *     - Distance (Ultrasonic) - Obstacle detection
 *     - Light Level - Ambient light detection
 * 
 * DATA FLOW:
 *   1. Fetch robot list from /api/v1/robot-data/status
 *   2. Fetch sensor data from /api/v1/robot-data/sensors
 *   3. Group readings by sensor_type
 *   4. Display latest values in cards
 *   5. Auto-refresh every 5 seconds
 * 
 * GRAFANA PANELS:
 *   - Panel 4: Accelerometer X, Y, Z
 *   - Panel 5: Gyroscope X, Y, Z
 *   - Panel 6: Distance sensor
 *   - Panel 7: Light level
 */

// =============================================================================
// IMPORTS
// =============================================================================

import React, { useState, useEffect } from 'react';

// Lucide React icons for sensor types
import { Activity, Compass, Gauge, Sun, Ruler, RefreshCw } from 'lucide-react';

// Internal utilities and components
import { apiService } from '../utils/api';
import GrafanaPanel from '../components/GrafanaPanel';
import { getGrafanaPanelUrl } from '../utils/config';
import { useTheme } from '../contexts/ThemeContext';

interface SensorReading {
  timestamp: string;
  sensor_type: string;
  value: number;
  unit: string;
}

const Sensors: React.FC = () => {
  const { isDark } = useTheme();
  const [robotId, setRobotId] = useState('');
  const [allRobots, setAllRobots] = useState<{robot_id: string, status: string}[]>([]);
  const [recentSensors, setRecentSensors] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const robots = await apiService.getRobotStatus();
        setAllRobots(robots.map(r => ({ robot_id: r.robot_id, status: r.status })));
        
        if (robots.length > 0 && !robotId) {
          setRobotId(robots[0].robot_id);
        }

        const sensors = await apiService.getSensorData('sensors', '5m');
        setRecentSensors(sensors.slice(-20) as SensorReading[]);
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [robotId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const groupedSensors = recentSensors.reduce((acc, sensor) => {
    if (!acc[sensor.sensor_type]) {
      acc[sensor.sensor_type] = [];
    }
    acc[sensor.sensor_type].push(sensor);
    return acc;
  }, {} as Record<string, SensorReading[]>);

  const getSensorIcon = (type: string) => {
    if (type.includes('accel')) return <Activity className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />;
    if (type.includes('gyro')) return <Compass className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />;
    if (type.includes('distance')) return <Ruler className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />;
    if (type.includes('light')) return <Sun className={`h-5 w-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />;
    return <Gauge className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Compass className={`h-6 w-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              Sensor Data
            </h2>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Real-time IMU and environmental sensor readings
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {allRobots.length > 0 && (
              <select
                value={robotId}
                onChange={(e) => setRobotId(e.target.value)}
                className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                {allRobots.map((robot) => (
                  <option key={robot.robot_id} value={robot.robot_id}>
                    {robot.robot_id} {robot.status === 'online' ? '(Online)' : '(Offline)'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Grafana Sensor Panels */}
      <div className="space-y-6">
        {/* IMU Data */}
        <div className="card">
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Activity className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            IMU Sensor Data
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Accelerometer (X, Y, Z)</h4>
              <GrafanaPanel 
                panelUrl={getGrafanaPanelUrl(4)}
                height={300}
              />
            </div>
            <div>
              <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Gyroscope (X, Y, Z)</h4>
              <GrafanaPanel 
                panelUrl={getGrafanaPanelUrl(5)}
                height={300}
              />
            </div>
          </div>
        </div>

        {/* Environmental Sensors */}
        <div className="card">
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Sun className={`h-5 w-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
            Environmental Sensors
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Distance Sensor</h4>
              <GrafanaPanel 
                panelUrl={getGrafanaPanelUrl(6)}
                height={250}
              />
            </div>
            <div>
              <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Light Level</h4>
              <GrafanaPanel 
                panelUrl={getGrafanaPanelUrl(7)}
                height={250}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sensor Readings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <RefreshCw className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            Recent Sensor Readings
          </h3>
          <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Last {recentSensors.length} readings
          </span>
        </div>

        {Object.keys(groupedSensors).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedSensors).map(([type, readings]) => {
              const latestReading = readings[readings.length - 1];
              return (
                <div
                  key={type}
                  className={`p-4 rounded-lg border hover:shadow-md transition-shadow ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSensorIcon(type)}
                      <span className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {latestReading.value.toFixed(2)}
                    <span className={`text-sm font-normal ml-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {latestReading.unit}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {new Date(latestReading.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Compass className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No sensor data available yet.</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Start the robot or simulator to see sensor readings.
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <span className="font-semibold">Sensor Types:</span> This page displays data from the robot's IMU 
          (Inertial Measurement Unit) including accelerometer and gyroscope readings, as well as environmental 
          sensors like distance (ultrasonic) and ambient light sensors.
        </p>
      </div>
    </div>
  );
};

export default Sensors;
