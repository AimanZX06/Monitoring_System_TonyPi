"""
=============================================================================
Robot Data Router - Real-time Telemetry and Command API
=============================================================================

This router provides REST API endpoints for accessing real-time robot telemetry
data from InfluxDB and sending commands to robots via MQTT.

DATA SOURCES:
    InfluxDB Measurements:
        - sensor_data:    IMU, temperature, ultrasonic sensor readings
        - servo_data:     Servo position, temperature, voltage
        - battery_status: Battery percentage and voltage
        - robot_status:   Online/offline status, IP address
        - robot_location: X, Y, Z coordinates

MEASUREMENT ALIASES:
    The frontend may use different names than InfluxDB:
        "sensors" → "sensor_data"
        "servos"  → "servo_data"
        "battery" → "battery_status"

API ENDPOINTS:
    GET    /robot-data/sensors         - Get sensor data with time range
    GET    /robot-data/status          - Get all robot statuses
    GET    /robot-data/latest/{id}     - Get latest data for specific robot
    POST   /robot-data/command         - Send command to robot via MQTT
    GET    /robot-data/job-summary/{id} - Get job progress for robot
    GET    /robot-data/servos/{id}     - Get servo data for robot
    POST   /robot-data/trigger-scan    - Trigger QR scan event (testing)

DATA FLOW:
    1. TonyPi robot publishes telemetry to MQTT
    2. Backend MQTT client writes data to InfluxDB
    3. Frontend calls these endpoints to fetch data
    4. Commands are published back to MQTT for robot execution
"""

# =============================================================================
# IMPORTS
# =============================================================================

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Union
from pydantic import BaseModel
from datetime import datetime
from database.influx_client import influx_client
from job_store import job_store

# =============================================================================
# ROUTER SETUP
# =============================================================================

router = APIRouter()

# Measurement name aliases for backward compatibility
# Frontend may request "sensors" but data is stored as "sensor_data"
MEASUREMENT_ALIASES = {
    "sensors": "sensor_data",
    "servos": "servo_data", 
    "battery": "battery_status",
    "location": "robot_location",
    # These are correct as-is
    "sensor_data": "sensor_data",
    "servo_data": "servo_data",
    "battery_status": "battery_status",
    "robot_location": "robot_location",
    "robot_status": "robot_status",
}

def resolve_measurement_name(measurement: str) -> str:
    """Resolve measurement alias to actual InfluxDB measurement name."""
    return MEASUREMENT_ALIASES.get(measurement, measurement)

class SensorData(BaseModel):
    timestamp: datetime
    measurement: str
    field: str
    value: Union[float, int, str, bool]  # Allow multiple types since unit is a string
    robot_id: Optional[str] = None
    sensor_type: Optional[str] = None
    unit: Optional[str] = None  # Unit for the sensor value

class RobotStatus(BaseModel):
    robot_id: str
    status: str
    last_seen: datetime
    battery_percentage: Optional[float] = None
    location: Optional[dict] = None
    ip_address: Optional[str] = None
    camera_url: Optional[str] = None

