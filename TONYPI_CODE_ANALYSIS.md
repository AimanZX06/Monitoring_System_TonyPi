# TonyPi Code Analysis for Monitoring System Integration

## Overview

After analyzing your `code4chat/tonypi/TonyPi/` folder, here's a complete mapping of which code can be used for each frontend feature.

---

## Quick Reference: Code to Use

| Frontend Feature | TonyPi Code File | Key Functions |
|-----------------|------------------|---------------|
| **Servo Monitoring** | `HiwonderSDK/hiwonder/Controller.py` | `get_bus_servo_temp()`, `get_bus_servo_pulse()`, `get_bus_servo_vin()` |
| **IMU Sensors** | `HiwonderSDK/hiwonder/ros_robot_controller_sdk.py` | `board.get_imu()` returns (ax, ay, az, gx, gy, gz) |
| **Ultrasonic Distance** | `HiwonderSDK/hiwonder/Sonar.py` | `sonar.getDistance()` returns mm |
| **Battery Level** | `HiwonderSDK/hiwonder/ros_robot_controller_sdk.py` | `board.get_battery()` returns voltage in mV |
| **Camera Feed** | `Camera.py` + `MjpgServer.py` | MJPEG stream on port 8080 |
| **Movement Actions** | `HiwonderSDK/hiwonder/ActionGroupControl.py` | `runActionGroup('go_forward')`, etc. |
| **Head Control** | `Functions/Head_Control.py` | `nod_head()`, `shake_head()` |

---

## Detailed Integration Guide

### 1. Servo Motor Data (Servos Page)

**Files Needed:**
```
code4chat/tonypi/TonyPi/HiwonderSDK/hiwonder/
├── ros_robot_controller_sdk.py   # Board class with serial communication
└── Controller.py                  # High-level servo control wrapper
```

**Key Functions from `Controller.py`:**

```python
from hiwonder.Controller import Controller
from hiwonder import ros_robot_controller_sdk as rrc

board = rrc.Board()
ctl = Controller(board)
board.enable_reception(True)  # IMPORTANT: Enable data reception

# Get servo data
for servo_id in [1, 2, 3, 4, 5, 6]:
    position = ctl.get_bus_servo_pulse(servo_id)    # Servo position (pulse 0-1000)
    temperature = ctl.get_bus_servo_temp(servo_id)  # Temperature in Celsius
    voltage = ctl.get_bus_servo_vin(servo_id)       # Voltage in mV
    print(f"Servo {servo_id}: pos={position}, temp={temperature}C, vin={voltage}mV")
```

**Integration with tonypi_client.py:**
```python
def get_servo_status(self) -> Dict[str, Any]:
    """Read real servo data from TonyPi hardware"""
    from hiwonder.Controller import Controller
    from hiwonder import ros_robot_controller_sdk as rrc
    
    board = rrc.Board()
    ctl = Controller(board)
    board.enable_reception(True)
    
    servo_names = ["Left Hip", "Left Knee", "Right Hip", "Right Knee", "Head Pan", "Head Tilt"]
    servo_data = {}
    
    for idx in range(1, 7):
        try:
            pos = ctl.get_bus_servo_pulse(idx)
            temp = ctl.get_bus_servo_temp(idx)
            vin = ctl.get_bus_servo_vin(idx)
            
            # Convert pulse to degrees (500-2500 pulse = -90 to 90 degrees)
            angle = ((pos or 500) - 500) * 0.09 - 90
            
            alert = "normal"
            if temp and temp > 70:
                alert = "critical"
            elif temp and temp > 60:
                alert = "warning"
            
            servo_data[f"servo_{idx}"] = {
                "id": idx,
                "name": servo_names[idx-1],
                "position": round(angle, 1),
                "temperature": temp or 45.0,
                "voltage": (vin or 5000) / 1000.0,  # Convert mV to V
                "torque_enabled": True,
                "alert_level": alert
            }
        except Exception as e:
            pass
    
    return servo_data
```

