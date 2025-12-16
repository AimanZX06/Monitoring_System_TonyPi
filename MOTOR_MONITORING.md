# Motor Monitoring & Alert System

## Overview
This document outlines the motor monitoring capabilities for TonyPi robots, including temperature tracking, threshold alerts, and detailed motor diagnostics.

---

## Current System Status

### ✅ **Already Implemented**
- **CPU Temperature**: Raspberry Pi SoC temperature monitoring
- **Servo Angle**: Head/camera servo position tracking
- **System Resources**: CPU usage, memory, disk

### ⚠️ **Motor-Specific Features (To Be Added)**
Motor temperature and status monitoring requires hardware-specific libraries that interact with TonyPi's servo controllers.

---

## Motor Monitoring Capabilities

### **What Can Be Monitored**

#### 1. **Servo Motor Parameters**
TonyPi robots typically use serial bus servo motors (e.g., HTS/LX series). These motors can report:

| Parameter | Description | Unit | Alert Threshold |
|-----------|-------------|------|-----------------|
| **Temperature** | Internal motor temperature | °C | > 65°C Warning, > 75°C Critical |
| **Position** | Current angle/position | Degrees | N/A |
| **Load/Torque** | Current load on motor | % | > 80% Warning, > 95% Critical |
| **Voltage** | Input voltage | V | < 4.5V Warning, < 4.0V Critical |
| **Current** | Current draw | mA | > 800mA Warning, > 1000mA Critical |
| **Speed** | Rotation speed | RPM | N/A |
| **Error Status** | Overload, overheat, stall | Boolean | Any error = Critical |

#### 2. **System-Level Metrics**
- **CPU Temperature**: Already monitored (Pi SoC)
- **Ambient Temperature**: If external sensor present
- **Battery Temperature**: Li-Po safety monitoring
- **Motor Controller Temperature**: PWM driver IC temperature

---

## Implementation Plan

### **Phase 1: Add Motor Temperature Monitoring**

#### A. Hardware Requirements
TonyPi uses serial bus servos that communicate via UART. You need:
- **HiwonderSDK** or **LX-16A servo library** (Python)
- Serial port access (`/dev/ttyUSB0` or `/dev/ttyAMA0`)

#### B. Code Example for tonypi_client.py

```python
# Add to imports
try:
    from hiwonder import Board  # TonyPi SDK
    MOTOR_SDK_AVAILABLE = True
except ImportError:
    MOTOR_SDK_AVAILABLE = False
    logger.warning("Motor SDK not available, using simulated data")

class TonyPiRobotClient:
    def __init__(self, ...):
        # ... existing code ...
        
        # Motor IDs (TonyPi typically has 4-8 servos)
        self.motor_ids = {
            1: "left_front_leg",
            2: "left_rear_leg", 
            3: "right_front_leg",
            4: "right_rear_leg",
            5: "head_pan",
            6: "head_tilt"
        }
        
        # Alert thresholds
        self.motor_temp_warning = 65.0   # °C
        self.motor_temp_critical = 75.0  # °C
        self.motor_load_warning = 80.0   # %
        self.motor_load_critical = 95.0  # %

    def get_motor_status(self) -> Dict[str, Any]:
        """Get status of all motors"""
        motor_data = {}
        
        if MOTOR_SDK_AVAILABLE:
            for motor_id, motor_name in self.motor_ids.items():
                try:
                    # Read motor parameters
                    temp = Board.getBusServoTemp(motor_id)  # Temperature in °C
                    pos = Board.getBusServoPosition(motor_id)  # Position in degrees
                    load = Board.getBusServoLoad(motor_id)  # Load in percentage
                    voltage = Board.getBusServoVin(motor_id)  # Voltage in mV
                    
                    motor_data[motor_name] = {
                        "id": motor_id,
                        "temperature": temp / 10.0 if temp else 25.0,  # Convert to °C
                        "position": pos,
                        "load": abs(load) if load else 0,  # Load can be negative
                        "voltage": voltage / 1000.0 if voltage else 5.0,  # Convert to V
                        "alert_level": self._check_motor_alerts(temp/10.0, abs(load))
                    }
                except Exception as e:
                    logger.error(f"Error reading motor {motor_id}: {e}")
                    motor_data[motor_name] = {"error": str(e)}
        else:
            # Simulated motor data for testing
            import random
            for motor_id, motor_name in self.motor_ids.items():
                temp = random.uniform(35, 70)  # °C
                load = random.uniform(10, 85)  # %
                motor_data[motor_name] = {
                    "id": motor_id,
                    "temperature": round(temp, 1),
                    "position": random.randint(-90, 90),
                    "load": round(load, 1),
                    "voltage": round(random.uniform(4.8, 5.2), 2),
                    "alert_level": self._check_motor_alerts(temp, load)
                }
        
        return motor_data

    def _check_motor_alerts(self, temp: float, load: float) -> str:
        """Determine alert level based on motor parameters"""
        if temp >= self.motor_temp_critical or load >= self.motor_load_critical:
            return "critical"
        elif temp >= self.motor_temp_warning or load >= self.motor_load_warning:
            return "warning"
        else:
            return "normal"

    def send_motor_status(self):
        """Publish motor status to MQTT"""
        motor_status = self.get_motor_status()
        
        payload = {
            "robot_id": self.robot_id,
            "timestamp": datetime.now().isoformat(),
            "motors": motor_status
        }
        
        # Publish to motor-specific topic
        motor_topic = f"tonypi/motors/{self.robot_id}"
        self.client.publish(motor_topic, json.dumps(payload))
        
        # Check for alerts
        for motor_name, data in motor_status.items():
            if data.get("alert_level") in ["warning", "critical"]:
                alert_payload = {
                    "robot_id": self.robot_id,
                    "timestamp": datetime.now().isoformat(),
                    "alert_type": "motor_alert",
                    "severity": data["alert_level"],
                    "motor": motor_name,
                    "temperature": data.get("temperature"),
                    "load": data.get("load"),
                    "message": f"Motor {motor_name} {data['alert_level']}: Temp={data.get('temperature')}°C, Load={data.get('load')}%"
                }
                alert_topic = f"tonypi/alerts/{self.robot_id}"
                self.client.publish(alert_topic, json.dumps(alert_payload))
                logger.warning(alert_payload["message"])
```

