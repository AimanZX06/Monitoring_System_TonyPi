#!/usr/bin/env python3
"""
TonyPi Robot Client - Runs on Raspberry Pi 5
Connects to the monitoring system and sends/receives data via MQTT
"""

import asyncio
import json
import time
import uuid
import psutil
import platform
from datetime import datetime
from typing import Dict, Any
import paho.mqtt.client as mqtt
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("TonyPi-Client")

class TonyPiRobotClient:
    def __init__(self, mqtt_broker: str = "localhost", mqtt_port: int = 1883, robot_id: str = None):
        self.mqtt_broker = mqtt_broker
        self.mqtt_port = mqtt_port
        # Use hostname-based ID for persistence, or provided robot_id, or generate random
        if robot_id:
            self.robot_id = robot_id
        else:
            hostname = platform.node().lower().replace(" ", "_")
            self.robot_id = f"tonypi_{hostname}"
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=self.robot_id)
        self.is_connected = False
        self.running = False
        
        # Robot state
        self.battery_level = 100.0
        self.location = {"x": 0.0, "y": 0.0, "z": 0.0}
        self.sensors = {}
        self.status = "online"
        
        # MQTT Topics
        self.topics = {
            "sensors": f"tonypi/sensors/{self.robot_id}",
            "status": f"tonypi/status/{self.robot_id}",
            "location": f"tonypi/location",
            "battery": f"tonypi/battery",
            "commands": f"tonypi/commands/{self.robot_id}",
            "response": f"tonypi/commands/response"
        }
        # Additional topics
        self.items_topic = f"tonypi/items/{self.robot_id}"
        self.scan_topic = f"tonypi/scan/{self.robot_id}"
        self.job_topic = f"tonypi/job/{self.robot_id}"
        
        # Setup MQTT callbacks
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        
        logger.info(f"TonyPi Robot Client initialized with ID: {self.robot_id}")

    def on_connect(self, client, userdata, flags, rc, properties=None):
        """Callback for MQTT connection"""
        if rc == 0:
            self.is_connected = True
            logger.info(f"Connected to MQTT broker at {self.mqtt_broker}:{self.mqtt_port}")
            
            # Subscribe to command topics
            client.subscribe(self.topics["commands"])
            client.subscribe("tonypi/commands/broadcast")
            # Subscribe to item info topic (responses to QR scans)
            client.subscribe(self.items_topic)
            
            # Send initial status
            self.send_status_update()
        else:
            logger.error(f"Failed to connect to MQTT broker. Return code: {rc}")

    def on_disconnect(self, client, userdata, flags=None, rc=None, properties=None):
        """Callback for MQTT disconnection (compatible with both paho-mqtt 1.x and 2.x)"""
        self.is_connected = False
        # Handle both v1 and v2 signatures
        return_code = rc if rc is not None else flags
        logger.warning(f"Disconnected from MQTT broker. Return code: {return_code}")

    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages (commands from monitoring system)"""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            
            logger.info(f"Received command on {topic}: {payload}")
            
            # Handle different command types
            command_type = payload.get("type")
            command_id = payload.get("id", str(uuid.uuid4()))
            
            response = {
                "robot_id": self.robot_id,
                "command_id": command_id,
                "timestamp": datetime.now().isoformat(),
                "success": False,
                "message": "Unknown command"
            }
            
            if command_type == "move":
                response = self.handle_move_command(payload)
            elif command_type == "status_request":
                response = self.handle_status_request(payload)
            elif command_type == "battery_request":
                response = self.handle_battery_request(payload)
            elif command_type == "stop":
                response = self.handle_stop_command(payload)
            elif command_type == "shutdown":
                response = self.handle_shutdown_command(payload)
            elif topic.startswith("tonypi/items/"):
                # Item info coming back from backend
                # Treat as 'command' style response for logging
                response = {
                    "robot_id": self.robot_id,
                    "timestamp": datetime.now().isoformat(),
                    "success": payload.get('found', False),
                    "item": payload.get('item'),
                    "message": payload.get('message', 'Item info')
                }
                # Update job progress locally: increment items processed
                try:
                    # assume a default total of 10 items for demo
                    if not hasattr(self, 'items_done'):
                        self.items_done = 0
                        self.items_total = 10
                    if payload.get('found', False):
                        self.items_done += 1
                        percent = round((self.items_done / max(1, self.items_total)) * 100, 2)
                        job_event = {
                            "robot_id": self.robot_id,
                            "percent": percent,
                            "status": "working" if percent < 100 else "completed",
                            "items_done": self.items_done,
                            "items_total": self.items_total,
                            "timestamp": datetime.now().isoformat()
                        }
                        # publish job progress
                        self.client.publish(self.job_topic, json.dumps(job_event))
                except Exception as e:
                    logger.error(f"Error updating local job progress: {e}")
            
            # Send response
            self.client.publish(self.topics["response"], json.dumps(response))
            
        except Exception as e:
            logger.error(f"Error handling message: {e}")

    def handle_move_command(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle movement commands"""
        try:
            direction = payload.get("direction", "forward")
            distance = payload.get("distance", 1.0)
            speed = payload.get("speed", 0.5)
            
            logger.info(f"Moving {direction} for {distance} units at speed {speed}")
            
            # Simulate movement by updating location
            if direction == "forward":
                self.location["x"] += distance
            elif direction == "backward":
                self.location["x"] -= distance
            elif direction == "left":
                self.location["y"] -= distance
            elif direction == "right":
                self.location["y"] += distance
            
            # Simulate battery consumption
            self.battery_level = max(0, self.battery_level - (distance * 0.1))
            
            return {
                "robot_id": self.robot_id,
                "command_id": payload.get("id"),
                "timestamp": datetime.now().isoformat(),
                "success": True,
                "message": f"Moved {direction} for {distance} units",
                "new_location": self.location.copy(),
                "battery_level": self.battery_level
            }
        except Exception as e:
            return {
                "robot_id": self.robot_id,
                "command_id": payload.get("id"),
                "timestamp": datetime.now().isoformat(),
                "success": False,
                "message": f"Movement failed: {str(e)}"
            }

    def handle_status_request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle status request commands"""
        return {
            "robot_id": self.robot_id,
            "command_id": payload.get("id"),
            "timestamp": datetime.now().isoformat(),
            "success": True,
            "message": "Status retrieved",
            "data": {
                "status": self.status,
                "battery_level": self.battery_level,
                "location": self.location.copy(),
                "sensors": self.sensors.copy(),
                "system_info": self.get_system_info()
            }
        }

    def handle_battery_request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle battery status request"""
        return {
            "robot_id": self.robot_id,
            "command_id": payload.get("id"),
            "timestamp": datetime.now().isoformat(),
            "success": True,
            "message": "Battery status retrieved",
            "data": {
                "battery_level": self.battery_level,
                "charging": False,
                "estimated_time": self.battery_level * 2  # Rough estimate in hours
            }
        }

    def handle_stop_command(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle stop command"""
        logger.info("Stopping all robot activities")
        return {
            "robot_id": self.robot_id,
            "command_id": payload.get("id"),
            "timestamp": datetime.now().isoformat(),
            "success": True,
            "message": "Robot stopped successfully"
        }

    def handle_shutdown_command(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle shutdown command"""
        logger.info("Shutting down robot client")
        self.running = False
        return {
            "robot_id": self.robot_id,
            "command_id": payload.get("id"),
            "timestamp": datetime.now().isoformat(),
            "success": True,
            "message": "Robot shutting down"
        }

    def get_system_info(self) -> Dict[str, Any]:
        """Get system information from Raspberry Pi"""
        try:
            return {
                "platform": platform.platform(),
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent,
                "temperature": self.get_cpu_temperature(),
                "uptime": time.time() - psutil.boot_time()
            }
        except Exception as e:
            logger.error(f"Error getting system info: {e}")
            return {"error": str(e)}

    def get_cpu_temperature(self) -> float:
        """Get CPU temperature (Raspberry Pi specific)"""
        try:
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                temp = float(f.read()) / 1000.0
                return temp
        except:
            # Fallback for non-Raspberry Pi systems
            return 45.0 + (time.time() % 10)  # Simulate temperature

    def read_sensors(self) -> Dict[str, float]:
        """Read sensor data (simulated for now)"""
        import random
        
        # Simulate various sensors
        sensors = {
            "accelerometer_x": random.uniform(-2.0, 2.0),
            "accelerometer_y": random.uniform(-2.0, 2.0),
            "accelerometer_z": random.uniform(8.0, 12.0),
            "gyroscope_x": random.uniform(-100, 100),
            "gyroscope_y": random.uniform(-100, 100),
            "gyroscope_z": random.uniform(-100, 100),
            "ultrasonic_distance": random.uniform(5.0, 200.0),
            "camera_light_level": random.uniform(0.0, 100.0),
            "servo_angle": random.uniform(-90, 90),
            "cpu_temperature": self.get_cpu_temperature()
        }
        
        self.sensors = sensors
        return sensors

    def send_sensor_data(self):
        """Send sensor data to monitoring system"""
        if not self.is_connected:
            return
        
        try:
            sensors = self.read_sensors()
            
            # Send each sensor value separately for InfluxDB compatibility
            for sensor_name, value in sensors.items():
                data = {
                    "robot_id": self.robot_id,
                    "sensor_type": sensor_name,
                    "value": value,
                    "timestamp": datetime.now().isoformat(),
                    "unit": self.get_sensor_unit(sensor_name)
                }
                
                self.client.publish(self.topics["sensors"], json.dumps(data))
            
            logger.debug(f"Sent sensor data: {len(sensors)} sensors")
            
        except Exception as e:
            logger.error(f"Error sending sensor data: {e}")

    def get_sensor_unit(self, sensor_name: str) -> str:
        """Get the unit for a sensor"""
        unit_map = {
            "accelerometer_x": "m/s²",
            "accelerometer_y": "m/s²", 
            "accelerometer_z": "m/s²",
            "gyroscope_x": "°/s",
            "gyroscope_y": "°/s",
            "gyroscope_z": "°/s",
            "ultrasonic_distance": "cm",
            "camera_light_level": "%",
            "servo_angle": "°",
            "cpu_temperature": "°C"
        }
        return unit_map.get(sensor_name, "")

    def send_battery_status(self):
        """Send battery status"""
        if not self.is_connected:
            return
        
        try:
            data = {
                "robot_id": self.robot_id,
                "percentage": self.battery_level,
                "voltage": 12.0 * (self.battery_level / 100.0),
                "charging": False,
                "timestamp": datetime.now().isoformat()
            }
            
            self.client.publish(self.topics["battery"], json.dumps(data))
            logger.debug(f"Sent battery status: {self.battery_level}%")
            
        except Exception as e:
            logger.error(f"Error sending battery status: {e}")

    def send_location_update(self):
        """Send location/position update"""
        if not self.is_connected:
            return
        
        try:
            data = {
                "robot_id": self.robot_id,
                "x": self.location["x"],
                "y": self.location["y"],
                "z": self.location["z"],
                "timestamp": datetime.now().isoformat()
            }
            
            self.client.publish(self.topics["location"], json.dumps(data))
            logger.debug(f"Sent location: {self.location}")
            
        except Exception as e:
            logger.error(f"Error sending location: {e}")

    def send_status_update(self):
        """Send robot status update"""
        if not self.is_connected:
            return
        
        try:
            data = {
                "robot_id": self.robot_id,
                "status": self.status,
                "timestamp": datetime.now().isoformat(),
                "system_info": self.get_system_info()
            }
            
            self.client.publish(self.topics["status"], json.dumps(data))
            logger.debug(f"Sent status update: {self.status}")
            
        except Exception as e:
            logger.error(f"Error sending status: {e}")

    async def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client.connect(self.mqtt_broker, self.mqtt_port, 60)
            self.client.loop_start()
            
            # Wait for connection
            timeout = 10
            while not self.is_connected and timeout > 0:
                await asyncio.sleep(0.5)
                timeout -= 0.5
            
            if not self.is_connected:
                raise Exception("Failed to connect to MQTT broker within timeout")
                
            logger.info("Successfully connected to MQTT broker")
            
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            raise

    async def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.is_connected:
            # Send offline status
            self.status = "offline"
            self.send_status_update()
            await asyncio.sleep(1)  # Give time for message to send
            
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("Disconnected from MQTT broker")

    async def run(self):
        """Main loop for the robot client"""
        self.running = True
        logger.info(f"Starting TonyPi Robot Client - ID: {self.robot_id}")
        
        try:
            await self.connect()
            
            last_sensor_time = 0
            last_battery_time = 0
            last_location_time = 0
            last_status_time = 0
            
            while self.running:
                current_time = time.time()
                
                # Send sensor data every 2 seconds
                if current_time - last_sensor_time >= 2:
                    self.send_sensor_data()
                    last_sensor_time = current_time
                
                # Send battery status every 30 seconds
                if current_time - last_battery_time >= 30:
                    self.send_battery_status()
                    last_battery_time = current_time
                
                # Send location every 5 seconds
                if current_time - last_location_time >= 5:
                    self.send_location_update()
                    last_location_time = current_time
                
                # Send status every 60 seconds
                if current_time - last_status_time >= 60:
                    self.send_status_update()
                    last_status_time = current_time
                
                # Simulate battery drain
                if self.battery_level > 0:
                    self.battery_level = max(0, self.battery_level - 0.001)

                # Optional: small auto-scan demo is disabled by default. If attribute
                # `auto_scan_interval` is set on the instance, perform periodic QR scans.
                try:
                    if hasattr(self, 'auto_scan_interval') and self.auto_scan_interval > 0:
                        now_ts = time.time()
                        last = getattr(self, 'last_auto_scan', 0)
                        if now_ts - last >= self.auto_scan_interval:
                            # choose a sample QR
                            sample_qr = getattr(self, 'sample_qr', 'QR12345')
                            scan_payload = {"robot_id": self.robot_id, "qr": sample_qr, "timestamp": datetime.now().isoformat()}
                            self.client.publish(self.scan_topic, json.dumps(scan_payload))
                            logger.info(f"Auto-scan published: {scan_payload}")
                            self.last_auto_scan = now_ts
                except Exception:
                    pass
                
                await asyncio.sleep(0.1)  # Small delay to prevent high CPU usage
                
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
        finally:
            await self.disconnect()

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="TonyPi Robot Client")
    parser.add_argument("--broker", default="localhost", help="MQTT broker address")
    parser.add_argument("--port", type=int, default=1883, help="MQTT broker port")
    parser.add_argument("--robot-id", default=None, help="Robot ID (default: tonypi_<hostname>)")
    
    args = parser.parse_args()
    
    robot = TonyPiRobotClient(mqtt_broker=args.broker, mqtt_port=args.port, robot_id=args.robot_id)
    
    try:
        asyncio.run(robot.run())
    except KeyboardInterrupt:
        logger.info("Robot client stopped by user")
    except Exception as e:
        logger.error(f"Robot client error: {e}")

if __name__ == "__main__":
    main()