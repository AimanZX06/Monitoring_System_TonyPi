import paho.mqtt.client as mqtt
import json
import asyncio
import os
from dotenv import load_dotenv
from database.influx_client import influx_client
from database.database import SessionLocal
from models.robot import Robot
from models.system_log import SystemLog
from datetime import datetime

load_dotenv()

class MQTTClient:
    def __init__(self):
        self.broker_host = os.getenv("MQTT_BROKER_HOST", "localhost")
        self.broker_port = int(os.getenv("MQTT_BROKER_PORT", 1883))
        self.username = os.getenv("MQTT_USERNAME", "tonypi")
        self.password = os.getenv("MQTT_PASSWORD", "tonypi123")
        
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
            "tonypi/logs/+"      # Robot terminal logs
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
            for key, value in payload["system_info"].items():
                if isinstance(value, (int, float, str, bool)):
                    fields[f"system_{key}"] = value
            # Debug: print all system_info fields being stored
            print(f"MQTT: Status system_info fields: {list(payload['system_info'].keys())}")
        
        print(f"MQTT: Writing status fields: {list(fields.keys())}")
        influx_client.write_sensor_data(measurement, tags, fields)
        
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

    def handle_command_response(self, payload):
        """Handle command responses"""
        print(f"Command response received: {payload}")
        # Log command response
        self._log_system_event('INFO', 'mqtt', f"Command response: {payload.get('status')}", 
                               robot_id=payload.get('robot_id'))

    def handle_scan(self, topic, payload):
        """Handle QR scan events from robots.

        Expected payload: {"robot_id": "tonypi_01", "qr": "QR12345", "timestamp": "..."}
        Backend will lookup mock item data and publish item info back to the robot on
        topic: tonypi/items/{robot_id}
        It will also update in-memory job progress via job_store.
        """
        # Import job_store and mock_items from project root modules
        try:
            import job_store as job_store_module
        except Exception:
            job_store_module = None

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

        # Update job store: mark an item processed
        try:
            if job_store_module:
                job_store = getattr(job_store_module, 'job_store', None)
                if job_store is not None:
                    # If job not started, start a job with a default expected total
                    js = job_store.get(robot_id)
                    if js is None:
                        job_store.start_job(robot_id, total_items=10)
                    job_store.record_item(robot_id, item_info if item_info else {'qr': qr})
        except Exception as e:
            print(f"JobStore: Error updating job store: {e}")

    def handle_job_event(self, topic, payload):
        """Handle job progress events published by robots (optional).

        Expected payload: {"robot_id":..., "percent": 42, "status": "working"}
        Update job_store if available.
        """
        try:
            import job_store as job_store_module
        except Exception:
            job_store_module = None

        robot_id = payload.get('robot_id') or topic.split('/')[-1]
        percent = payload.get('percent')
        status = payload.get('status')
        try:
            if job_store_module:
                job_store = getattr(job_store_module, 'job_store', None)
                if job_store is not None:
                    if percent is not None:
                        job_store.set_progress(robot_id, percent)
                    if status == 'completed':
                        job_store.finish_job(robot_id)
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

# Global MQTT client instance
mqtt_client = MQTTClient()