"""
=============================================================================
MQTT Client - Real-Time Message Broker Integration
=============================================================================

This module handles all MQTT communication for the TonyPi monitoring system.
It subscribes to robot telemetry topics and processes incoming messages,
storing data in InfluxDB (time-series) and PostgreSQL (relational).

MQTT ARCHITECTURE:
    ┌─────────────────────────────────────────────────────────────────────┐
    │                     MQTT Message Flow                                │
    ├─────────────────────────────────────────────────────────────────────┤
    │                                                                      │
    │  TonyPi Robot ──► Mosquitto Broker ──► Backend MQTTClient           │
    │       │                  │                     │                     │
    │       │                  │                     ├──► InfluxDB         │
    │  Publishes:              │                     │    (time-series)    │
    │  - tonypi/sensors/*      │                     │                     │
    │  - tonypi/status/*       │                     └──► PostgreSQL       │
    │  - tonypi/battery        │                          (alerts, logs)   │
    │  - tonypi/servos/*       │                                          │
    │  - tonypi/job/*          │                                          │
    │                          │                                          │
    │  Frontend ◄──────────────┘                                          │
    │  (WebSocket on port 9001)                                           │
    └─────────────────────────────────────────────────────────────────────┘

SUBSCRIBED TOPICS:
    tonypi/sensors/+     - Sensor readings (IMU, temperature, etc.)
    tonypi/status/+      - Robot status and system info
    tonypi/location      - Robot position updates
    tonypi/battery       - Battery level and voltage
    tonypi/servos/+      - Servo motor data (position, temp, voltage)
    tonypi/job/+         - Job/task progress events
    tonypi/scan/+        - QR code scan events
    tonypi/vision/+      - Vision detection results
    tonypi/logs/+        - Robot terminal/console logs
    tonypi/commands/response - Command acknowledgements

ALERT GENERATION:
    The MQTT client automatically generates alerts when sensor values
    exceed configured thresholds. Alerts are stored in PostgreSQL.

KEY CLASSES:
    MQTTClient - Main client class handling all MQTT operations
    
GLOBAL INSTANCE:
    mqtt_client - Singleton instance used throughout the application
"""

# =============================================================================
# IMPORTS
# =============================================================================

# Paho MQTT - Python MQTT client library
import paho.mqtt.client as mqtt

# Standard library
import json           # JSON parsing for MQTT payloads
import asyncio        # Async support for start/stop
import os             # Environment variable access
from dotenv import load_dotenv  # Load .env file

# Database clients
from database.influx_client import influx_client  # Time-series storage
from database.database import SessionLocal         # PostgreSQL sessions

# SQLAlchemy models
from models.robot import Robot              # Robot registration
from models.system_log import SystemLog     # Event logging
from models.alert import Alert, AlertThreshold  # Alert management

# Date/time utilities
from datetime import datetime, timedelta

# Load environment variables from .env file
load_dotenv()

# =============================================================================
# DEFAULT ALERT THRESHOLDS
# =============================================================================
# These defaults are used when no thresholds are configured in the database.
# Users can customize thresholds via the Alerts page in the frontend.
#
# FORMAT: {'warning': value, 'critical': value}
# - For CPU/memory/temp: Alert when value goes ABOVE threshold
# - For battery/voltage: Alert when value goes BELOW threshold

DEFAULT_THRESHOLDS = {
    'cpu': {'warning': 70, 'critical': 90},           # CPU percentage
    'memory': {'warning': 75, 'critical': 90},        # Memory percentage
    'temperature': {'warning': 60, 'critical': 75},   # CPU temperature °C
    'battery': {'warning': 30, 'critical': 15},       # Battery % (LOW threshold)
    'servo_temp': {'warning': 50, 'critical': 70},    # Servo temperature °C
    'servo_voltage': {'warning': 5.5, 'critical': 5.0},  # Servo voltage (LOW threshold)
}

# =============================================================================
# MQTT CLIENT CLASS
# =============================================================================

