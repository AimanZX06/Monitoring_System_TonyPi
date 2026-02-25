# Python Classes Evidence

## Quick Reference: Actual Python Classes in the Codebase

This document provides evidence that Python classes DO EXIST in the codebase, addressing your lecturer's concern.

---

## Backend SQLAlchemy Model Classes

### 1. User Class (models/user.py:37)
```python
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="viewer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
```

### 2. Robot Class (models/robot.py:43)
```python
class Robot(Base):
    __tablename__ = "robots"
    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    location = Column(JSON)
    status = Column(String(20), default="offline")
    ip_address = Column(String(50))
    camera_url = Column(String(200))
    battery_threshold_low = Column(Float, default=20.0)
    battery_threshold_critical = Column(Float, default=10.0)
    temp_threshold_warning = Column(Float, default=70.0)
    temp_threshold_critical = Column(Float, default=80.0)
    settings = Column(JSON)
    last_seen = Column(DateTime)
    is_active = Column(Boolean, default=True)
```

### 3. Alert Class (models/alert.py:48)
```python
class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(String, index=True)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text)
    source = Column(String(100))
    value = Column(Float)
    threshold = Column(Float)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String)
    acknowledged_at = Column(DateTime)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    details = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
```

### 4. AlertThreshold Class (models/alert.py:198)
```python
class AlertThreshold(Base):
    __tablename__ = "alert_thresholds"
    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(String)
    metric_type = Column(String(50), nullable=False)
    warning_threshold = Column(Float)
    critical_threshold = Column(Float)
    is_active = Column(Boolean, default=True)
```

---

## Backend Service Classes

### 5. MQTTClient Class (mqtt/mqtt_client.py:103)
```python
class MQTTClient:
    def __init__(self):
        self.broker_host = os.getenv("MQTT_BROKER_HOST", "localhost")
        self.broker_port = int(os.getenv("MQTT_BROKER_PORT", 1883))
        self.username = os.getenv("MQTT_USERNAME")
        self.password = os.getenv("MQTT_PASSWORD")
        self.client = mqtt.Client()
        self.topics = [...]
        
    def on_connect(self, client, userdata, flags, rc): ...
    def on_message(self, client, userdata, msg): ...
    def handle_sensor_data(self, topic, payload): ...
    def publish(self, topic, payload): ...
    def start(self): ...
    def stop(self): ...
```

### 6. InfluxClient Class (database/influx_client.py:68)
```python
class InfluxClient:
    def __init__(self):
        self.url = os.getenv("INFLUX_URL", "http://localhost:8086")
        self.token = os.getenv("INFLUX_TOKEN")
        self.org = os.getenv("INFLUX_ORG", "tonypi")
        self.bucket = os.getenv("INFLUX_BUCKET", "robot_data")
        self.client = InfluxDBClient(...)
        
    def write_validated_sensor(self, robot_id, sensor_type, value): ...
    def write_servo_data(self, robot_id, servo_id, data): ...
    def query_recent_data(self, measurement, duration, robot_id): ...
    def query_range(self, start, end, measurement): ...
```

### 7. GeminiAnalytics Class (services/gemini_analytics.py:93)
```python
class GeminiAnalytics:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = genai.GenerativeModel('gemini-pro')
        
    def generate_report(self, data): ...
    def analyze_telemetry(self, metrics): ...
    def suggest_actions(self, alerts): ...
```

---

## Robot Client Classes

### 8. TonyPiRobotClient Class (robot_client/tonypi_client.py:127)
```python
class TonyPiRobotClient:
    def __init__(self, robot_id, broker_host, ...):
        self.robot_id = robot_id
        self.mqtt_client = mqtt.Client()
        self.board = Board()
        self.sensors = {}
        self.running = False
        
    def connect(self): ...
    def publish_telemetry(self): ...
    def handle_command(self, cmd): ...
    def start(self): ...
    def stop(self): ...
```

### 9. LightSensor Class (robot_client/tonypi_client.py:85)
```python
class LightSensor:
    def __init__(self, pin):
        self.pin = pin
        
    def is_dark(self): ...
    def cleanup(self): ...
```

### 10. VisionController Class (dont_touch_integration/modules/vision_module.py:38)
```python
class VisionController:
    def __init__(self):
        self.model = YOLO('yolov8n.pt')
        self.is_locked = False
        self.last_action_time = 0
        
    def detect(self, frame): ...
    def get_navigation_command(self, cc, width): ...
    def run_birdcage(self, frame): ...
```

### 11. UltrasonicSensor Class (dont_touch_integration/modules/ultrasonic_sensor.py:16)
```python
class UltrasonicSensor:
    def __init__(self, low_pin, echo_pin, obstacle_threshold=30):
        self.low_pin = low_pin
        self.echo_pin = echo_pin
        self.obstacle_threshold = obstacle_threshold
        self.distance_history = []
        
    def get_distance(self): ...
    def is_obstacle_detected(self): ...
    def cleanup(self): ...
```

### 12. RobotActions Class (dont_touch_integration/modules/action_module.py:41)
```python
class RobotActions:
    def __init__(self):
        self.rc_board = Board()
        self.board = Controller()
        
    def run_direct_patroling(self): ...
    def move_forward(self): ...
    def turn_left(self): ...
    def turn_right(self): ...
    def stop(self): ...
```

---

## Hardware Interface Classes (HiWonder SDK)

### 13. Board Class (robot_client/hiwonder/ros_robot_controller_sdk.py:186)
```python
class Board:
    def __init__(self, serial_port='/dev/ttyUSB0'):
        self.serial_port = serial_port
        self.baudrate = 115200
        
    def set_servo(self, servo_id, angle): ...
    def get_servo(self, servo_id): ...
    def set_motor(self, motor_id, speed): ...
```

### 14. Controller Class (robot_client/hiwonder/Controller.py:72)
```python
class Controller:
    def __init__(self, board):
        self.board = board
        
    def set_servo_position(self, servo_id, position, time): ...
    def get_servo_position(self, servo_id): ...
```

### 15. Sonar Class (robot_client/hiwonder/Sonar.py:77)
```python
class Sonar:
    def __init__(self, trigger_pin, echo_pin):
        self.trigger_pin = trigger_pin
        self.echo_pin = echo_pin
        
    def get_distance(self): ...
    def cleanup(self): ...
```

---

## Summary

| Location | Number of Classes |
|----------|------------------|
| backend/models/ | 7 classes |
| backend/mqtt/ | 1 class |
| backend/services/ | 1 class |
| backend/database/ | 1 class |
| robot_client/ | 5 classes |
| dont_touch_integration/modules/ | 6 classes |
| robot_client/hiwonder/ | 5 classes |
| **TOTAL** | **26+ Python Classes** |

**Conclusion**: The codebase contains many well-defined Python classes. The original class diagram showed conceptual/architectural components rather than actual implementation classes.
