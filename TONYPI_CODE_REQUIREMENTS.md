# TonyPi Code Requirements for Full System Integration

This document explains what code from the real TonyPi/Raspberry Pi robot is needed to fully integrate with the monitoring system.

## Quick Answer Summary

| Feature | Simulator Can Test? | Real TonyPi Code Needed? |
|---------|---------------------|--------------------------|
| Dashboard (status, battery) | Yes | Not required |
| Monitoring (CPU, Memory, Disk, Temp) | Yes | Automatic via psutil |
| Sensors (IMU, Ultrasonic, Light) | Yes | HiWonder SDK for real values |
| Servos (6 motors) | Yes | HiWonder servo library |
| Jobs (progress tracking) | Yes | QR scanner integration |
| Camera Feed | No (placeholder) | **mjpeg-streamer required** |
| Terminal Output | Yes (simulated logs) | SSH/serial or MQTT logs |

---

## 1. Camera Feed

### Current Frontend Behavior
The Robots page (`frontend/src/pages/Robots.tsx`) displays a camera feed using an `<img>` tag with a default URL:
```
http://192.168.149.1:8080/?action=stream
```

### What You Need from TonyPi

**Option A: mjpeg-streamer (Recommended)**

The TonyPi uses mjpeg-streamer for video streaming. You need to:

1. **Start mjpeg-streamer on the TonyPi**:
```bash
# On the TonyPi Raspberry Pi
mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 15" -o "output_http.so -p 8080 -w /usr/share/mjpg-streamer/www"
```

2. **Or use the HiWonder camera script**:
```python
# TonyPi typically has a camera service running
# Check /home/pi/TonyPi/CameraCalibration/ for camera scripts
```

3. **Fetch the code** (if not already on your TonyPi):
```
/home/pi/TonyPi/CameraCalibration/
/home/pi/TonyPi/Functions/CameraCapture/
```

**Option B: Simple Python camera server**

If mjpeg-streamer isn't available, you can create a simple Flask camera server:

```python
# camera_server.py - Run on TonyPi
import cv2
from flask import Flask, Response

app = Flask(__name__)
camera = cv2.VideoCapture(0)

def generate_frames():
    while True:
        success, frame = camera.read()
        if not success:
            break
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

### Network Configuration

Make sure:
- TonyPi IP is accessible from your monitoring system
- Port 8080 is open
- The camera stream URL in the frontend matches your TonyPi's IP

---

## 2. Terminal Output / Logs

### Current Frontend Behavior
The Robots page shows a terminal panel with robot logs. Currently, it:
- Shows simulated heartbeat/sensor update messages
- Accepts commands from the input field

### What You Need from TonyPi

**Option A: MQTT-based logging (Recommended)**

The simulator already sends logs via MQTT topic `tonypi/terminal/{robot_id}`. For real logs:

```python
# Add this to your tonypi_client.py or robot code
import logging

class MQTTLogHandler(logging.Handler):
    def __init__(self, mqtt_client, robot_id):
        super().__init__()
        self.mqtt_client = mqtt_client
        self.topic = f"tonypi/terminal/{robot_id}"
    
    def emit(self, record):
        log_entry = self.format(record)
        self.mqtt_client.publish(self.topic, json.dumps({
            "robot_id": self.robot_id,
            "log": log_entry,
            "level": record.levelname,
            "timestamp": datetime.now().isoformat()
        }))

# Usage:
logger.addHandler(MQTTLogHandler(mqtt_client, robot_id))
```

**Option B: SSH-based log streaming**

For production, you might want direct SSH access to the robot's terminal. This would require a WebSocket proxy.

---

## 3. Servo Motor Data

### Current Frontend Behavior
The Servos page (`frontend/src/pages/Servos.tsx`) displays:
- 6 servos (configurable)
- Position (degrees)
- Temperature
- Voltage
- Torque enabled/disabled
- Alert levels (normal/warning/critical)

### What You Need from TonyPi

**HiWonder Servo Library**

The TonyPi uses HiWonder's serial bus servos. You need:

```python
# Typically located at /home/pi/TonyPi/HiwonderSDK/
from hiwonder import Board

# Read servo position
position = Board.getBusServoPulse(servo_id)

# Read servo temperature (if supported)
# Note: Not all HiWonder servos report temperature

# In the actual tonypi_client.py, modify get_servo_status():
def get_servo_status(self):
    from hiwonder import Board
    
    servo_ids = [1, 2, 3, 4, 5, 6]  # TonyPi's 6 servos
    servo_data = {}
    
    for sid in servo_ids:
        try:
            pulse = Board.getBusServoPulse(sid)
            # Convert pulse to angle (typical range: 500-2500 pulse = -90 to 90 degrees)
            angle = (pulse - 1500) * 0.09  # Approximate conversion
            
            servo_data[f"servo_{sid}"] = {
                "id": sid,
                "name": f"Servo {sid}",
                "position": angle,
                "temperature": 45.0,  # If not available, use estimate
                "voltage": 5.0,
                "torque_enabled": True,
                "alert_level": "normal"
            }
        except Exception as e:
            pass
    
    return servo_data