class MQTTClient:
    def __init__(self):
        self.broker_host = os.getenv("MQTT_BROKER_HOST", "localhost")
        self.broker_port = int(os.getenv("MQTT_BROKER_PORT", 1883))
        self.username = os.getenv("MQTT_USERNAME")
        self.password = os.getenv("MQTT_PASSWORD")
        
        self.client = mqtt.Client()
        self.client.username_pw_set(self.username, self.password)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        
        # Topic subscriptions
        self.topics = [
            "tonypi/sensors/+",  # All sensor data
            "tonypi/status/+",   # Robot status
            "tonypi/location",   # Robot location
            "tonypi/battery",    # Battery status
            "tonypi/commands/response",  # Command responses
            "tonypi/scan/+",     # QR scan events from robots
            "tonypi/job/+",      # Job/progress events
            "tonypi/servos/+",   # Servo status data
            "tonypi/vision/+",   # Vision detection data
            "tonypi/logs/+",     # Robot terminal logs
            "tonypi/emergency_stop/response"  # Emergency stop acknowledgements
        ]

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("MQTT: Connected to broker")
            # Subscribe to all topics
            for topic in self.topics:
                client.subscribe(topic)
                print(f"MQTT: Subscribed to {topic}")
        else:
            print(f"MQTT: Failed to connect, return code {rc}")

    def on_message(self, client, userdata, msg):
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            print(f"MQTT: Received message on {topic}: {payload}")
            
            # Route message based on topic
            if topic.startswith("tonypi/sensors/"):
                self.handle_sensor_data(topic, payload)
            elif topic.startswith("tonypi/status/"):
                self.handle_status_data(topic, payload)
            elif topic == "tonypi/location":
                self.handle_location_data(payload)
            elif topic == "tonypi/battery":
                self.handle_battery_data(payload)
            elif topic.startswith("tonypi/scan/"):
                self.handle_scan(topic, payload)
            elif topic.startswith("tonypi/job/"):
                self.handle_job_event(topic, payload)
            elif topic.startswith("tonypi/servos/"):
                self.handle_servo_data(topic, payload)
            elif topic.startswith("tonypi/vision/"):
                self.handle_vision_data(topic, payload)
            elif topic.startswith("tonypi/logs/"):
                self.handle_log_data(topic, payload)
            elif topic == "tonypi/commands/response":
                self.handle_command_response(payload)
            elif topic == "tonypi/emergency_stop/response":
                self.handle_emergency_stop_response(payload)
                
        except Exception as e:
            print(f"MQTT: Error processing message: {e}")

    def handle_sensor_data(self, topic, payload):
        """Handle sensor data and store in InfluxDB with validation"""
        # Extract robot_id from topic (tonypi/sensors/{robot_id})
        robot_id_from_topic = topic.split('/')[-1]
        
        # Get sensor_type from payload (the actual sensor type like "accelerometer_x")
        sensor_type = payload.get("sensor_type", "unknown")
        robot_id = payload.get("robot_id", robot_id_from_topic)
        value = payload.get("value")
        unit = payload.get("unit")
        timestamp = payload.get("timestamp")
        
        # Use validated sensor write for known sensor types
        if value is not None:
            success = influx_client.write_validated_sensor(
                robot_id=robot_id,
                sensor_type=sensor_type,
                value=value,
                timestamp=timestamp,
                unit=unit
            )
            if success:
                print(f"MQTT: Sensor {sensor_type} = {value} from {robot_id}")
        else:
            # Fallback for legacy format without explicit value field
            measurement = "sensors"
            tags = {
                "robot_id": robot_id,
                "sensor_type": sensor_type
            }
            
            # Extract fields - exclude metadata keys
            fields = {
                key: value for key, value in payload.items() 
                if key not in ["robot_id", "timestamp", "sensor_type"]
            }
            
            # Ensure we have at least a value field
            if not fields:
                fields = {"value": 0}
            
            # Store in InfluxDB
            influx_client.write_sensor_data(measurement, tags, fields)

    def handle_status_data(self, topic, payload):
        """Handle robot status data"""
        status_type = topic.split('/')[-1]
        robot_id = payload.get("robot_id", "tonypi_01")
        
        measurement = "robot_status"
        tags = {
            "robot_id": robot_id,
            "status_type": status_type
        }
        
        # Extract the status value and handle nested system_info
        fields = {
            "status": payload.get("status", "unknown")
        }
        
        # Add IP address and camera URL if present
        if "ip_address" in payload:
            fields["ip_address"] = payload.get("ip_address")
        if "camera_url" in payload:
            fields["camera_url"] = payload.get("camera_url")
        
        # Add system_info fields if present (including booleans)
        if "system_info" in payload and isinstance(payload["system_info"], dict):
            system_info = payload["system_info"]
            for key, value in system_info.items():
                if isinstance(value, (int, float, str, bool)):
                    fields[f"system_{key}"] = value
            
            # Check thresholds for CPU, memory, and temperature
            if "cpu_percent" in system_info:
                cpu_value = float(system_info["cpu_percent"])
                self._check_and_create_alert(robot_id, 'cpu', cpu_value, 'cpu')
            
            if "memory_percent" in system_info:
                memory_value = float(system_info["memory_percent"])
                self._check_and_create_alert(robot_id, 'memory', memory_value, 'memory')
            
            # Check temperature (could be in 'temperature' or 'cpu_temperature')
            temp_value = system_info.get("cpu_temperature") or system_info.get("temperature")
            if temp_value is not None:
                self._check_and_create_alert(robot_id, 'temperature', float(temp_value), 'cpu_temp')
            
            print(f"MQTT: Status system_info fields: {list(system_info.keys())}")
        
        print(f"MQTT: Writing status fields: {list(fields.keys())}")
        influx_client.write_sensor_data(measurement, tags, fields)
        
        # Log robot status update
        self._log_system_event(
            level='INFO',
            category='robot',
            message=f"Robot {robot_id} status: {payload.get('status', 'unknown')}",
            robot_id=robot_id,
            details={'status_type': status_type, 'ip': payload.get('ip_address')}
        )
        
        # Update robot in PostgreSQL with IP and camera URL
        ip_address = payload.get("ip_address")
        camera_url = payload.get("camera_url")
        self._update_robot_status(robot_id, payload.get("status", "online"), ip_address, camera_url)

    def handle_location_data(self, payload):
        """Handle robot location data with validation"""
        robot_id = payload.get("robot_id", "tonypi_01")
        x = payload.get("x", 0)
        y = payload.get("y", 0)
        z = payload.get("z", 0)
        
        # Use validated location write
        success = influx_client.write_location(
            robot_id=robot_id,
            x=x,
            y=y,
            z=z
        )
        
        if success:
            print(f"MQTT: Location ({x:.2f}, {y:.2f}, {z:.2f}) from {robot_id}")

    def handle_battery_data(self, payload):
        """Handle battery status data with validation"""
        robot_id = payload.get("robot_id", "tonypi_01")
        percentage = payload.get("percentage", 0)
        voltage = payload.get("voltage", 0)
        charging = payload.get("charging", False)
        
        # Use validated battery write
        success = influx_client.write_battery_status(
            robot_id=robot_id,
            percentage=percentage,
            voltage=voltage,
            charging=charging
        )
        
        if success:
            print(f"MQTT: Battery {percentage:.1f}% ({voltage:.2f}V) from {robot_id}")
        
        # Check battery threshold (low battery alert) - only if not charging
        if not charging:
            self._check_and_create_alert(
                robot_id=robot_id,
                metric_type='battery',
                value=percentage,
                source='battery',
                is_low_threshold=True  # Alert when battery goes LOW
            )

    def handle_command_response(self, payload):
        """Handle command responses"""
        robot_id = payload.get('robot_id', 'unknown')
        command = payload.get('command', payload.get('type', 'unknown'))
        status = payload.get('status', 'unknown')
        success = payload.get('success', False)
        message = payload.get('message', '')
        
        print(f"Command response received: {payload}")
        
        # Log command response with detailed information
        level = 'INFO' if success else 'WARNING'
        self._log_system_event(
            level=level,
            category='command',
            message=f"Command '{command}' {status}: {message}",
            robot_id=robot_id,
            details={
                'command': command,
                'status': status,
                'success': success,
                'response': payload
            }
        )
    
    def handle_emergency_stop_response(self, payload):
        """Handle emergency stop acknowledgement from robot"""
        robot_id = payload.get('robot_id', 'unknown')
        command_id = payload.get('command_id', payload.get('id'))
        success = payload.get('success', False)
        message = payload.get('message', '')
        command_type = payload.get('type', 'emergency_stop')
        
        print(f"Emergency stop response received: {payload}")
        
        # Log with appropriate severity
        level = 'WARNING' if command_type == 'emergency_stop' else 'INFO'
        category = 'emergency' if command_type == 'emergency_stop' else 'command'
        
        self._log_system_event(
            level=level,
            category=category,
            message=f"Emergency stop {'activated' if command_type == 'emergency_stop' else 'cleared (resumed)'}: {message}",
            robot_id=robot_id,
            details={
                'command_id': command_id,
                'type': command_type,
                'success': success,
                'response': payload
            }
        )
        
        # Create alert for emergency stop activation
        if command_type == 'emergency_stop' and success:
            self._create_emergency_alert(robot_id, payload.get('reason', 'Unknown'))
    
    def _create_emergency_alert(self, robot_id: str, reason: str):
        """Create an alert for emergency stop activation"""
        db = SessionLocal()
        try:
            alert = Alert(
                robot_id=robot_id,
                alert_type='emergency_stop',
                severity='critical',
                title=f"Emergency Stop Activated on {robot_id}",
                message=f"Emergency stop triggered: {reason}",
                source='emergency_system',
                value=1.0,
                threshold=0.0,
                details={
                    'reason': reason,
                    'timestamp': datetime.utcnow().isoformat()
                }
            )
            
            db.add(alert)
            db.commit()
            print(f"Alert: Created emergency stop alert for {robot_id}")
            
        except Exception as e:
            print(f"Error creating emergency alert: {e}")
            db.rollback()
        finally:
            db.close()

    def handle_scan(self, topic, payload):
        """Handle QR scan events from robots.

        Expected payload: {"robot_id": "tonypi_01", "qr": "QR12345", "timestamp": "..."}
        Backend will lookup mock item data and publish item info back to the robot on
        topic: tonypi/items/{robot_id}
        It will also update in-memory job progress via job_store.
        """
        # Import job_store and mock_items from project root modules
        try:
            from job_store import job_store
        except Exception as e:
            print(f"JobStore: Failed to import job_store: {e}")
            job_store = None

        try:
            from mock_data import mock_items
        except Exception:
            try:
                from backend.mock_data import mock_items
            except Exception:
                mock_items = {}

        robot_id = payload.get('robot_id') or topic.split('/')[-1]
        qr = payload.get('qr')

        # Lookup mock item
        item_info = mock_items.get(qr)
        if not item_info:
            # If not found, send a not found response
            response = {
                "robot_id": robot_id,
                "qr": qr,
                "found": False,
                "message": "Item not found in mock DB",
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            response = {
                "robot_id": robot_id,
                "qr": qr,
                "found": True,
                "item": item_info,
                "timestamp": datetime.utcnow().isoformat()
            }

        # Publish item info back to robot
        topic_out = f"tonypi/items/{robot_id}"
        try:
            self.client.publish(topic_out, json.dumps(response))
            print(f"MQTT: Published item info to {topic_out}: {response}")
        except Exception as e:
            print(f"MQTT: Error publishing item info: {e}")

        # Log QR scan event
        self._log_system_event(
            level='INFO',
            category='job',
            message=f"QR code scanned: {qr} - {'Found' if item_info else 'Not found'}",
            robot_id=robot_id,
            details={'qr': qr, 'found': bool(item_info), 'item': item_info}
        )
        
        # Update job store: mark an item processed (only if job exists)
        try:
            if job_store is not None:
                # Only record item if there's an active job
                js = job_store.get(robot_id)
                if js is not None:
                    job_store.record_item(robot_id, item_info if item_info else {'qr': qr})
        except Exception as e:
            print(f"JobStore: Error updating job store: {e}")

    def handle_job_event(self, topic, payload):
        """Handle job progress events published by robots.

        Expected payload from TonyPi robot:
        {
            "robot_id": "tonypi_01",
            "task_name": "find_red_ball",
            "status": "started" | "in_progress" | "done" | "cancelled" | "failed",
            "phase": "scanning" | "searching" | "executing" | "done",
            "progress_percent": 0-100,
            "elapsed_time": 12.5,           # seconds since job started
            "estimated_duration": 30.0,     # expected total duration
            "action_duration": 5.2,         # how long the action took (on completion)
            "success": true,                # whether task succeeded (on completion)
            "cancel_reason": "obstacle"     # reason for cancellation (if cancelled)
        }
        
        Also accepts legacy format: {"robot_id":..., "percent": 42, "status": "completed"}
        """
        try:
            from job_store import job_store
        except Exception as e:
            print(f"JobStore: Failed to import job_store: {e}")
            job_store = None

        robot_id = payload.get('robot_id') or topic.split('/')[-1]
        
        # Accept both field names for progress
        percent = payload.get('progress_percent') or payload.get('percent')
        
        # Accept various status values
        status = payload.get('status', '').lower()
        
        # Extra fields from TonyPi
        task_name = payload.get('task_name')
        phase = payload.get('phase')
        elapsed_time = payload.get('elapsed_time')
        estimated_duration = payload.get('estimated_duration')
        action_duration = payload.get('action_duration')
        success = payload.get('success')
        cancel_reason = payload.get('cancel_reason')
        
        # Item tracking fields
        items_done = payload.get('items_done')
        items_total = payload.get('items_total')
        
        # Normalize status: accept "done" as "completed"
        is_completed = status in ('completed', 'done')
        is_started = status in ('started', 'start')
        is_cancelled = status in ('cancelled', 'canceled', 'stopped')
        is_failed = status == 'failed'
        is_in_progress = status in ('working', 'in_progress', 'in-progress', 'active')
        
        # Build details dict for logging
        details = {
            'status': status,
            'percent': percent,
            'task_name': task_name,
            'phase': phase,
            'elapsed_time': elapsed_time,
            'estimated_duration': estimated_duration
        }
        
        # Log job events
        if is_started:
            self._log_system_event(
                level='INFO',
                category='job',
                message=f"Job started: {task_name or 'unknown task'}",
                robot_id=robot_id,
                details=details
            )
        elif is_completed:
            self._log_system_event(
                level='INFO',
                category='job',
                message=f"Job completed: {task_name or 'unknown task'}" + 
                        (f" (success: {success})" if success is not None else "") +
                        (f" in {action_duration:.1f}s" if action_duration else ""),
                robot_id=robot_id,
                details={**details, 'action_duration': action_duration, 'success': success}
            )
        elif is_cancelled:
            self._log_system_event(
                level='WARNING',
                category='job',
                message=f"Job cancelled: {task_name or 'unknown task'}" +
                        (f" - {cancel_reason}" if cancel_reason else ""),
                robot_id=robot_id,
                details={**details, 'cancel_reason': cancel_reason}
            )
        elif is_failed:
            self._log_system_event(
                level='ERROR',
                category='job',
                message=f"Job failed: {task_name or 'unknown task'}",
                robot_id=robot_id,
                details=details
            )
        elif percent is not None and int(percent) % 25 == 0:  # Log at 25%, 50%, 75%, 100%
            self._log_system_event(
                level='INFO',
                category='job',
                message=f"Job progress: {percent:.0f}%" +
                        (f" - {phase}" if phase else ""),
                robot_id=robot_id,
                details=details
            )
        
        # Update job store
        try:
            if job_store is not None:
                # Handle job start
                if is_started:
                    job_store.start_job(robot_id, total_items=items_total or 0)
                    if task_name:
                        job_store.update_task_name(robot_id, task_name)
                
                # For in-progress updates, ensure job exists
                if is_in_progress and (items_done is not None or items_total is not None):
                    # Check if job exists, if not start one
                    current_job = job_store.get(robot_id)
                    if not current_job:
                        job_store.start_job(robot_id, total_items=items_total or 0)
                        if task_name:
                            job_store.update_task_name(robot_id, task_name)
                
                # Update progress
                if percent is not None:
                    job_store.set_progress(robot_id, percent)
                
                # Update items_done and items_total if provided (only for in-progress jobs)
                if (is_started or is_in_progress) and (items_done is not None or items_total is not None):
                    if hasattr(job_store, 'update_items'):
                        job_store.update_items(robot_id, items_done=items_done, items_total=items_total)
                
                # Update timing fields if provided
                if elapsed_time is not None or estimated_duration is not None or action_duration is not None:
                    if hasattr(job_store, 'update_timing'):
                        job_store.update_timing(
                            robot_id,
                            elapsed_time=elapsed_time,
                            estimated_duration=estimated_duration,
                            action_duration=action_duration
                        )
                
                # Update phase if method exists
                if phase and hasattr(job_store, 'update_phase'):
                    job_store.update_phase(robot_id, phase)
                
                # Handle completion
                if is_completed:
                    job_store.finish_job(robot_id, success=success if success is not None else True)
                
                # Handle cancellation
                if is_cancelled:
                    job_store.cancel_job(robot_id, reason=cancel_reason)
                
                # Handle failure
                if is_failed:
                    job_store.fail_job(robot_id)
                        
        except Exception as e:
            print(f"JobStore: Error handling job event: {e}")

    def handle_servo_data(self, topic, payload):
        """Handle servo status data and store in InfluxDB with validation"""
        robot_id = payload.get("robot_id", topic.split('/')[-1])
        servos = payload.get("servos", {})
        
        # Store each servo's data using validated method
        for servo_key, servo_info in servos.items():
            servo_id = servo_info.get("id", 0)
            servo_name = servo_info.get("name", servo_key)
            position = servo_info.get("position", 0)
            temperature = servo_info.get("temperature", 0)
            voltage = servo_info.get("voltage", 0)
            torque_enabled = servo_info.get("torque_enabled", False)
            alert_level = servo_info.get("alert_level", "normal")
            
            # Check servo temperature threshold
            if temperature > 0:
                self._check_and_create_alert(
                    robot_id=robot_id,
                    metric_type='servo_temp',
                    value=temperature,
                    source=f"servo_{servo_id}_{servo_name}"
                )
            
            # Check servo voltage threshold (low voltage alert)
            if voltage > 0:
                self._check_and_create_alert(
                    robot_id=robot_id,
                    metric_type='servo_voltage',
                    value=voltage,
                    source=f"servo_{servo_id}_{servo_name}",
                    is_low_threshold=True  # Alert when voltage goes LOW
                )
            
            # Use validated servo write
            influx_client.write_servo_data(
                robot_id=robot_id,
                servo_id=servo_id,
                servo_name=servo_name,
                position=position,
                temperature=temperature,
                voltage=voltage,
                torque_enabled=torque_enabled,
                alert_level=alert_level
            )
        
        print(f"MQTT: Stored servo data for {len(servos)} servos from {robot_id}")

    def handle_vision_data(self, topic, payload):
        """Handle vision detection data and store in InfluxDB"""
        robot_id = payload.get("robot_id", topic.split('/')[-1])
        
        # Extract vision data
        detection = payload.get("detection", False)
        state = payload.get("state", "UNKNOWN")
        label = payload.get("label")
        confidence = payload.get("confidence")
        bbox = payload.get("bbox")  # dict with x1, y1, x2, y2
        center_x = payload.get("center_x")
        nav_cmd = payload.get("navigation_command")
        error = payload.get("error")
        is_locked = payload.get("is_locked", False)
        
        # Use the new validated method from influx_client
        success = influx_client.write_vision_data(
            robot_id=robot_id,
            detection=detection,
            state=state,
            label=label,
            confidence=confidence,
            bbox=bbox,
            center_x=center_x,
            nav_cmd=nav_cmd,
            error=error,
            is_locked=is_locked
        )
        
        if detection and label:
            print(f"MQTT: Vision detection from {robot_id}: {label} ({confidence:.2f if confidence else 0:.2f}) - {nav_cmd}")
            
            # Log significant vision detections
            self._log_system_event(
                level='INFO',
                category='vision',
                message=f"Detected '{label}' with {confidence:.1%} confidence - {nav_cmd or 'no navigation'}",
                robot_id=robot_id,
                details={
                    'label': label,
                    'confidence': confidence,
                    'state': state,
                    'navigation_command': nav_cmd,
                    'is_locked': is_locked
                }
            )
        
    def handle_log_data(self, topic, payload):
        """Handle robot terminal log data and store in InfluxDB"""
        robot_id = payload.get("robot_id", topic.split('/')[-1])
        
        # Extract log data
        level = payload.get("level", "INFO")
        message = payload.get("message", "")
        source = payload.get("source", "main")
        timestamp = payload.get("timestamp")
        
        # Use the new validated method from influx_client
        success = influx_client.write_log_entry(
            robot_id=robot_id,
            level=level,
            message=message,
            source=source,
            timestamp=timestamp
        )
        
        # Also store in PostgreSQL for searchable logs
        self._log_system_event(
            level=level,
            category=f"robot_{source}",
            message=message,
            robot_id=robot_id,
            details={"source": source, "timestamp": timestamp}
        )
        
        # Print important logs
        if level in ["WARNING", "ERROR", "CRITICAL"]:
            print(f"MQTT: Robot log [{level}] from {robot_id}/{source}: {message}")

    def on_disconnect(self, client, userdata, rc):
        print("MQTT: Disconnected from broker")

    async def start(self):
        """Start MQTT client"""
        try:
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
            print(f"MQTT: Started client, connecting to {self.broker_host}:{self.broker_port}")
        except Exception as e:
            print(f"MQTT: Error starting client: {e}")

    async def stop(self):
        """Stop MQTT client"""
        self.client.loop_stop()
        self.client.disconnect()
        print("MQTT: Client stopped")

    def publish_command(self, command_topic: str, command_data: dict):
        """Publish a command to the robot"""
        try:
            payload = json.dumps(command_data)
            self.client.publish(command_topic, payload)
            return True
        except Exception as e:
            print(f"MQTT: Error publishing command: {e}")
            return False

    async def publish(self, topic: str, payload: str):
        """Async publish method"""
        try:
            result = self.client.publish(topic, payload)
            # Wait a moment for the publish to complete
            await asyncio.sleep(0.1)
            return result
        except Exception as e:
            print(f"MQTT: Error publishing to {topic}: {e}")
            raise
    
    def _update_robot_status(self, robot_id: str, status: str, ip_address: str = None, camera_url: str = None):
        """Update or create robot in PostgreSQL"""
        db = SessionLocal()
        try:
            robot = db.query(Robot).filter(Robot.robot_id == robot_id).first()
            
            if not robot:
                # Create new robot
                robot = Robot(
                    robot_id=robot_id,
                    name=robot_id,
                    status=status,
                    last_seen=datetime.utcnow()
                )
                db.add(robot)
                print(f"Created new robot in database: {robot_id}")
            else:
                # Update existing robot
                robot.status = status
                robot.last_seen = datetime.utcnow()
            
            # Update IP address and camera URL if provided
            if ip_address:
                robot.ip_address = ip_address
            if camera_url:
                robot.camera_url = camera_url
            
            db.commit()
        except Exception as e:
            print(f"Error updating robot status: {e}")
            db.rollback()
        finally:
            db.close()
    
    def _log_system_event(self, level: str, category: str, message: str, 
                          robot_id: str = None, details: dict = None):
        """Log system event to PostgreSQL"""
        db = SessionLocal()
        try:
            log = SystemLog(
                level=level,
                category=category,
                message=message,
                robot_id=robot_id,
                details=details
            )
            db.add(log)
            db.commit()
        except Exception as e:
            print(f"Error logging system event: {e}")
            db.rollback()
        finally:
            db.close()
    
    def _get_threshold(self, metric_type: str, robot_id: str = None) -> dict:
        """Get threshold for a metric type from database or defaults"""
        db = SessionLocal()
        try:
            # First try robot-specific threshold
            if robot_id:
                threshold = db.query(AlertThreshold).filter(
                    AlertThreshold.metric_type == metric_type,
                    AlertThreshold.robot_id == robot_id,
                    AlertThreshold.enabled == True
                ).first()
                if threshold:
                    return {
                        'warning': threshold.warning_threshold,
                        'critical': threshold.critical_threshold
                    }
            
            # Fall back to global threshold
            threshold = db.query(AlertThreshold).filter(
                AlertThreshold.metric_type == metric_type,
                AlertThreshold.robot_id == None,
                AlertThreshold.enabled == True
            ).first()
            
            if threshold:
                return {
                    'warning': threshold.warning_threshold,
                    'critical': threshold.critical_threshold
                }
            
            # Fall back to defaults
            return DEFAULT_THRESHOLDS.get(metric_type, {'warning': 70, 'critical': 90})
        except Exception as e:
            print(f"Error getting threshold: {e}")
            return DEFAULT_THRESHOLDS.get(metric_type, {'warning': 70, 'critical': 90})
        finally:
            db.close()
    
    def _check_and_create_alert(self, robot_id: str, metric_type: str, value: float, 
                                 source: str = None, is_low_threshold: bool = False):
        """
        Check if value exceeds threshold and create alert if needed.
        
        Args:
            robot_id: Robot identifier
            metric_type: Type of metric (cpu, memory, temperature, battery, servo_temp)
            value: Current value
            source: Source of the metric (e.g., servo_1, cpu)
            is_low_threshold: True for metrics where low values trigger alerts (battery, voltage)
        """
        thresholds = self._get_threshold(metric_type, robot_id)
        warning_threshold = thresholds['warning']
        critical_threshold = thresholds['critical']
        
        severity = None
        
        if is_low_threshold:
            # For battery/voltage - alert when value goes BELOW threshold
            if value <= critical_threshold:
                severity = 'critical'
            elif value <= warning_threshold:
                severity = 'warning'
        else:
            # For CPU/temp - alert when value goes ABOVE threshold
            if value >= critical_threshold:
                severity = 'critical'
            elif value >= warning_threshold:
                severity = 'warning'
        
        if severity:
            self._create_alert(
                robot_id=robot_id,
                alert_type=metric_type,
                severity=severity,
                value=value,
                threshold=critical_threshold if severity == 'critical' else warning_threshold,
                source=source
            )
    
    def _create_alert(self, robot_id: str, alert_type: str, severity: str, 
                      value: float, threshold: float, source: str = None):
        """Create an alert in the database if no recent similar alert exists"""
        db = SessionLocal()
        try:
            # Check for recent duplicate alert (within last 5 minutes)
            cutoff = datetime.utcnow() - timedelta(minutes=5)
            existing = db.query(Alert).filter(
                Alert.robot_id == robot_id,
                Alert.alert_type == alert_type,
                Alert.source == source,
                Alert.resolved == False,
                Alert.created_at >= cutoff
            ).first()
            
            if existing:
                # Update existing alert if severity changed
                if existing.severity != severity:
                    existing.severity = severity
                    existing.value = value
                    existing.threshold = threshold
                    db.commit()
                    print(f"Alert: Updated {alert_type} alert for {robot_id} to {severity}")
                return
            
            # Create title and message based on alert type
            titles = {
                'cpu': f"High CPU Usage on {robot_id}",
                'memory': f"High Memory Usage on {robot_id}",
                'temperature': f"High Temperature on {robot_id}",
                'battery': f"Low Battery on {robot_id}",
                'servo_temp': f"Servo Overheating on {robot_id}",
                'servo_voltage': f"Low Servo Voltage on {robot_id}",
            }
            
            messages = {
                'cpu': f"CPU usage is at {value:.1f}% (threshold: {threshold}%)",
                'memory': f"Memory usage is at {value:.1f}% (threshold: {threshold}%)",
                'temperature': f"Temperature is {value:.1f}°C (threshold: {threshold}°C)",
                'battery': f"Battery level is at {value:.1f}% (threshold: {threshold}%)",
                'servo_temp': f"Servo temperature is {value:.1f}°C (threshold: {threshold}°C)",
                'servo_voltage': f"Servo voltage is {value:.2f}V (threshold: {threshold}V)",
            }
            
            alert = Alert(
                robot_id=robot_id,
                alert_type=alert_type,
                severity=severity,
                title=titles.get(alert_type, f"{alert_type.title()} Alert on {robot_id}"),
                message=messages.get(alert_type, f"{alert_type} value: {value} (threshold: {threshold})"),
                source=source or alert_type,
                value=value,
                threshold=threshold,
                details={
                    'metric_type': alert_type,
                    'current_value': value,
                    'threshold_value': threshold,
                    'source': source
                }
            )
            
            db.add(alert)
            db.commit()
            print(f"Alert: Created {severity} {alert_type} alert for {robot_id}")
            
            # Also log this as a system event
            self._log_system_event(
                level='WARNING' if severity == 'warning' else 'ERROR',
                category='alert',
                message=alert.message,
                robot_id=robot_id,
                details={'alert_id': alert.id, 'alert_type': alert_type, 'severity': severity}
            )
            
        except Exception as e:
            print(f"Error creating alert: {e}")
            db.rollback()
        finally:
            db.close()

# Global MQTT client instance
mqtt_client = MQTTClient()