---

### 2. IMU/Accelerometer/Gyroscope (Sensors Page)

**Files Needed:**
```
code4chat/tonypi/TonyPi/HiwonderSDK/hiwonder/ros_robot_controller_sdk.py
```

**Key Function:**
```python
# From ros_robot_controller_sdk.py line 210-219
def get_imu(self):
    """Returns (ax, ay, az, gx, gy, gz) - accelerometer and gyroscope data"""
    if self.enable_recv:
        try:
            # ax, ay, az, gx, gy, gz
            return struct.unpack('<6f', self.imu_queue.get(block=False))
        except queue.Empty:
            return None
```

**Integration:**
```python
def read_imu_sensors(self) -> Dict[str, float]:
    """Read real IMU data from TonyPi"""
    from hiwonder import ros_robot_controller_sdk as rrc
    
    board = rrc.Board()
    board.enable_reception(True)
    
    imu_data = board.get_imu()
    if imu_data:
        ax, ay, az, gx, gy, gz = imu_data
        return {
            "accelerometer_x": round(ax, 3),
            "accelerometer_y": round(ay, 3),
            "accelerometer_z": round(az, 3),
            "gyroscope_x": round(gx, 2),
            "gyroscope_y": round(gy, 2),
            "gyroscope_z": round(gz, 2),
        }
    return None
```

---

### 3. Ultrasonic Distance Sensor (Sensors Page)

**Files Needed:**
```
code4chat/tonypi/TonyPi/HiwonderSDK/hiwonder/Sonar.py
```

**Key Function:**
```python
# From Sonar.py line 93-107
def getDistance(self):
    """Returns distance in millimeters (max 5000mm = 5m)"""
    dist = 99999
    try:
        with SMBus(self.i2c) as bus:
            msg = i2c_msg.write(self.i2c_addr, [0,])
            bus.i2c_rdwr(msg)
            read = i2c_msg.read(self.i2c_addr, 2)
            bus.i2c_rdwr(read)
            dist = int.from_bytes(bytes(list(read)), byteorder='little', signed=False)
            if dist > 5000:
                dist = 5000
    except:
        print('Sensor not connected!')
    return dist
```

**Integration:**
```python
def read_ultrasonic(self) -> float:
    """Read ultrasonic distance in cm"""
    from hiwonder.Sonar import Sonar
    
    sonar = Sonar()
    distance_mm = sonar.getDistance()
    
    if distance_mm != 99999:
        return distance_mm / 10.0  # Convert to cm
    return None
```

---

### 4. Battery Level (Dashboard, Robots Page)

**Files Needed:**
```
code4chat/tonypi/TonyPi/HiwonderSDK/hiwonder/ros_robot_controller_sdk.py
```

**Key Function:**
```python
# From ros_robot_controller_sdk.py line 180-192
def get_battery(self):
    """Returns battery voltage in millivolts"""
    if self.enable_recv:
        try:
            data = self.sys_queue.get(block=False)
            if data[0] == 0x04:
                return struct.unpack('<H', data[1:])[0]  # Voltage in mV
        except queue.Empty:
            return None
    return None
```

**Integration:**
```python
def get_battery_level(self) -> float:
    """Get battery percentage (assumes 12V nominal, 10-14V range)"""
    from hiwonder import ros_robot_controller_sdk as rrc
    
    board = rrc.Board()
    board.enable_reception(True)
    
    voltage_mv = board.get_battery()
    if voltage_mv:
        voltage_v = voltage_mv / 1000.0
        # Convert voltage to percentage (10V = 0%, 12.6V = 100%)
        percentage = ((voltage_v - 10.0) / 2.6) * 100
        return max(0, min(100, percentage))
    return None
```

---

### 5. Camera Feed (Robots Page)

**Files Needed:**
```
code4chat/tonypi/TonyPi/Camera.py          # Camera capture class
code4chat/tonypi/TonyPi/MjpgServer.py      # MJPEG HTTP streaming server
```

