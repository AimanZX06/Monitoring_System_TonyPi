from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database.database import get_db
from mqtt.mqtt_client import mqtt_client

router = APIRouter()

class RobotCommand(BaseModel):
    command: str
    parameters: Optional[dict] = None
    robot_id: str = "tonypi_01"

class CommandResponse(BaseModel):
    success: bool
    message: str
    command_id: Optional[str] = None

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
async def emergency_stop(robot_id: str):
    """Emergency stop command"""
    try:
        emergency_command = RobotCommand(
            command="emergency_stop",
            robot_id=robot_id
        )
        
        return await send_command(emergency_command)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing emergency stop: {str(e)}")

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