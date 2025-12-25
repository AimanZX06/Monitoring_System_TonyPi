from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from database.influx_client import influx_client
from job_store import job_store

router = APIRouter()

class SensorData(BaseModel):
    timestamp: datetime
    measurement: str
    field: str
    value: float
    robot_id: Optional[str] = None
    sensor_type: Optional[str] = None

class RobotStatus(BaseModel):
    robot_id: str
    status: str
    last_seen: datetime
    battery_percentage: Optional[float] = None
    location: Optional[dict] = None

@router.get("/robot-data/sensors", response_model=List[SensorData])
async def get_sensor_data(
    measurement: str = Query(..., description="Measurement type (e.g., sensors, battery, location)"),
    time_range: str = Query("1h", description="Time range (e.g., 1h, 24h, 7d)"),
    robot_id: Optional[str] = Query(None, description="Filter by robot ID")
):
    """Get sensor data from InfluxDB"""
    try:
        data = influx_client.query_recent_data(measurement, time_range)
        
        # Filter by robot_id if provided
        if robot_id:
            data = [d for d in data if d.get('robot_id') == robot_id]
        
        # Convert to response model
        result = []
        for item in data:
            try:
                result.append(SensorData(
                    timestamp=item.get('time'),
                    measurement=item.get('measurement', measurement),
                    field=item.get('field', ''),
                    value=item.get('value', 0),
                    robot_id=item.get('robot_id'),
                    sensor_type=item.get('sensor_type')
                ))
            except Exception as e:
                # Skip invalid items but continue processing
                print(f"Warning: Skipping invalid sensor data item: {e}")
                continue
        
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
        status_data = influx_client.query_recent_data("robot_status", "5m")
        battery_data = influx_client.query_recent_data("battery", "5m")
        location_data = influx_client.query_recent_data("location", "5m")
        
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
                    'location': None
                }
            
            if item['field'] == 'status':
                robots[robot_id]['status'] = item['value']
                robots[robot_id]['last_seen'] = item['time']
        
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
        sensor_data = influx_client.query_recent_data("sensors", "5m")
        battery_data = influx_client.query_recent_data("battery", "5m")
        location_data = influx_client.query_recent_data("location", "5m")
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
        servo_data = influx_client.query_recent_data("servos", time_range)
        
        # Filter by robot_id
        filtered_data = [d for d in servo_data if d.get('robot_id') == robot_id]
        
        if not filtered_data:
            return {
                "robot_id": robot_id,
                "servos": {},
                "message": "No servo data found"
            }
        
        # Group by servo_name and get latest values for each servo
        servos = {}
        for item in filtered_data:
            servo_name = item.get('servo_name', 'unknown')
            servo_id = item.get('servo_id', '0')
            
            if servo_name not in servos:
                servos[servo_name] = {
                    "id": int(servo_id),
                    "name": servo_name,
                    "robot_id": robot_id
                }
            
            # Update with latest value for each field
            field = item.get('field')
            value = item.get('value')
            timestamp = item.get('time')
            
            # Keep latest value for each field
            if field:
                if f"{field}_time" not in servos[servo_name] or timestamp > servos[servo_name][f"{field}_time"]:
                    servos[servo_name][field] = value
                    servos[servo_name][f"{field}_time"] = timestamp
        
        # Clean up timestamp fields and format response
        result_servos = {}
        for servo_name, servo_info in servos.items():
            cleaned_info = {k: v for k, v in servo_info.items() if not k.endswith('_time')}
            result_servos[servo_name] = cleaned_info
        
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