**How it works:**

1. `Camera.py` opens the USB camera and captures frames using OpenCV
2. `MjpgServer.py` serves frames as MJPEG stream on port 8080

**To start camera streaming on TonyPi:**
```python
#!/usr/bin/env python3
# camera_stream.py - Run on TonyPi
import sys
sys.path.append('/home/pi/TonyPi')

from Camera import Camera
import MjpgServer
import threading

# Start camera
camera = Camera()
camera.camera_open()

# Start MJPEG server in background
server_thread = threading.Thread(target=MjpgServer.startMjpgServer, daemon=True)
server_thread.start()

# Update MjpgServer with camera frames
while True:
    ret, frame = camera.read()
    if ret:
        MjpgServer.img_show = frame
```

**Frontend URL:**
```
http://<tonypi-ip>:8080/?action=stream
```

---

### 6. Movement Actions (Robots Page Commands)

**Files Needed:**
```
code4chat/tonypi/TonyPi/HiwonderSDK/hiwonder/ActionGroupControl.py
code4chat/tonypi/TonyPi/ActionGroups/*.d6a    # Pre-recorded action files
```

**Available Actions (from ActionGroups folder):**
| Action | File | Description |
|--------|------|-------------|
| Walk Forward | `go_forward.d6a` | Normal walking |
| Walk Fast | `go_forward_fast.d6a` | Fast walking |
| Walk Backward | `back.d6a` | Walking backward |
| Turn Left | `turn_left.d6a` | Turn left |
| Turn Right | `turn_right.d6a` | Turn right |
| Stand | `stand.d6a` | Stand position |
| Sit Down | `squat_down.d6a` | Squat position |
| Wave | `wave.d6a` | Wave hand |
| Left Kick | `left_kick.d6a` | Kick with left leg |
| Right Kick | `right_kick.d6a` | Kick with right leg |

**Integration:**
```python
def handle_move_command(self, payload: Dict) -> Dict:
    """Execute movement using TonyPi action groups"""
    from hiwonder.ActionGroupControl import runActionGroup, stopActionGroup
    
    direction = payload.get("direction", "forward")
    
    action_map = {
        "forward": "go_forward",
        "backward": "back",
        "left": "turn_left",
        "right": "turn_right",
        "stop": None,
        "stand": "stand",
    }
    
    if direction == "stop":
        stopActionGroup()
        return {"success": True, "message": "Stopped"}
    
    action = action_map.get(direction)
    if action:
        runActionGroup(action, times=1, with_stand=True)
        return {"success": True, "message": f"Executed {action}"}
    
    return {"success": False, "message": "Unknown direction"}
```

---

## Complete Integration: Updated tonypi_client.py

Here's how to modify your `tonypi_client.py` to use real TonyPi hardware:

