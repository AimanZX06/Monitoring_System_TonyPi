from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import os
from dotenv import load_dotenv
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

load_dotenv()

logger = logging.getLogger("InfluxClient")


class InfluxClient:
    """
    InfluxDB client for storing TonyPi robot telemetry data.
    
    Handles:
    - Sensor data (IMU, ultrasonic, light sensor, temperature)
    - Servo data (position, temperature, voltage)
    - Vision detection data
    - Robot logs/terminal output
    - Battery status
    - Location tracking
    """
    
    # Valid sensor types and their expected units
    SENSOR_TYPES = {
        "accelerometer_x": {"unit": "m/s^2", "min": -20, "max": 20},
        "accelerometer_y": {"unit": "m/s^2", "min": -20, "max": 20},
        "accelerometer_z": {"unit": "m/s^2", "min": -20, "max": 20},
        "gyroscope_x": {"unit": "deg/s", "min": -500, "max": 500},
        "gyroscope_y": {"unit": "deg/s", "min": -500, "max": 500},
        "gyroscope_z": {"unit": "deg/s", "min": -500, "max": 500},
        "ultrasonic_distance": {"unit": "cm", "min": 0, "max": 500},
        "cpu_temperature": {"unit": "C", "min": 0, "max": 100},
        "light_sensor_dark": {"unit": "bool", "min": 0, "max": 1},
        "light_level": {"unit": "%", "min": 0, "max": 100},
        "light_status": {"unit": "status", "min": None, "max": None},
    }
    
    # Valid log levels
    LOG_LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
    
    def __init__(self):
        self.url = os.getenv("INFLUXDB_URL", "http://localhost:8086")
        self.token = os.getenv("INFLUXDB_TOKEN", "my-super-secret-auth-token")
        self.org = os.getenv("INFLUXDB_ORG", "tonypi")
        self.bucket = os.getenv("INFLUXDB_BUCKET", "robot_data")
        
        self.client = InfluxDBClient(url=self.url, token=self.token, org=self.org)
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
        self.query_api = self.client.query_api()
        
        logger.info(f"InfluxDB client initialized: {self.url}, org={self.org}, bucket={self.bucket}")

    def _validate_value(self, value: Any, min_val: Optional[float], max_val: Optional[float]) -> bool:
        """Validate a numeric value is within expected range."""
        if min_val is None or max_val is None:
            return True
        try:
            num_val = float(value)
            return min_val <= num_val <= max_val
        except (ValueError, TypeError):
            return False

    def write_sensor_data(self, measurement: str, tags: dict, fields: dict) -> bool:
        """
        Write sensor data to InfluxDB with validation.
        
        Args:
            measurement: The measurement name (e.g., 'sensor_data')
            tags: Dictionary of tags (e.g., {'robot_id': 'tonypi_1', 'sensor_type': 'accelerometer_x'})
            fields: Dictionary of fields (e.g., {'value': 0.5, 'unit': 'm/s^2'})
            
        Returns:
            bool: True if write succeeded, False otherwise
        """
        point = Point(measurement)
        
        # Add tags
        for key, value in tags.items():
            if value is not None:
                point = point.tag(key, str(value))
        
        # Add fields with type handling
        for key, value in fields.items():
            if value is not None:
                if isinstance(value, bool):
                    point = point.field(key, value)
                elif isinstance(value, int):
                    point = point.field(key, value)
                elif isinstance(value, float):
                    point = point.field(key, value)
                else:
                    point = point.field(key, str(value))
        
        try:
            self.write_api.write(bucket=self.bucket, record=point)
            return True
        except Exception as e:
            logger.error(f"Error writing to InfluxDB: {e}")
            return False

    def write_validated_sensor(self, robot_id: str, sensor_type: str, value: Any, 
                               timestamp: Optional[str] = None, unit: Optional[str] = None) -> bool:
        """
        Write validated sensor data to InfluxDB.
        
        Args:
            robot_id: Robot identifier
            sensor_type: Type of sensor (must be in SENSOR_TYPES)
            value: Sensor value
            timestamp: Optional ISO format timestamp
            unit: Optional unit override
            
        Returns:
            bool: True if write succeeded, False otherwise
        """
        # Validate sensor type
        if sensor_type not in self.SENSOR_TYPES:
            logger.warning(f"Unknown sensor type: {sensor_type}")
            # Still allow writing unknown sensor types
        else:
            # Validate value range
            sensor_config = self.SENSOR_TYPES[sensor_type]
            if not self._validate_value(value, sensor_config["min"], sensor_config["max"]):
                logger.warning(f"Sensor {sensor_type} value {value} out of range")
        
        tags = {
            "robot_id": robot_id,
            "sensor_type": sensor_type
        }
        
        fields = {
            "value": value,
            "unit": unit or self.SENSOR_TYPES.get(sensor_type, {}).get("unit", "")
        }
        
        return self.write_sensor_data("sensor_data", tags, fields)

    def write_servo_data(self, robot_id: str, servo_id: int, servo_name: str,
                         position: float, temperature: float, voltage: float,
                         torque_enabled: bool = True, alert_level: str = "normal") -> bool:
        """
        Write servo status data to InfluxDB.
        
        Args:
            robot_id: Robot identifier
            servo_id: Servo ID (1-6 typically)
            servo_name: Human-readable servo name
            position: Servo position in degrees
            temperature: Servo temperature in Celsius
            voltage: Servo voltage in Volts
            torque_enabled: Whether torque is enabled
            alert_level: Alert level ('normal', 'warning', 'critical')
            
        Returns:
            bool: True if write succeeded, False otherwise
        """
        # Validate servo data
        if not 1 <= servo_id <= 20:
            logger.warning(f"Invalid servo ID: {servo_id}")
        if not -180 <= position <= 180:
            logger.warning(f"Servo position out of range: {position}")
        if not 0 <= temperature <= 100:
            logger.warning(f"Servo temperature out of range: {temperature}")
        if not 0 <= voltage <= 15:
            logger.warning(f"Servo voltage out of range: {voltage}")
        if alert_level not in ["normal", "warning", "critical"]:
            alert_level = "normal"
        
        tags = {
            "robot_id": robot_id,
            "servo_id": str(servo_id),
            "servo_name": servo_name,
            "alert_level": alert_level
        }
        
        fields = {
            "position": float(position),
            "temperature": float(temperature),
            "voltage": float(voltage),
            "torque_enabled": torque_enabled
        }
        
        return self.write_sensor_data("servo_data", tags, fields)

    def write_vision_data(self, robot_id: str, detection: bool, state: str,
                          label: Optional[str] = None, confidence: Optional[float] = None,
                          bbox: Optional[Dict[str, int]] = None, center_x: Optional[int] = None,
                          nav_cmd: Optional[str] = None, error: Optional[float] = None,
                          is_locked: bool = False) -> bool:
        """
        Write vision detection data to InfluxDB.
        
        Args:
            robot_id: Robot identifier
            detection: Whether an object was detected
            state: Robot state (IDLE, SEARCHING, ACTING)
            label: Detected object label
            confidence: Detection confidence (0-1)
            bbox: Bounding box dict with x1, y1, x2, y2
            center_x: Center X coordinate of detection
            nav_cmd: Navigation command (LOCKED, TURN_LEFT, TURN_RIGHT, SCANNING)
            error: Navigation error value
            is_locked: Whether target is locked
            
        Returns:
            bool: True if write succeeded, False otherwise
        """
        tags = {
            "robot_id": robot_id,
            "state": state,
            "detection": str(detection).lower()
        }
        
        if label:
            tags["label"] = label
        if nav_cmd:
            tags["nav_cmd"] = nav_cmd
        
        fields = {
            "has_detection": detection,
            "is_locked": is_locked
        }
        
        if confidence is not None:
            # Validate confidence range
            if 0 <= confidence <= 1:
                fields["confidence"] = float(confidence)
            else:
                logger.warning(f"Invalid confidence value: {confidence}")
        
        if bbox:
            fields["bbox_x1"] = int(bbox.get("x1", 0))
            fields["bbox_y1"] = int(bbox.get("y1", 0))
            fields["bbox_x2"] = int(bbox.get("x2", 0))
            fields["bbox_y2"] = int(bbox.get("y2", 0))
            # Calculate bbox area
            width = abs(fields["bbox_x2"] - fields["bbox_x1"])
            height = abs(fields["bbox_y2"] - fields["bbox_y1"])
            fields["bbox_area"] = width * height
        
        if center_x is not None:
            fields["center_x"] = int(center_x)
        
        if error is not None:
            fields["nav_error"] = float(error)
        
        return self.write_sensor_data("vision_data", tags, fields)

    def write_log_entry(self, robot_id: str, level: str, message: str, 
                        source: str = "main", timestamp: Optional[str] = None) -> bool:
        """
        Write robot log entry to InfluxDB.
        
        Args:
            robot_id: Robot identifier
            level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            message: Log message content
            source: Source module/component
            timestamp: Optional ISO format timestamp
            
        Returns:
            bool: True if write succeeded, False otherwise
        """
        # Validate log level
        level = level.upper()
        if level not in self.LOG_LEVELS:
            level = "INFO"
        
        tags = {
            "robot_id": robot_id,
            "level": level,
            "source": source
        }
        
        fields = {
            "message": message,
            "level_num": self.LOG_LEVELS.index(level)
        }
        
        return self.write_sensor_data("robot_logs", tags, fields)

    def write_battery_status(self, robot_id: str, percentage: float, 
                             voltage: float, charging: bool = False) -> bool:
        """
        Write battery status to InfluxDB.
        
        Args:
            robot_id: Robot identifier
            percentage: Battery percentage (0-100)
            voltage: Battery voltage in Volts
            charging: Whether battery is charging
            
        Returns:
            bool: True if write succeeded, False otherwise
        """
        # Validate battery data
        percentage = max(0, min(100, percentage))
        voltage = max(0, min(15, voltage))
        
        tags = {
            "robot_id": robot_id,
            "charging": str(charging).lower()
        }
        
        fields = {
            "percentage": float(percentage),
            "voltage": float(voltage),
            "is_charging": charging
        }
        
        return self.write_sensor_data("battery_status", tags, fields)

    def write_location(self, robot_id: str, x: float, y: float, z: float = 0.0) -> bool:
        """
        Write robot location to InfluxDB.
        
        Args:
            robot_id: Robot identifier
            x: X coordinate
            y: Y coordinate
            z: Z coordinate (height)
            
        Returns:
            bool: True if write succeeded, False otherwise
        """
        tags = {
            "robot_id": robot_id
        }
        
        fields = {
            "x": float(x),
            "y": float(y),
            "z": float(z)
        }
        
        return self.write_sensor_data("robot_location", tags, fields)

    def query_recent_data(self, measurement: str, time_range: str = "1h", 
                          robot_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Query recent data from InfluxDB.
        
        Args:
            measurement: Measurement name to query
            time_range: Time range (e.g., '1h', '24h', '7d')
            robot_id: Optional robot ID filter
            
        Returns:
            List of data records
        """
        query = f'''
        from(bucket: "{self.bucket}")
          |> range(start: -{time_range})
          |> filter(fn: (r) => r._measurement == "{measurement}")
        '''
        
        if robot_id:
            query += f'''
          |> filter(fn: (r) => r.robot_id == "{robot_id}")
        '''
        
        try:
            result = self.query_api.query(query)
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        "time": record.get_time(),
                        "measurement": record.get_measurement(),
                        "field": record.get_field(),
                        "value": record.get_value(),
                        **{k: v for k, v in record.values.items() 
                           if not k.startswith('_') and k not in ['result', 'table']}
                    })
            return data
        except Exception as e:
            logger.error(f"Error querying from InfluxDB: {e}")
            return []

    def query_sensor_history(self, robot_id: str, sensor_type: str, 
                             time_range: str = "1h") -> List[Dict[str, Any]]:
        """
        Query sensor history for a specific sensor type.
        
        Args:
            robot_id: Robot identifier
            sensor_type: Type of sensor
            time_range: Time range to query
            
        Returns:
            List of sensor readings
        """
        query = f'''
        from(bucket: "{self.bucket}")
          |> range(start: -{time_range})
          |> filter(fn: (r) => r._measurement == "sensor_data")
          |> filter(fn: (r) => r.robot_id == "{robot_id}")
          |> filter(fn: (r) => r.sensor_type == "{sensor_type}")
          |> filter(fn: (r) => r._field == "value")
        '''
        
        try:
            result = self.query_api.query(query)
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        "time": record.get_time().isoformat(),
                        "value": record.get_value(),
                        "sensor_type": sensor_type
                    })
            return data
        except Exception as e:
            logger.error(f"Error querying sensor history: {e}")
            return []

    def query_vision_events(self, robot_id: str, time_range: str = "1h",
                            detection_only: bool = False) -> List[Dict[str, Any]]:
        """
        Query vision detection events.
        
        Args:
            robot_id: Robot identifier
            time_range: Time range to query
            detection_only: Only return records with detections
            
        Returns:
            List of vision events
        """
        query = f'''
        from(bucket: "{self.bucket}")
          |> range(start: -{time_range})
          |> filter(fn: (r) => r._measurement == "vision_data")
          |> filter(fn: (r) => r.robot_id == "{robot_id}")
        '''
        
        if detection_only:
            query += '''
          |> filter(fn: (r) => r.detection == "true")
        '''
        
        try:
            result = self.query_api.query(query)
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        "time": record.get_time().isoformat(),
                        "field": record.get_field(),
                        "value": record.get_value(),
                        **{k: v for k, v in record.values.items() 
                           if not k.startswith('_') and k not in ['result', 'table']}
                    })
            return data
        except Exception as e:
            logger.error(f"Error querying vision events: {e}")
            return []

    def query_robot_logs(self, robot_id: str, time_range: str = "1h",
                         level: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Query robot log entries.
        
        Args:
            robot_id: Robot identifier
            time_range: Time range to query
            level: Optional log level filter
            
        Returns:
            List of log entries
        """
        query = f'''
        from(bucket: "{self.bucket}")
          |> range(start: -{time_range})
          |> filter(fn: (r) => r._measurement == "robot_logs")
          |> filter(fn: (r) => r.robot_id == "{robot_id}")
        '''
        
        if level:
            query += f'''
          |> filter(fn: (r) => r.level == "{level.upper()}")
        '''
        
        try:
            result = self.query_api.query(query)
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        "time": record.get_time().isoformat(),
                        "field": record.get_field(),
                        "value": record.get_value(),
                        **{k: v for k, v in record.values.items() 
                           if not k.startswith('_') and k not in ['result', 'table']}
                    })
            return data
        except Exception as e:
            logger.error(f"Error querying robot logs: {e}")
            return []

    def get_latest_status(self, robot_id: str) -> Dict[str, Any]:
        """
        Get the latest status for a robot including all telemetry.
        
        Args:
            robot_id: Robot identifier
            
        Returns:
            Dictionary with latest sensor, servo, battery, and location data
        """
        status = {
            "robot_id": robot_id,
            "sensors": {},
            "servos": {},
            "battery": None,
            "location": None,
            "last_vision": None
        }
        
        # Get latest sensor data
        for sensor_type in self.SENSOR_TYPES.keys():
            data = self.query_sensor_history(robot_id, sensor_type, "5m")
            if data:
                status["sensors"][sensor_type] = data[-1]
        
        # Get latest battery status
        battery_data = self.query_recent_data("battery_status", "5m", robot_id)
        if battery_data:
            status["battery"] = battery_data[-1]
        
        # Get latest location
        location_data = self.query_recent_data("robot_location", "5m", robot_id)
        if location_data:
            status["location"] = location_data[-1]
        
        # Get latest vision event
        vision_data = self.query_vision_events(robot_id, "5m")
        if vision_data:
            status["last_vision"] = vision_data[-1]
        
        return status

    def close(self):
        """Close the InfluxDB client."""
        if self.client:
            self.client.close()
            logger.info("InfluxDB client closed")


# Global InfluxDB client instance
influx_client = InfluxClient()