@router.get("/robot-data/sensors", response_model=List[SensorData])
async def get_sensor_data(
    measurement: str = Query(..., description="Measurement type (e.g., sensors, sensor_data, battery, battery_status)"),
    time_range: str = Query("1h", description="Time range (e.g., 1h, 24h, 7d)"),
    robot_id: Optional[str] = Query(None, description="Filter by robot ID")
):
    """Get sensor data from InfluxDB - returns combined value/unit records for frontend"""
    try:
        # Resolve measurement alias (e.g., "sensors" -> "sensor_data")
        actual_measurement = resolve_measurement_name(measurement)
        data = influx_client.query_recent_data(actual_measurement, time_range)
        
        # Filter by robot_id if provided
        if robot_id:
            data = [d for d in data if d.get('robot_id') == robot_id]
        
        # Group by timestamp and sensor_type to combine value and unit
        # Key: (timestamp_str, sensor_type, robot_id) -> {value: X, unit: Y}
        grouped = {}
        for item in data:
            time_val = item.get('time')
            sensor_type = item.get('sensor_type')
            rid = item.get('robot_id')
            field = item.get('field', '')
            value = item.get('value')
            
            if not sensor_type or not time_val:
                continue
            
            # Create a key based on timestamp (rounded to second), sensor_type, and robot_id
            time_str = str(time_val)[:19] if time_val else ''  # Truncate to second
            key = (time_str, sensor_type, rid)
            
            if key not in grouped:
                grouped[key] = {
                    'timestamp': time_val,
                    'sensor_type': sensor_type,
                    'robot_id': rid,
                    'measurement': item.get('measurement', measurement),
                    'value': None,
                    'unit': ''
                }
            
            # Store value or unit
            if field == 'value':
                grouped[key]['value'] = value
            elif field == 'unit':
                grouped[key]['unit'] = str(value) if value else ''
        
        # Convert to response model - only include records with actual values
        result = []
        for key, item in grouped.items():
            if item['value'] is not None:
                try:
                    result.append(SensorData(
                        timestamp=item['timestamp'],
                        measurement=item['measurement'],
                        field='value',  # Always 'value' for combined records
                        value=item['value'],
                        robot_id=item['robot_id'],
                        sensor_type=item['sensor_type'],
                        unit=item['unit']  # Include unit in response
                    ))
                except Exception as e:
                    print(f"Warning: Skipping invalid sensor data item: {e}")
                    continue
        
        # Sort by timestamp descending
        result.sort(key=lambda x: x.timestamp, reverse=True)
        
        return result
    except Exception as e:
        import traceback
        error_detail = f"Error fetching sensor data: {str(e)}"
        print(f"API Error: {error_detail}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_detail)

@router.get("/robot-data/status", response_model=List[RobotStatus])
async def get_robot_status():
    """Get current robot status"""
    try:
        # Get recent status data
        # Note: measurement names must match what influx_client writes to
        status_data = influx_client.query_recent_data("robot_status", "5m")
        battery_data = influx_client.query_recent_data("battery_status", "5m")
        location_data = influx_client.query_recent_data("robot_location", "5m")
        
        # Process and combine data
        robots = {}
        
        # Process status data
        for item in status_data:
            robot_id = item.get('robot_id', 'unknown')
            if robot_id not in robots:
                robots[robot_id] = {
                    'robot_id': robot_id,
                    'status': 'unknown',
                    'last_seen': item['time'],
                    'battery_percentage': None,
                    'location': None,
                    'ip_address': None,
                    'camera_url': None
                }
            
            if item['field'] == 'status':
                robots[robot_id]['status'] = item['value']
                robots[robot_id]['last_seen'] = item['time']
            elif item['field'] == 'ip_address':
                robots[robot_id]['ip_address'] = item['value']
            elif item['field'] == 'camera_url':
                robots[robot_id]['camera_url'] = item['value']
        
        # Add battery data
        for item in battery_data:
            robot_id = item.get('robot_id', 'unknown')
            if robot_id in robots and item['field'] == 'percentage':
                robots[robot_id]['battery_percentage'] = item['value']
        
        # Add location data
        for item in location_data:
            robot_id = item.get('robot_id', 'unknown')
            if robot_id in robots:
                if robots[robot_id]['location'] is None:
                    robots[robot_id]['location'] = {}
                robots[robot_id]['location'][item['field']] = item['value']
        
        return [RobotStatus(**robot_data) for robot_data in robots.values()]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching robot status: {str(e)}")

@router.get("/robot-data/latest/{robot_id}")
async def get_latest_data(robot_id: str):
    """Get latest data for a specific robot"""
    try:
        # Get latest data from different measurements
        # Note: measurement names must match what influx_client writes to
        sensor_data = influx_client.query_recent_data("sensor_data", "5m")
        battery_data = influx_client.query_recent_data("battery_status", "5m")
        location_data = influx_client.query_recent_data("robot_location", "5m")
        status_data = influx_client.query_recent_data("robot_status", "5m")
        
        # Filter by robot_id and get latest values
        result = {
            "robot_id": robot_id,
            "sensors": {},
            "battery": {},
            "location": {},
            "status": {}
        }
        
        # Process each data type
        for data_list, key in [
            (sensor_data, "sensors"),
            (battery_data, "battery"), 
            (location_data, "location"),
            (status_data, "status")
        ]:
            filtered_data = [d for d in data_list if d.get('robot_id') == robot_id]
            if filtered_data:
                # Get most recent entry for each field
                latest_by_field = {}
                for item in filtered_data:
                    field = item['field']
                    if field not in latest_by_field or item['time'] > latest_by_field[field]['time']:
                        latest_by_field[field] = item
                
                result[key] = {field: data['value'] for field, data in latest_by_field.items()}
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching latest data: {str(e)}")

@router.post("/robot-data/command")
async def send_robot_command(command: dict):
    """Send a command to a robot via MQTT"""
    try:
        from mqtt.mqtt_client import mqtt_client
        import json
        
        # Determine target topic
        robot_id = command.get('robot_id')
        if robot_id:
            topic = f"tonypi/commands/{robot_id}"
        else:
            # Broadcast to all robots
            topic = "tonypi/commands/broadcast"
        
        # Send command via MQTT
        command_json = json.dumps(command)
        await mqtt_client.publish(topic, command_json)
        
        return {
            "success": True,
            "message": f"Command sent to robot",
            "topic": topic,
            "command": command
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending command: {str(e)}")


@router.get("/robot-data/job-summary/{robot_id}")
async def get_job_summary(robot_id: str):
    """Return an in-memory job summary for the given robot_id"""
    try:
        summary = job_store.get_summary(robot_id)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching job summary: {str(e)}")

@router.get("/robot-data/servos/{robot_id}")
async def get_servo_data(
    robot_id: str,
    time_range: str = Query("5m", description="Time range for latest data")
):
    """Get latest servo data for a specific robot"""
    try:
        # Get servo data from InfluxDB
        # Note: measurement name must match what influx_client.write_servo_data writes to
        servo_data = influx_client.query_recent_data("servo_data", time_range)
        
        # Filter by robot_id
        filtered_data = [d for d in servo_data if d.get('robot_id') == robot_id]
        
        if not filtered_data:
            return {
                "robot_id": robot_id,
                "servos": {},
                "servo_count": 0,
                "timestamp": datetime.utcnow().isoformat(),
                "message": "No servo data found"
            }
        
        # Group by servo_name and get latest values for each servo
        servos = {}
        for item in filtered_data:
            servo_name = item.get('servo_name', 'unknown')
            servo_id = item.get('servo_id', '0')
            servo_key = item.get('servo_key', servo_name)  # Use key for grouping
            alert_level = item.get('alert_level', 'normal')
            
            if servo_key not in servos:
                servos[servo_key] = {
                    "id": int(servo_id) if servo_id else 0,
                    "name": servo_name,
                    "robot_id": robot_id,
                    "alert_level": alert_level,
                    "torque_enabled": True  # Default
                }
            
            # Update with latest value for each field
            field = item.get('field')
            value = item.get('value')
            timestamp = item.get('time')
            
            # Keep latest value for each field
            if field:
                if f"{field}_time" not in servos[servo_key] or timestamp > servos[servo_key][f"{field}_time"]:
                    servos[servo_key][field] = value
                    servos[servo_key][f"{field}_time"] = timestamp
                    # Update alert_level from latest data
                    if item.get('alert_level'):
                        servos[servo_key]['alert_level'] = item.get('alert_level')
        
        # Clean up timestamp fields and format response
        result_servos = {}
        for servo_key, servo_info in servos.items():
            cleaned_info = {k: v for k, v in servo_info.items() if not k.endswith('_time')}
            # Ensure torque_enabled is boolean
            if 'torque_enabled' in cleaned_info:
                cleaned_info['torque_enabled'] = bool(cleaned_info['torque_enabled'])
            result_servos[servo_key] = cleaned_info
        
        return {
            "robot_id": robot_id,
            "servos": result_servos,
            "servo_count": len(result_servos),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching servo data: {str(e)}")


class ScanRequest(BaseModel):
    robot_id: str
    qr: str


@router.post("/robot-data/trigger-scan")
async def trigger_scan(scan: ScanRequest):
    """Trigger a scan event (useful for testing). This will publish an MQTT message
    on topic tonypi/scan/{robot_id} with the QR payload so the backend flow is exercised.
    """
    try:
        from mqtt.mqtt_client import mqtt_client
        import json

        topic = f"tonypi/scan/{scan.robot_id}"
        payload = {
            "robot_id": scan.robot_id,
            "qr": scan.qr,
            "timestamp": datetime.utcnow().isoformat()
        }

        await mqtt_client.publish(topic, json.dumps(payload))

        return {"success": True, "topic": topic, "payload": payload}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error triggering scan: {str(e)}")