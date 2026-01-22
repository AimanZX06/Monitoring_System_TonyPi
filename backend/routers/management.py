"""
=============================================================================
Management Router - Robot Control and System Administration API
=============================================================================

This router provides endpoints for robot management operations including
command sending, configuration, emergency stop, and system status monitoring.

FEATURES:
    - Send commands to robots via MQTT
    - Emergency stop (individual or broadcast)
    - Resume after emergency stop
    - Robot configuration retrieval and updates
    - System status overview

COMMAND FLOW:
    1. Frontend calls /management/command with command data
    2. Backend publishes to MQTT topic: tonypi/commands/{robot_id}
    3. Robot receives command and executes
    4. Robot publishes response to: tonypi/commands/response

MQTT TOPICS USED:
    Outgoing (Backend → Robot):
        - tonypi/commands/{robot_id}        Command messages
        - tonypi/config/{robot_id}          Configuration updates
        - tonypi/emergency_stop/{robot_id}  Emergency stop (single robot)
        - tonypi/emergency_stop/broadcast   Emergency stop (all robots)
    
    Incoming (Robot → Backend):
        - tonypi/commands/response          Command acknowledgments

API ENDPOINTS:
    POST   /management/command                    - Send command to robot
    GET    /management/robots                     - List available robots
    GET    /management/robots/{id}/config         - Get robot configuration
    PUT    /management/robots/{id}/config         - Update robot configuration
    POST   /management/robots/{id}/emergency-stop - Stop specific robot
    POST   /management/robots/{id}/resume         - Resume after e-stop
    POST   /management/emergency-stop/broadcast   - Stop ALL robots
    GET    /management/system/status              - Get system overview

EMERGENCY STOP:
    Emergency stop immediately halts all robot motors and actions.
    Robot enters safe state and won't accept movement commands until resumed.
    Use POST /management/robots/{id}/resume to clear emergency state.
"""

# =============================================================================
# IMPORTS
# =============================================================================

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database.database import get_db
from mqtt.mqtt_client import mqtt_client

# =============================================================================
# ROUTER SETUP
# =============================================================================

router = APIRouter()

class RobotCommand(BaseModel):
    command: str
    parameters: Optional[dict] = None
    robot_id: str = "tonypi_01"

class CommandResponse(BaseModel):
    success: bool
    message: str
    command_id: Optional[str] = None

class EmergencyStopRequest(BaseModel):
    reason: str = "User triggered emergency stop"
    broadcast: bool = False  # If True, sends to all robots

class RobotConfig(BaseModel):
    robot_id: str
    config_type: str
    config_data: dict

class ConfigUpdate(BaseModel):
    config_type: str
    config_data: dict

@router.post("/management/command", response_model=CommandResponse)
async def send_command(command: RobotCommand):
    """Send a command to the robot via MQTT"""
    try:
        command_topic = f"tonypi/commands/{command.robot_id}"
        command_data = {
            "command": command.command,
            "parameters": command.parameters or {},
            "timestamp": datetime.now().isoformat(),
            "command_id": f"cmd_{int(datetime.now().timestamp())}"
        }
        
        success = mqtt_client.publish_command(command_topic, command_data)
        
        if success:
            return CommandResponse(
                success=True,
                message="Command sent successfully",
                command_id=command_data["command_id"]
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to send command")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending command: {str(e)}")

@router.get("/management/robots")
async def get_robots():
    """Get list of available robots"""
    try:
        # Mock data - replace with actual robot discovery
        robots = [
            {
                "robot_id": "tonypi_01",
                "name": "TonyPi Robot 01",
                "type": "HiWonder TonyPi",
                "status": "online",
                "last_seen": datetime.now(),
                "capabilities": ["navigation", "object_detection", "voice_control"],
                "battery_level": 85
            }
        ]
        
        return robots
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching robots: {str(e)}")