```python
#!/usr/bin/env python3
"""
TonyPi Robot Client - Real Hardware Version
Runs on Raspberry Pi with TonyPi robot
"""

import sys
sys.path.append('/home/pi/TonyPi')
sys.path.append('/home/pi/TonyPi/HiwonderSDK')

# Import TonyPi SDK
try:
    from hiwonder import ros_robot_controller_sdk as rrc
    from hiwonder.Controller import Controller
    from hiwonder.Sonar import Sonar
    from hiwonder.ActionGroupControl import runActionGroup, stopActionGroup
    HARDWARE_AVAILABLE = True
except ImportError:
    HARDWARE_AVAILABLE = False
    print("Warning: HiWonder SDK not available, running in simulation mode")

class TonyPiRobotClient:
    def __init__(self, ...):
        # ... existing init code ...
        
        # Initialize hardware if available
        if HARDWARE_AVAILABLE:
            self.board = rrc.Board()
            self.controller = Controller(self.board)
            self.sonar = Sonar()
            self.board.enable_reception(True)
    
    def read_sensors(self) -> Dict[str, float]:
        """Read real sensor data from hardware"""
        if not HARDWARE_AVAILABLE:
            return self._simulate_sensors()
        
        sensors = {}
        
        # IMU Data
        imu = self.board.get_imu()
        if imu:
            sensors["accelerometer_x"] = round(imu[0], 3)
            sensors["accelerometer_y"] = round(imu[1], 3)
            sensors["accelerometer_z"] = round(imu[2], 3)
            sensors["gyroscope_x"] = round(imu[3], 2)
            sensors["gyroscope_y"] = round(imu[4], 2)
            sensors["gyroscope_z"] = round(imu[5], 2)
        
        # Ultrasonic
        distance = self.sonar.getDistance()
        if distance != 99999:
            sensors["ultrasonic_distance"] = distance / 10.0  # cm
        
        # CPU Temperature (from Raspberry Pi)
        try:
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                sensors["cpu_temperature"] = float(f.read()) / 1000.0
        except:
            pass
        
        return sensors
    
    def get_servo_status(self) -> Dict[str, Any]:
        """Read real servo data"""
        if not HARDWARE_AVAILABLE:
            return self._simulate_servos()
        
        servo_names = ["Left Hip", "Left Knee", "Right Hip", 
                       "Right Knee", "Head Pan", "Head Tilt"]
        servo_data = {}
        
        for idx in range(1, 7):
            pos = self.controller.get_bus_servo_pulse(idx)
            temp = self.controller.get_bus_servo_temp(idx)
            vin = self.controller.get_bus_servo_vin(idx)
            
            angle = ((pos or 500) - 500) * 0.09 - 90
            
            servo_data[f"servo_{idx}"] = {
                "id": idx,
                "name": servo_names[idx-1],
                "position": round(angle, 1),
                "temperature": temp or 45.0,
                "voltage": (vin or 5000) / 1000.0,
                "torque_enabled": True,
                "alert_level": "critical" if temp and temp > 70 else 
                               "warning" if temp and temp > 60 else "normal"
            }
        
        return servo_data
    
    def get_battery_percentage(self) -> float:
        """Read real battery level"""
        if not HARDWARE_AVAILABLE:
            return self.battery_level
        
        voltage_mv = self.board.get_battery()
        if voltage_mv:
            voltage_v = voltage_mv / 1000.0
            percentage = ((voltage_v - 10.0) / 2.6) * 100
            return max(0, min(100, percentage))
        return self.battery_level
```

---

## Files to Copy to TonyPi

Copy these files to your TonyPi Raspberry Pi:

```bash
# From your project
scp robot_client/tonypi_client.py pi@<tonypi-ip>:/home/pi/monitoring/
scp robot_client/requirements.txt pi@<tonypi-ip>:/home/pi/monitoring/

# The TonyPi SDK is already at /home/pi/TonyPi/HiwonderSDK/
```

---

## Summary: What Each TonyPi File Provides

| File | Purpose | Your System Uses It For |
|------|---------|------------------------|
| `ros_robot_controller_sdk.py` | Serial communication with STM32 board | IMU, Battery, Servos raw data |
| `Controller.py` | High-level wrapper for servo control | Reading servo temp/position/voltage |
| `Sonar.py` | I2C ultrasonic sensor driver | Distance measurements |
| `Camera.py` | OpenCV camera wrapper | Camera frame capture |
| `MjpgServer.py` | HTTP MJPEG stream server | Camera feed to frontend |
| `ActionGroupControl.py` | Run pre-recorded motions | Walking, turning, actions |
| `ActionGroups/*.d6a` | SQLite motion files | Available robot actions |

---

## Next Steps

1. **Test with Simulator First** - Run `python simulator.py --mode all-features`
2. **Copy SDK to robot_client** - Or add path to TonyPi folder
3. **Modify tonypi_client.py** - Add hardware imports with fallback
4. **Start Camera Stream** - Run camera_stream.py on TonyPi
5. **Connect to MQTT** - Run client pointing to your server's MQTT broker