#### C. Update main loop to publish motor data

```python
async def run(self):
    """Main run loop"""
    self.running = True
    
    while self.running and self.is_connected:
        try:
            # Send regular updates
            self.send_status_update()
            self.send_sensor_data()
            self.send_motor_status()  # NEW: Add motor monitoring
            
            await asyncio.sleep(5)  # Update every 5 seconds
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
            await asyncio.sleep(1)
```

---

### **Phase 2: Backend - Store Motor Data**

#### Update backend/mqtt/mqtt_client.py

```python
def on_message(self, client, userdata, msg):
    """Handle MQTT messages"""
    try:
        topic = msg.topic
        payload = json.loads(msg.payload)
        
        # ... existing handlers ...
        
        # NEW: Handle motor status
        if topic.startswith("tonypi/motors/"):
            self.handle_motor_data(payload)
        
        # NEW: Handle alerts
        elif topic.startswith("tonypi/alerts/"):
            self.handle_alert_data(payload)
    
    except Exception as e:
        self.logger.error(f"Error handling message: {e}")

def handle_motor_data(self, payload: dict):
    """Store motor telemetry in InfluxDB"""
    try:
        robot_id = payload.get("robot_id")
        motors = payload.get("motors", {})
        timestamp = payload.get("timestamp")
        
        for motor_name, motor_data in motors.items():
            if "error" in motor_data:
                continue
            
            point = {
                "measurement": "motor_status",
                "tags": {
                    "robot_id": robot_id,
                    "motor_name": motor_name,
                    "motor_id": str(motor_data.get("id", 0))
                },
                "fields": {
                    "temperature": float(motor_data.get("temperature", 0)),
                    "position": float(motor_data.get("position", 0)),
                    "load": float(motor_data.get("load", 0)),
                    "voltage": float(motor_data.get("voltage", 0)),
                    "alert_level": motor_data.get("alert_level", "normal")
                },
                "time": timestamp
            }
            
            self.influx_client.write_point(point)
            
    except Exception as e:
        self.logger.error(f"Error handling motor data: {e}")

def handle_alert_data(self, payload: dict):
    """Store alerts in InfluxDB and trigger notifications"""
    try:
        point = {
            "measurement": "robot_alerts",
            "tags": {
                "robot_id": payload.get("robot_id"),
                "alert_type": payload.get("alert_type"),
                "severity": payload.get("severity"),
                "motor": payload.get("motor", "")
            },
            "fields": {
                "message": payload.get("message", ""),
                "temperature": float(payload.get("temperature", 0)),
                "load": float(payload.get("load", 0))
            },
            "time": payload.get("timestamp")
        }
        
        self.influx_client.write_point(point)
        self.logger.warning(f"Alert: {payload.get('message')}")
        
    except Exception as e:
        self.logger.error(f"Error handling alert: {e}")
```

---

### **Phase 3: Frontend - Motor Monitoring Dashboard**