@router.get("/management/robots/{robot_id}/config")
async def get_robot_config(robot_id: str, db: Session = Depends(get_db)):
    """Get robot configuration"""
    try:
        # Mock configuration data
        config = {
            "robot_id": robot_id,
            "navigation": {
                "max_speed": 1.5,
                "obstacle_avoidance": True,
                "path_planning": "A*"
            },
            "sensors": {
                "camera_fps": 30,
                "lidar_frequency": 10,
                "imu_rate": 100
            },
            "behavior": {
                "auto_charging": True,
                "patrol_mode": False,
                "voice_response": True
            }
        }
        
        return config
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching robot config: {str(e)}")

@router.put("/management/robots/{robot_id}/config")
async def update_robot_config(
    robot_id: str, 
    config_update: ConfigUpdate, 
    db: Session = Depends(get_db)
):
    """Update robot configuration"""
    try:
        # Send configuration update via MQTT
        config_topic = f"tonypi/config/{robot_id}"
        config_data = {
            "config_type": config_update.config_type,
            "config_data": config_update.config_data,
            "timestamp": datetime.now().isoformat()
        }
        
        success = mqtt_client.publish_command(config_topic, config_data)
        
        if success:
            return {"message": "Configuration updated successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update configuration")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating config: {str(e)}")

@router.post("/management/robots/{robot_id}/emergency-stop")
async def emergency_stop(robot_id: str, request: EmergencyStopRequest = None):
    """
    Emergency stop command - immediately stops all robot motors and actions.
    
    The robot will acknowledge on tonypi/commands/response topic.
    
    Args:
        robot_id: Robot identifier (use 'broadcast' to stop all robots)
        request: Optional request body with reason and broadcast flag
    """
    try:
        if request is None:
            request = EmergencyStopRequest()
        
        command_id = f"emg_{int(datetime.now().timestamp())}"
        
        # Determine topic based on broadcast flag or robot_id
        if request.broadcast or robot_id == "broadcast":
            topic = "tonypi/emergency_stop/broadcast"
        else:
            topic = f"tonypi/emergency_stop/{robot_id}"
        
        # Use the format expected by tonypi_client
        command_data = {
            "type": "emergency_stop",
            "reason": request.reason,
            "id": command_id,
            "timestamp": datetime.now().isoformat()
        }
        
        success = mqtt_client.publish_command(topic, command_data)
        
        if success:
            return CommandResponse(
                success=True,
                message=f"Emergency stop sent to {'all robots' if request.broadcast or robot_id == 'broadcast' else robot_id}",
                command_id=command_id
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to send emergency stop")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing emergency stop: {str(e)}")


@router.post("/management/robots/{robot_id}/resume")
async def resume_robot(robot_id: str):
    """
    Resume robot after emergency stop - clears emergency state and allows robot to operate.
    
    The robot will acknowledge on tonypi/commands/response topic.
    
    Args:
        robot_id: Robot identifier to resume
    """
    try:
        command_id = f"rsm_{int(datetime.now().timestamp())}"
        topic = f"tonypi/commands/{robot_id}"
        
        # Use the format expected by tonypi_client
        command_data = {
            "type": "resume",
            "id": command_id,
            "timestamp": datetime.now().isoformat()
        }
        
        success = mqtt_client.publish_command(topic, command_data)
        
        if success:
            return CommandResponse(
                success=True,
                message=f"Resume command sent to {robot_id}",
                command_id=command_id
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to send resume command")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending resume command: {str(e)}")

@router.post("/management/emergency-stop/broadcast")
async def broadcast_emergency_stop(request: EmergencyStopRequest = None):
    """
    Broadcast emergency stop to ALL robots.
    
    This is a convenience endpoint that sends emergency stop to all connected robots.
    """
    if request is None:
        request = EmergencyStopRequest(reason="Broadcast emergency stop", broadcast=True)
    request.broadcast = True
    return await emergency_stop("broadcast", request)


@router.get("/management/system/status")
async def get_system_status():
    """Get overall system status"""
    try:
        status = {
            "system_uptime": "2 days, 14 hours",
            "active_robots": 1,
            "total_commands_today": 45,
            "system_health": "healthy",
            "services": {
                "mqtt_broker": "running",
                "influxdb": "running",
                "postgres": "running",
                "grafana": "running"
            },
            "resource_usage": {
                "cpu_percent": 25,
                "memory_percent": 60,
                "disk_usage_percent": 35
            }
        }
        
        return status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching system status: {str(e)}")