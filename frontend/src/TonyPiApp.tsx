import React, { useState, useEffect } from 'react';
import GrafanaPanel from './components/GrafanaPanel';
import Monitoring from './pages/Monitoring';
import Jobs from './pages/Jobs';
import Robots from './pages/Robots';

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
  const [performanceData, setPerformanceData] = useState<any[]>([]);
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
        // Get robot status
        const statusResponse = await fetch('http://localhost:8000/api/robot-data/status');
        if (statusResponse.ok) {
          const robots = await statusResponse.json();
          if (robots.length > 0) {
            setRobotData(robots[0]);
            setIsConnected(true);
            // fetch job summary for first robot
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

        // Get recent sensor data
        const sensorsResponse = await fetch('http://localhost:8000/api/robot-data/sensors?measurement=sensors&time_range=1m');
        if (sensorsResponse.ok) {
          const sensors = await sensorsResponse.json();
          setRecentSensors(sensors.slice(-10)); // Keep last 10 readings
        }
      } catch (error) {
        console.error('Error fetching robot data:', error);
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchRobotData();
    
    // Set up polling every 5 seconds
    const interval = setInterval(fetchRobotData, 5000);
    return () => clearInterval(interval);
  }, []);

  const containerStyle: React.CSSProperties = {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#f8f9fa'
  };

  const headerStyle: React.CSSProperties = {
    color: '#2c3e50',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px',
    marginBottom: '20px'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '15px',
    margin: '10px 0',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  // Robot command functions
  const sendRobotCommand = async (command: any) => {
    try {
      const response = await fetch('http://localhost:8000/api/robot-data/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      });
      
      if (response.ok) {
        const result = await response.text();
        setCommandResponse(`Command sent: ${command.type}`);
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

  const statusStyle: React.CSSProperties = {
    color: systemStatus === 'Online' ? '#27ae60' : '#e74c3c',
    fontWeight: 'bold'
  };

  const robotStatusStyle: React.CSSProperties = {
    color: isConnected ? '#27ae60' : '#e74c3c',
    fontWeight: 'bold'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    margin: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  };

  const dangerButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#e74c3c'
  };

  const successButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#27ae60'
  };

  return React.createElement('div', { style: containerStyle },
    React.createElement('h1', { style: headerStyle }, '🤖 TonyPi Robot Monitoring System'),
    // Tabs
    React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 12 } },
      React.createElement('button', { style: { ...buttonStyle, backgroundColor: selectedTab === 'overview' ? '#2d6cdf' : '#3498db' }, onClick: () => setSelectedTab('overview') }, 'Overview'),
      React.createElement('button', { style: { ...buttonStyle, backgroundColor: selectedTab === 'performance' ? '#2d6cdf' : '#3498db' }, onClick: () => setSelectedTab('performance') }, 'Performance'),
      React.createElement('button', { style: { ...buttonStyle, backgroundColor: selectedTab === 'jobs' ? '#2d6cdf' : '#3498db' }, onClick: () => setSelectedTab('jobs') }, 'Jobs'),
      React.createElement('button', { style: { ...buttonStyle, backgroundColor: selectedTab === 'robots' ? '#2d6cdf' : '#3498db' }, onClick: () => setSelectedTab('robots') }, 'Robots')
    ),

    // Performance Tab - Task Manager
    selectedTab === 'performance' ? React.createElement(Monitoring) : null,

    // Jobs Tab - Job Tracking Dashboard
    selectedTab === 'jobs' ? React.createElement(Jobs) : null,

    // Robots Tab - Robot Management
    selectedTab === 'robots' ? React.createElement(Robots) : null,
    
    // Overview Tab Content - Only show when overview is selected
    selectedTab === 'overview' ? React.createElement('div', null,
      // System Status Card
      React.createElement('div', { style: cardStyle },
      React.createElement('h2', null, 'System Status'),
      React.createElement('p', null, 'Backend: ', React.createElement('span', { style: statusStyle }, systemStatus)),
      React.createElement('p', null, 'Robot: ', React.createElement('span', { style: robotStatusStyle }, isConnected ? 'Connected' : 'Disconnected')),
      React.createElement('p', null, 'Current Time: ', currentTime || 'Loading...')
    ),

    // Robot Status Card
    robotData ? React.createElement('div', { style: cardStyle },
      React.createElement('h2', null, '🤖 Robot Status'),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' } },
        React.createElement('div', null,
          React.createElement('p', null, React.createElement('strong', null, 'Robot ID: '), robotData.robot_id),
          React.createElement('p', null, React.createElement('strong', null, 'Status: '), robotData.status),
          React.createElement('p', null, React.createElement('strong', null, 'Battery: '), `${robotData.battery_level?.toFixed(1) || 'N/A'}%`)
        ),
        React.createElement('div', null,
          React.createElement('p', null, React.createElement('strong', null, 'Position:')),
          React.createElement('p', null, `X: ${robotData.location?.x?.toFixed(2) || 0}`),
          React.createElement('p', null, `Y: ${robotData.location?.y?.toFixed(2) || 0}`),
          React.createElement('p', null, `Z: ${robotData.location?.z?.toFixed(2) || 0}`)
        )
      )
    ) : React.createElement('div', { style: cardStyle },
      React.createElement('h2', null, '🤖 Robot Status'),
      React.createElement('p', null, 'No robot connected. Start the robot simulator to see data.')
    ),

    // Sensor Data Card
    React.createElement('div', { style: cardStyle },
      React.createElement('h2', null, '📊 Recent Sensor Data'),
      recentSensors.length > 0 ? 
        React.createElement('div', { style: { maxHeight: '200px', overflowY: 'auto' } },
          recentSensors.slice(-6).map((sensor: SensorReading, index: number) => 
            React.createElement('div', { 
              key: index,
              style: { 
                padding: '5px', 
                borderBottom: '1px solid #eee',
                fontSize: '12px'
              } 
            },
              React.createElement('strong', null, sensor.sensor_type + ': '),
              `${sensor.value} ${sensor.unit} `,
              React.createElement('span', { style: { color: '#666' } }, 
                new Date(sensor.timestamp).toLocaleTimeString()
              )
            )
          )
        ) :
        React.createElement('p', null, 'No sensor data available. Start robot to see live data.'),

      // Grafana embedded panel (iframe). Replace panelUrl with a real panel share URL.
      React.createElement('div', { style: { marginTop: 12 } },
        React.createElement('h3', null, 'Grafana Visualization'),
        React.createElement(GrafanaPanel, { panelUrl: `http://localhost:3000/d-solo/your-dashboard-uid/your-dashboard-slug?orgId=1&panelId=2&var-robot_id=${robotData?.robot_id || ''}&from=now-1h&to=now`, height: 360 })
      ),
    ),

    // Robot Controls Card
    React.createElement('div', { style: cardStyle },
      React.createElement('h2', null, '🎮 Robot Controls'),
      // Job summary and scan controls
      React.createElement('div', { style: { marginBottom: '10px' } },
        React.createElement('h3', null, 'Job Summary'),
        jobSummary ? React.createElement('div', null,
          React.createElement('p', null, React.createElement('strong', null, 'Start: '), jobSummary.start_time || 'N/A'),
          React.createElement('p', null, React.createElement('strong', null, 'End: '), jobSummary.end_time || 'N/A'),
          React.createElement('p', null, React.createElement('strong', null, 'Progress: '), jobSummary.percent_complete !== null ? `${jobSummary.percent_complete}%` : 'Unknown'),
          React.createElement('p', null, React.createElement('strong', null, 'Items processed: '), `${jobSummary.items_done}/${jobSummary.items_total || 'unknown'}`),
          jobSummary.last_item ? React.createElement('div', { style: { fontSize: '12px', color: '#555' } },
            React.createElement('strong', null, 'Last item: '), JSON.stringify(jobSummary.last_item)
          ) : null
        ) : React.createElement('p', null, 'No job data yet.'),

        React.createElement('div', { style: { marginTop: '8px' } },
          React.createElement('label', null, 'QR to trigger: '),
          React.createElement('select', { value: selectedQR, onChange: (e: any) => setSelectedQR(e.target.value) },
            React.createElement('option', { value: 'QR12345' }, 'QR12345 - Widget A'),
            React.createElement('option', { value: 'QR67890' }, 'QR67890 - Gadget B'),
            React.createElement('option', { value: 'QR00001' }, 'QR00001 - Box C'),
            React.createElement('option', { value: 'QR_UNKNOWN' }, 'QR_UNKNOWN - Not found')
          ),
          React.createElement('button', { style: buttonStyle, onClick: async () => {
            if (!robotData) { alert('No robot connected'); return; }
            try {
              const res = await fetch('http://localhost:8000/api/robot-data/trigger-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ robot_id: robotData.robot_id, qr: selectedQR })
              });
              if (res.ok) {
                alert('Scan triggered');
                // refresh job summary
                const js = await fetch(`http://localhost:8000/api/robot-data/job-summary/${robotData.robot_id}`);
                if (js.ok) setJobSummary(await js.json());
              } else {
                alert('Failed to trigger scan');
              }
            } catch (e: any) { alert('Error: '+String(e)); }
          } }, 'Trigger Scan')
        )
      ),
      React.createElement('div', { style: { marginBottom: '10px' } },
        React.createElement('h3', null, 'Movement Controls:'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', maxWidth: '200px', margin: '10px 0' } },
          React.createElement('div'),
          React.createElement('button', { style: buttonStyle, onClick: () => moveRobot('forward') }, '↑'),
          React.createElement('div'),
          React.createElement('button', { style: buttonStyle, onClick: () => moveRobot('left') }, '←'),
          React.createElement('button', { style: dangerButtonStyle, onClick: stopRobot }, 'STOP'),
          React.createElement('button', { style: buttonStyle, onClick: () => moveRobot('right') }, '→'),
          React.createElement('div'),
          React.createElement('button', { style: buttonStyle, onClick: () => moveRobot('backward') }, '↓'),
          React.createElement('div')
        )
      ),
      React.createElement('div', { style: { marginBottom: '10px' } },
        React.createElement('h3', null, 'System Controls:'),
        React.createElement('button', { style: successButtonStyle, onClick: requestRobotStatus }, 'Refresh Status'),
        React.createElement('button', { style: buttonStyle, onClick: () => {
          fetch('http://localhost:8000/api/health')
            .then(res => res.json())
            .then(data => alert('Backend Status: ' + JSON.stringify(data)))
            .catch(err => alert('Backend connection failed: ' + err.message));
        }}, 'Test Backend')
      ),
      commandResponse && React.createElement('div', { style: { marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px' } },
        React.createElement('strong', null, 'Last Command: '),
        commandResponse
      )
    ),

    // Instructions Card
    React.createElement('div', { style: cardStyle },
      React.createElement('h2', null, '🚀 Getting Started'),
      React.createElement('div', null,
        React.createElement('h3', null, 'To connect your TonyPi robot:'),
        React.createElement('ol', null,
          React.createElement('li', null, 'Copy robot_client folder to your Raspberry Pi 5'),
          React.createElement('li', null, 'Install dependencies: pip install -r requirements.txt'),
          React.createElement('li', null, 'Run: python3 tonypi_client.py --broker YOUR_PC_IP'),
          React.createElement('li', null, 'Or test with simulator: python3 simulator.py')
        ),
        React.createElement('p', { style: { fontSize: '14px', color: '#666' } },
          'Replace YOUR_PC_IP with the IP address of this computer running the monitoring system.'
        )
      )
    )
    ) : null // End of Overview Tab Content
  );
};

export default TonyPiApp;