Create `frontend/src/pages/Motors.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Thermometer, Zap, Gauge } from 'lucide-react';

interface MotorData {
  id: number;
  name: string;
  temperature: number;
  position: number;
  load: number;
  voltage: number;
  alert_level: 'normal' | 'warning' | 'critical';
}

const Motors: React.FC = () => {
  const [motors, setMotors] = useState<MotorData[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchMotorData = async () => {
      try {
        const response = await fetch('/api/robot-data/motors/tonypi_raspberrypi');
        const data = await response.json();
        setMotors(data.motors);
      } catch (error) {
        console.error('Error fetching motor data:', error);
      }
    };

    fetchMotorData();
    const interval = setInterval(fetchMotorData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="text-red-500" />;
      case 'warning': return <AlertTriangle className="text-yellow-500" />;
      default: return <CheckCircle className="text-green-500" />;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 75) return 'bg-red-500';
    if (temp >= 65) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">⚙️ Motor Monitoring</h1>
      
      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Active Alerts:</strong>
          <ul>
            {alerts.map((alert, idx) => (
              <li key={idx}>{alert.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Motor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {motors.map((motor) => (
          <div key={motor.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{motor.name}</h3>
              {getAlertIcon(motor.alert_level)}
            </div>

            {/* Temperature */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Thermometer size={16} />
                <span className="text-sm">Temperature: {motor.temperature}°C</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getTemperatureColor(motor.temperature)}`}
                  style={{ width: `${Math.min(motor.temperature, 100)}%` }}
                />
              </div>
            </div>

            {/* Load */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Gauge size={16} />
                <span className="text-sm">Load: {motor.load}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${motor.load > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${motor.load}%` }}
                />
              </div>
            </div>

            {/* Voltage */}
            <div className="flex items-center gap-2">
              <Zap size={16} />
              <span className="text-sm">Voltage: {motor.voltage}V</span>
            </div>

            {/* Position */}
            <div className="text-sm text-gray-600 mt-2">
              Position: {motor.position}°
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Motors;
```

---

## Hardware Integration Guide

### **TonyPi-Specific Setup**

#### 1. Install HiwonderSDK
```bash
# On Raspberry Pi
cd ~
git clone https://github.com/Hiwonder-docs/hiwonder-sdk-python.git
cd hiwonder-sdk-python
sudo pip3 install .
```

#### 2. Enable Serial Port
```bash
# Edit /boot/config.txt
sudo nano /boot/config.txt

# Add:
enable_uart=1
dtoverlay=pi3-disable-bt

# Reboot
sudo reboot
```

#### 3. Test Motor Communication
```python
from hiwonder import Board

# Read motor 1 temperature
temp = Board.getBusServoTemp(1)
print(f"Motor 1 Temperature: {temp/10.0}°C")

# Read motor 1 position
pos = Board.getBusServoPosition(1)
print(f"Motor 1 Position: {pos}°")
```

---

## Alert Configuration

### **Threshold Settings**
Edit in `tonypi_client.py`:

```python
# Conservative thresholds (safer, more alerts)
self.motor_temp_warning = 60.0   # °C
self.motor_temp_critical = 70.0  # °C
self.motor_load_warning = 75.0   # %
self.motor_load_critical = 90.0  # %

# Aggressive thresholds (fewer alerts, higher risk)
self.motor_temp_warning = 70.0   # °C
self.motor_temp_critical = 80.0  # °C
self.motor_load_warning = 85.0   # %
self.motor_load_critical = 95.0  # %
```

### **Alert Actions**
When alert is triggered:
1. **Log to console** (already implemented)
2. **Publish to MQTT** `tonypi/alerts/{robot_id}` (already implemented)
3. **Store in InfluxDB** (backend handles this)
4. **Display in UI** (frontend alert banner)
5. **Optional**: Email/SMS notification (future enhancement)

---

## Testing Without Hardware

### **Simulation Mode**
The code automatically falls back to simulated data if `HiwonderSDK` is not installed:

```python
# In tonypi_client.py
if MOTOR_SDK_AVAILABLE:
    # Use real hardware
    temp = Board.getBusServoTemp(motor_id)
else:
    # Use simulation
    temp = random.uniform(35, 70)
```

This allows you to test the complete monitoring system on your development PC before deploying to the actual TonyPi robot.

---

## Summary

**To enable full motor monitoring:**

1. ✅ **Jobs page integrated** (just completed)
2. 🔧 **Add motor monitoring code** to `tonypi_client.py` (copy from above)
3. 🔧 **Update backend** MQTT handler (add motor_data and alert handlers)
4. 🔧 **Create Motors page** in frontend
5. 🔧 **Add Motors tab** to TonyPiApp navigation
6. 🔧 **Install HiwonderSDK** on Raspberry Pi (for real hardware)

**Current Capabilities:**
- ✅ CPU temperature monitoring (system-level)
- ✅ Servo angle tracking (simulated)
- ⚠️ Motor-specific temperature (needs SDK)
- ⚠️ Motor load/torque (needs SDK)
- ⚠️ Motor voltage (needs SDK)

**Estimated Implementation Time:**
- Motor monitoring code: 1-2 hours
- Backend handlers: 30 minutes
- Frontend UI: 1 hour
- Testing with hardware: 30 minutes
- **Total: 3-4 hours**
