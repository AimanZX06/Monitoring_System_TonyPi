"""
=============================================================================
Data Validation Router - Robot Data Integrity Verification
=============================================================================

This module provides REST API endpoints to validate and verify that robot data
is being correctly received, stored, and formatted in the monitoring system.

PURPOSE:
    When deploying or troubleshooting robots, you need to verify:
    1. Is the robot registered in the database?
    2. Is sensor data arriving in InfluxDB?
    3. Are data values within expected ranges?
    4. Is the robot actively communicating?

KEY ENDPOINTS:
    - GET /validate/robot/{robot_id}  - Full validation for one robot
    - GET /validate/data-sample/{robot_id} - Raw data inspection
    - GET /validate/expected-format   - Reference for data format
    - GET /validate/all-robots        - Quick status of all robots

VALIDATION WORKFLOW:
    ┌─────────────────────────────────────────────────────────────┐
    │                    Validation Process                       │
    ├─────────────────────────────────────────────────────────────┤
    │  1. Check PostgreSQL → Robot registered?                    │
    │  2. Check InfluxDB   → Sensor data present?                │
    │  3. Validate Ranges  → Values within expected bounds?       │
    │  4. Check Activity   → Recent communication?                │
    │  5. Return Status    → HEALTHY / PARTIAL / NO_DATA         │
    └─────────────────────────────────────────────────────────────┘
"""

# =============================================================================
# IMPORTS
# =============================================================================

# FastAPI framework components
from fastapi import APIRouter, HTTPException, Query, Depends
# APIRouter: Creates a modular router for grouping related endpoints
# HTTPException: Raises HTTP errors with status codes
# Query: Defines query parameters with validation/defaults
# Depends: Dependency injection for database sessions

# SQLAlchemy ORM for database interactions
from sqlalchemy.orm import Session  # Database session for queries

# Python type hints for better code documentation
from typing import Optional, Dict, Any, List

# Date/time handling for activity checks
from datetime import datetime, timedelta

# Pydantic for request/response data validation
from pydantic import BaseModel  # Base class for typed data models

# Internal imports - Database and models
from database.database import get_db        # Database session dependency
from database.influx_client import influx_client  # InfluxDB client for time-series
from models.robot import Robot              # Robot SQLAlchemy model
from models.job import Job                  # Job SQLAlchemy model

# =============================================================================
# ROUTER CONFIGURATION
# =============================================================================

# Create router with URL prefix and OpenAPI tag
# All endpoints in this file will be under /validate/*
# Tagged as "validation" in API documentation
router = APIRouter(prefix="/validate", tags=["validation"])


# =============================================================================
# PYDANTIC MODELS (Response Schemas)
# =============================================================================

class ValidationResult(BaseModel):
    """
    Result of a Single Data Validation Check
    
    Each validation check (PostgreSQL, InfluxDB, Activity) produces one of these
    objects to report its findings.
    
    ATTRIBUTES:
        valid (bool): True if this specific check passed
        source (str): Name of what was validated (e.g., "PostgreSQL", "InfluxDB")
        message (str): Human-readable description of the result
        data_sample (Dict): Optional sample of actual data for debugging
        timestamp (datetime): When this validation was performed
        issues (List[str]): List of specific problems found (empty if valid=True)
    """
    valid: bool                              # Did this check pass?
    source: str                              # What system was checked?
    message: str                             # What happened?
    data_sample: Optional[Dict[str, Any]] = None  # Sample data if available
    timestamp: datetime = datetime.now()     # When check was performed
    issues: List[str] = []                   # List of problems found


class RobotDataCheck(BaseModel):
    """
    Comprehensive Robot Data Validation Result
    
    This is the main response model returned by the validation endpoint.
    It aggregates results from all validation checks for a single robot.
    
    OVERALL_STATUS values:
        - "HEALTHY": All data sources working, no issues found
        - "PARTIAL": Some data sources working, some problems detected
        - "NO_DATA": Robot not sending any data or not registered
    
    ATTRIBUTES:
        robot_id (str): The robot being validated
        is_registered (bool): True if robot exists in PostgreSQL
        has_recent_data (bool): True if InfluxDB has recent sensor data
        last_seen (datetime): When robot last communicated (if known)
        data_sources (Dict): Status of each data source (postgresql, influxdb, etc.)
        validation_results (List): Detailed results from each check
        overall_status (str): Summary status - HEALTHY, PARTIAL, or NO_DATA
    """
    robot_id: str                            # Robot being validated
    is_registered: bool                      # Found in PostgreSQL?
    has_recent_data: bool                    # Has InfluxDB data?
    last_seen: Optional[datetime]            # Last communication time
    data_sources: Dict[str, bool]            # Status of each data source
    validation_results: List[ValidationResult]  # Detailed check results
    overall_status: str                      # HEALTHY / PARTIAL / NO_DATA


