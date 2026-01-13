"""
Data Validation Router

Endpoints to validate and verify robot data integrity.
Use these to check if data from your robot is being received correctly.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from database.database import get_db
from database.influx_client import influx_client
from models.robot import Robot
from models.job import Job

router = APIRouter(prefix="/validate", tags=["validation"])


class ValidationResult(BaseModel):
    """Result of data validation check"""
    valid: bool
    source: str
    message: str
    data_sample: Optional[Dict[str, Any]] = None
    timestamp: datetime = datetime.now()
    issues: List[str] = []


class RobotDataCheck(BaseModel):
    """Comprehensive robot data validation result"""
    robot_id: str
    is_registered: bool
    has_recent_data: bool
    last_seen: Optional[datetime]
    data_sources: Dict[str, bool]
    validation_results: List[ValidationResult]
    overall_status: str


@router.get("/robot/{robot_id}", response_model=RobotDataCheck)
async def validate_robot_data(
    robot_id: str,
    time_range: str = Query("1h", description="Time range to check: 1h, 6h, 24h"),
    db: Session = Depends(get_db)
):
    """
    Validate all data sources for a specific robot.
    
    This endpoint checks:
    1. If the robot is registered in the database
    2. If sensor data is being received in InfluxDB
    3. If the data values are within expected ranges
    4. Last communication timestamp
    
    Use this to verify your robot is sending valid data to the system.
    """
    validation_results = []
    issues = []
    data_sources = {
        "postgresql": False,
        "influxdb": False,
        "recent_activity": False
    }
    
    # Check 1: Robot registration in PostgreSQL
    robot = db.query(Robot).filter(Robot.robot_id == robot_id).first()
    
    if robot:
        data_sources["postgresql"] = True
        validation_results.append(ValidationResult(
            valid=True,
            source="PostgreSQL",
            message=f"Robot '{robot_id}' is registered",
            data_sample={
                "name": robot.name,
                "status": robot.status,
                "last_seen": robot.last_seen.isoformat() if robot.last_seen else None,
                "location": {"x": robot.location_x, "y": robot.location_y} if robot.location_x else None,
                "battery": robot.battery_percentage
            }
        ))
    else:
        validation_results.append(ValidationResult(
            valid=False,
            source="PostgreSQL",
            message=f"Robot '{robot_id}' NOT found in database",
            issues=["Robot not registered - ensure robot has connected at least once"]
        ))
        issues.append("Robot not registered in database")
    
    # Check 2: InfluxDB time-series data
    try:
        sensor_data = influx_client.query_data(
            measurement="robot_status",
            time_range=time_range,
            filters={"robot_id": robot_id}
        )
        
        if sensor_data and len(sensor_data) > 0:
            data_sources["influxdb"] = True
            
            # Sample the latest data point
            latest = sensor_data[-1] if sensor_data else {}
            
            # Validate data ranges
            data_issues = []
            
            # CPU check (should be 0-100)
            cpu = latest.get("system_cpu_percent")
            if cpu is not None:
                if not (0 <= float(cpu) <= 100):
                    data_issues.append(f"CPU value out of range: {cpu}%")
            
            # Memory check (should be 0-100)
            mem = latest.get("system_memory_percent")
            if mem is not None:
                if not (0 <= float(mem) <= 100):
                    data_issues.append(f"Memory value out of range: {mem}%")
            
            # Temperature check (reasonable range: -10 to 100°C)
            temp = latest.get("system_temperature")
            if temp is not None:
                if not (-10 <= float(temp) <= 100):
                    data_issues.append(f"Temperature value suspicious: {temp}°C")
            
            # Battery check (should be 0-100)
            battery = latest.get("battery_level")
            if battery is not None:
                if not (0 <= float(battery) <= 100):
                    data_issues.append(f"Battery value out of range: {battery}%")
            
            validation_results.append(ValidationResult(
                valid=len(data_issues) == 0,
                source="InfluxDB",
                message=f"Found {len(sensor_data)} data points in last {time_range}",
                data_sample=latest,
                issues=data_issues
            ))
            
            if data_issues:
                issues.extend(data_issues)
        else:
            validation_results.append(ValidationResult(
                valid=False,
                source="InfluxDB",
                message=f"No sensor data found in last {time_range}",
                issues=["No time-series data - check if robot is publishing to MQTT"]
            ))
            issues.append("No time-series data in InfluxDB")
            
    except Exception as e:
        validation_results.append(ValidationResult(
            valid=False,
            source="InfluxDB",
            message=f"Error querying InfluxDB: {str(e)}",
            issues=["Database connection error"]
        ))
        issues.append(f"InfluxDB error: {str(e)}")
    
    # Check 3: Recent activity
    if robot and robot.last_seen:
        time_diff = datetime.utcnow() - robot.last_seen
        if time_diff < timedelta(minutes=5):
            data_sources["recent_activity"] = True
            validation_results.append(ValidationResult(
                valid=True,
                source="Activity Check",
                message=f"Robot active {time_diff.seconds} seconds ago"
            ))
        else:
            validation_results.append(ValidationResult(
                valid=False,
                source="Activity Check",
                message=f"Robot last seen {time_diff} ago",
                issues=["Robot may be offline or not sending heartbeat"]
            ))
            issues.append(f"Robot inactive for {time_diff}")
    
    # Determine overall status
    if all(data_sources.values()) and len(issues) == 0:
        overall_status = "HEALTHY"
    elif any(data_sources.values()):
        overall_status = "PARTIAL"
    else:
        overall_status = "NO_DATA"
    
    return RobotDataCheck(
        robot_id=robot_id,
        is_registered=data_sources["postgresql"],
        has_recent_data=data_sources["influxdb"],
        last_seen=robot.last_seen if robot else None,
        data_sources=data_sources,
        validation_results=validation_results,
        overall_status=overall_status
    )


@router.get("/data-sample/{robot_id}")
async def get_data_sample(
    robot_id: str,
    measurement: str = Query("robot_status", description="Measurement to sample"),
    limit: int = Query(10, description="Number of samples to return")
):
    """
    Get raw data samples from InfluxDB for a robot.
    
    Use this to inspect the actual data values being stored.
    Helpful for debugging data format issues.
    """
    try:
        data = influx_client.query_data(
            measurement=measurement,
            time_range="1h",
            filters={"robot_id": robot_id}
        )
        
        if not data:
            return {
                "robot_id": robot_id,
                "measurement": measurement,
                "samples": [],
                "message": "No data found"
            }
        
        # Return latest samples
        samples = data[-limit:] if len(data) > limit else data
        
        return {
            "robot_id": robot_id,
            "measurement": measurement,
            "total_points": len(data),
            "samples": samples,
            "message": f"Showing {len(samples)} of {len(data)} data points"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")


@router.get("/expected-format")
async def get_expected_data_format():
    """
    Get the expected data format for robot sensor data.
    
    Use this as a reference when configuring your robot to send data.
    """
    return {
        "mqtt_topics": {
            "sensors": "tonypi/sensors/{sensor_type}",
            "status": "tonypi/status/{robot_id}",
            "location": "tonypi/location",
            "battery": "tonypi/battery",
            "scan": "tonypi/scan/{robot_id}",
            "job": "tonypi/job/{robot_id}"
        },
        "sensor_data_format": {
            "robot_id": "string (required)",
            "timestamp": "ISO 8601 datetime (optional, auto-generated if missing)",
            "value": "number",
            "unit": "string (optional)"
        },
        "status_data_format": {
            "robot_id": "string (required)",
            "status": "string: online|offline|idle|busy",
            "battery_level": "number: 0-100",
            "system_cpu_percent": "number: 0-100",
            "system_memory_percent": "number: 0-100",
            "system_temperature": "number: degrees Celsius",
            "location_x": "number (optional)",
            "location_y": "number (optional)"
        },
        "example_mqtt_publish": {
            "topic": "tonypi/status/tonypi_raspberrypi",
            "payload": {
                "robot_id": "tonypi_raspberrypi",
                "status": "online",
                "battery_level": 85.5,
                "system_cpu_percent": 45.2,
                "system_memory_percent": 62.1,
                "system_temperature": 52.3
            }
        },
        "notes": [
            "All numeric values should be valid JSON numbers (not strings)",
            "Timestamps should be in ISO 8601 format if provided",
            "Robot ID must be consistent across all messages",
            "MQTT broker: localhost:1883 (or mosquitto:1883 in Docker)"
        ]
    }


@router.get("/all-robots")
async def validate_all_robots(db: Session = Depends(get_db)):
    """
    Quick validation status for all registered robots.
    """
    robots = db.query(Robot).all()
    
    if not robots:
        return {
            "total_robots": 0,
            "message": "No robots registered in the system",
            "robots": []
        }
    
    results = []
    for robot in robots:
        # Check if robot has recent data
        try:
            data = influx_client.query_data(
                measurement="robot_status",
                time_range="1h",
                filters={"robot_id": robot.robot_id}
            )
            has_data = len(data) > 0 if data else False
        except:
            has_data = False
        
        # Check if recently active
        is_active = False
        if robot.last_seen:
            time_diff = datetime.utcnow() - robot.last_seen
            is_active = time_diff < timedelta(minutes=5)
        
        results.append({
            "robot_id": robot.robot_id,
            "name": robot.name,
            "status": robot.status,
            "last_seen": robot.last_seen.isoformat() if robot.last_seen else None,
            "has_influx_data": has_data,
            "is_active": is_active,
            "health": "HEALTHY" if (has_data and is_active) else "INACTIVE" if not is_active else "PARTIAL"
        })
    
    return {
        "total_robots": len(robots),
        "healthy": sum(1 for r in results if r["health"] == "HEALTHY"),
        "robots": results
    }








