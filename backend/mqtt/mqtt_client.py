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
            "tonypi/servos/+"    # Servo status data
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
            elif topic == "tonypi/commands/response":
                self.handle_command_response(payload)
                
        except Exception as e:
            print(f"MQTT: Error processing message: {e}")

    def handle_sensor_data(self, topic, payload):
        """Handle sensor data and store in InfluxDB"""
        sensor_type = topic.split('/')[-1]  # Extract sensor type from topic
        
        # Prepare data for InfluxDB
        measurement = "sensors"
        tags = {
            "robot_id": payload.get("robot_id", "tonypi_01"),
            "sensor_type": sensor_type
        }
        fields = {
            key: value for key, value in payload.items() 
            if key not in ["robot_id", "timestamp"]
        }
        
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
        
        # Add system_info fields if present
        if "system_info" in payload and isinstance(payload["system_info"], dict):
            for key, value in payload["system_info"].items():
                if isinstance(value, (int, float, str)):
                    fields[f"system_{key}"] = value
        
        influx_client.write_sensor_data(measurement, tags, fields)
        
        # Update robot in PostgreSQL
        self._update_robot_status(robot_id, payload.get("status", "online"))

    def handle_location_data(self, payload):
        """Handle robot location data"""
        measurement = "location"
        tags = {
            "robot_id": payload.get("robot_id", "tonypi_01")
        }
        fields = {
            "x": payload.get("x", 0),
            "y": payload.get("y", 0),
            "z": payload.get("z", 0),
            "heading": payload.get("heading", 0)
        }
        
        influx_client.write_sensor_data(measurement, tags, fields)

    def handle_battery_data(self, payload):
        """Handle battery status data"""
        measurement = "battery"
        tags = {
            "robot_id": payload.get("robot_id", "tonypi_01")
        }
        fields = {
            "voltage": payload.get("voltage", 0),
            "current": payload.get("current", 0),
            "percentage": payload.get("percentage", 0),
            "temperature": payload.get("temperature", 0)
        }
        
        influx_client.write_sensor_data(measurement, tags, fields)

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
        """Handle servo status data and store in InfluxDB"""
        robot_id = payload.get("robot_id", topic.split('/')[-1])
        servos = payload.get("servos", {})
        
        measurement = "servos"
        
        # Store each servo's data
        for servo_name, servo_info in servos.items():
            tags = {
                "robot_id": robot_id,
                "servo_id": str(servo_info.get("id", 0)),
                "servo_name": servo_name,
                "alert_level": servo_info.get("alert_level", "normal")
            }
            
            fields = {
                "position": servo_info.get("position", 0),
                "temperature": servo_info.get("temperature", 0),
                "voltage": servo_info.get("voltage", 0),
                "torque_enabled": 1 if servo_info.get("torque_enabled", False) else 0
            }
            
            # Store in InfluxDB
            influx_client.write_sensor_data(measurement, tags, fields)
        
        print(f"MQTT: Stored servo data for {len(servos)} servos from {robot_id}")

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
    
    def _update_robot_status(self, robot_id: str, status: str):
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