```

**Files to fetch from TonyPi**:
```
/home/pi/TonyPi/HiwonderSDK/hiwonder/Board.py
/home/pi/TonyPi/HiwonderSDK/hiwonder/__init__.py
```

---

## 4. IMU/Sensor Data

### Current Frontend Behavior
The Sensors page displays:
- Accelerometer (X, Y, Z)
- Gyroscope (X, Y, Z)
- Ultrasonic distance
- Light level

### What You Need from TonyPi

**IMU Sensor (MPU6050)**

TonyPi typically uses MPU6050 IMU. Code location:

```python
# /home/pi/TonyPi/HiwonderSDK/hiwonder/
from hiwonder import Board

# Read IMU data
def read_imu():
    # Board.getIMU() returns accelerometer and gyroscope data
    imu_data = Board.getIMU()
    return {
        "accelerometer_x": imu_data[0],
        "accelerometer_y": imu_data[1],
        "accelerometer_z": imu_data[2],
        "gyroscope_x": imu_data[3],
        "gyroscope_y": imu_data[4],
        "gyroscope_z": imu_data[5],
    }
```

**Ultrasonic Sensor**:
```python
from hiwonder import Sonar

sonar = Sonar.Sonar()
distance = sonar.getDistance()  # Returns distance in cm
```

**Light Sensor** (if available):
```python
# Light sensor varies by TonyPi version
# Check /home/pi/TonyPi/HiwonderSDK/ for available sensors
```

---

## 5. Files to Fetch from TonyPi

Here's a list of files you should retrieve from your TonyPi robot to align with the current system:

### Priority 1: SDK Files (Required for real sensor data)
```
/home/pi/TonyPi/HiwonderSDK/hiwonder/
├── __init__.py
├── Board.py        # Main board control (servos, IMU)
├── Sonar.py        # Ultrasonic sensor
├── ActionGroupControl.py  # Pre-defined motions
└── PWMServo.py     # PWM servo control
```

### Priority 2: Camera Files (Required for video feed)
```
/home/pi/TonyPi/CameraCalibration/
├── camera_calibration.py
└── calibration_config.yaml

/home/pi/TonyPi/Functions/
├── CameraCapture/
│   └── camera_capture.py
└── Running.py      # Main robot control loop
```

### Priority 3: Action Files (Optional for movement)
```
/home/pi/TonyPi/ActionGroups/
├── stand.d6a
├── walk_forward.d6a
├── walk_backward.d6a
├── turn_left.d6a
├── turn_right.d6a
└── ... (other action files)
```

---

## 6. Quick Integration Steps

### Step 1: Test with Simulator First
```bash
# Start the monitoring system
docker-compose up -d

# Run the enhanced simulator
cd robot_client
python simulator.py --mode all-features

# Open frontend and verify all pages work
```

### Step 2: Prepare TonyPi
```bash
# SSH to TonyPi
ssh pi@<tonypi-ip>

# Copy the robot_client folder
scp -r robot_client/ pi@<tonypi-ip>:/home/pi/monitoring/

# Install dependencies
pip install paho-mqtt psutil
```

### Step 3: Modify tonypi_client.py for Real Hardware
1. Import HiWonder SDK
2. Replace simulated sensor reads with real Board calls
3. Start camera streaming
4. Test each feature individually

### Step 4: Run Real Client
```bash
# On TonyPi
cd /home/pi/monitoring/robot_client
python tonypi_client.py --broker <your-server-ip> --port 1883
```

---

## 7. Simulator Test Modes

The enhanced simulator supports multiple test modes:

```bash
# Normal operation
python simulator.py

# High CPU/Memory load (test Monitoring alerts)
python simulator.py --mode high-load

# Servo temperature warnings (test Servos alerts)
python simulator.py --mode servo-warning

# Low battery scenario
python simulator.py --mode low-battery

# Job progress demo (test Jobs page)
python simulator.py --mode job-demo

# Continuous movement (test location updates)
python simulator.py --mode movement-demo

# Interactive command mode
python simulator.py --interactive
```

---

## Summary: What to Fetch from TonyPi

| Feature | Files to Fetch | Location on TonyPi |
|---------|---------------|-------------------|
| Camera | camera_capture.py, mjpeg config | /home/pi/TonyPi/Functions/CameraCapture/ |
| Servos | Board.py | /home/pi/TonyPi/HiwonderSDK/hiwonder/ |
| IMU | Board.py (getIMU) | /home/pi/TonyPi/HiwonderSDK/hiwonder/ |
| Ultrasonic | Sonar.py | /home/pi/TonyPi/HiwonderSDK/hiwonder/ |
| Actions | ActionGroupControl.py | /home/pi/TonyPi/HiwonderSDK/hiwonder/ |

Would you like me to help create a script to automatically integrate the HiWonder SDK with the tonypi_client.py?