# =============================================================================
# VALIDATION ENDPOINTS
# =============================================================================

@router.get("/robot/{robot_id}", response_model=RobotDataCheck)
async def validate_robot_data(
    robot_id: str,
    time_range: str = Query("1h", description="Time range to check: 1h, 6h, 24h"),
    db: Session = Depends(get_db)
):
    """
    Validate All Data Sources for a Specific Robot
    
    This is the main validation endpoint. It performs a comprehensive check
    of all systems to verify a robot is properly connected and sending data.
    
    VALIDATION CHECKS:
        1. PostgreSQL Registration - Is the robot in the database?
        2. InfluxDB Time-Series    - Is sensor data being stored?
        3. Data Range Validation   - Are values within expected bounds?
        4. Activity Check          - Has robot communicated recently?
    
    PARAMETERS:
        robot_id (str): The unique identifier of the robot to validate
        time_range (str): How far back to check for data ("1h", "6h", "24h")
        db (Session): Database session (automatically injected)
    
    RETURNS:
        RobotDataCheck: Comprehensive validation results
    
    USE CASES:
        - Verify a newly deployed robot is working
        - Troubleshoot why a robot appears offline
        - Check data integrity after system changes
        - Automated health monitoring scripts
    
    EXAMPLE REQUEST:
        GET /validate/robot/tonypi_001?time_range=1h
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
                "location": robot.location if robot.location else None,
                "settings": robot.settings
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
        "job_data_format": {
            "robot_id": "string (required)",
            "task_name": "string: name of the task (e.g., 'find_red_ball', 'patrol')",
            "status": "string: started|in_progress|done|cancelled|failed",
            "phase": "string: scanning|searching|executing|done (optional)",
            "progress_percent": "number: 0-100 (or use 'percent' for legacy)",
            "elapsed_time": "number: seconds since job started (optional)",
            "estimated_duration": "number: expected total duration in seconds (optional)",
            "action_duration": "number: actual time taken on completion (optional)",
            "success": "boolean: whether task succeeded (on completion)",
            "cancel_reason": "string: reason for cancellation (if cancelled)"
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
        "example_job_events": {
            "job_start": {
                "topic": "tonypi/job/tonypi_01",
                "payload": {
                    "robot_id": "tonypi_01",
                    "task_name": "find_red_ball",
                    "status": "started",
                    "phase": "scanning",
                    "progress_percent": 0,
                    "estimated_duration": 30.0
                }
            },
            "job_progress": {
                "topic": "tonypi/job/tonypi_01",
                "payload": {
                    "robot_id": "tonypi_01",
                    "task_name": "find_red_ball",
                    "status": "in_progress",
                    "phase": "searching",
                    "progress_percent": 50,
                    "elapsed_time": 15.5
                }
            },
            "job_done": {
                "topic": "tonypi/job/tonypi_01",
                "payload": {
                    "robot_id": "tonypi_01",
                    "task_name": "find_red_ball",
                    "status": "done",
                    "phase": "done",
                    "progress_percent": 100,
                    "action_duration": 28.3,
                    "success": True
                }
            },
            "job_cancelled": {
                "topic": "tonypi/job/tonypi_01",
                "payload": {
                    "robot_id": "tonypi_01",
                    "task_name": "find_red_ball",
                    "status": "cancelled",
                    "progress_percent": 35,
                    "cancel_reason": "obstacle_detected"
                }
            }
        },
        "notes": [
            "All numeric values should be valid JSON numbers (not strings)",
            "Timestamps should be in ISO 8601 format if provided",
            "Robot ID must be consistent across all messages",
            "MQTT broker: localhost:1883 (or mosquitto:1883 in Docker)",
            "Job status accepts: 'done' or 'completed', 'cancelled' or 'canceled'",
            "Progress accepts: 'progress_percent' or 'percent' (legacy)"
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








