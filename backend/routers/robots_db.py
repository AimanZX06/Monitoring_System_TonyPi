"""
API router for robot configuration and management with PostgreSQL
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from models.robot import Robot
from models.system_log import SystemLog
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/robots-db", tags=["robots-database"])


# Pydantic models for request/response
class RobotCreate(BaseModel):
    robot_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    battery_threshold_low: Optional[float] = 20.0
    battery_threshold_critical: Optional[float] = 10.0
    temp_threshold_warning: Optional[float] = 70.0
    temp_threshold_critical: Optional[float] = 80.0


class RobotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    battery_threshold_low: Optional[float] = None
    battery_threshold_critical: Optional[float] = None
    temp_threshold_warning: Optional[float] = None
    temp_threshold_critical: Optional[float] = None
    is_active: Optional[bool] = None


@router.get("/robots")
def get_all_robots(db: Session = Depends(get_db)):
    """Get all robots from PostgreSQL"""
    robots = db.query(Robot).filter(Robot.is_active == True).all()
    return [robot.to_dict() for robot in robots]


@router.get("/robots/{robot_id}")
def get_robot(robot_id: str, db: Session = Depends(get_db)):
    """Get specific robot by ID"""
    robot = db.query(Robot).filter(Robot.robot_id == robot_id).first()
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    return robot.to_dict()


@router.post("/robots")
def create_robot(robot_data: RobotCreate, db: Session = Depends(get_db)):
    """Create a new robot"""
    # Check if robot already exists
    existing = db.query(Robot).filter(Robot.robot_id == robot_data.robot_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Robot already exists")
    
    robot = Robot(
        robot_id=robot_data.robot_id,
        name=robot_data.name or robot_data.robot_id,
        description=robot_data.description,
        location=robot_data.location,
        battery_threshold_low=robot_data.battery_threshold_low,
        battery_threshold_critical=robot_data.battery_threshold_critical,
        temp_threshold_warning=robot_data.temp_threshold_warning,
        temp_threshold_critical=robot_data.temp_threshold_critical
    )
    
    db.add(robot)
    db.commit()
    db.refresh(robot)
    
    # Log creation
    log = SystemLog(
        level='INFO',
        category='api',
        message=f'Robot created: {robot_data.robot_id}',
        robot_id=robot_data.robot_id
    )
    db.add(log)
    db.commit()
    
    return robot.to_dict()


@router.put("/robots/{robot_id}")
def update_robot(robot_id: str, robot_data: RobotUpdate, db: Session = Depends(get_db)):
    """Update robot configuration"""
    robot = db.query(Robot).filter(Robot.robot_id == robot_id).first()
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    
    # Update fields if provided
    if robot_data.name is not None:
        robot.name = robot_data.name
    if robot_data.description is not None:
        robot.description = robot_data.description
    if robot_data.location is not None:
        robot.location = robot_data.location
    if robot_data.status is not None:
        robot.status = robot_data.status
    if robot_data.battery_threshold_low is not None:
        robot.battery_threshold_low = robot_data.battery_threshold_low
    if robot_data.battery_threshold_critical is not None:
        robot.battery_threshold_critical = robot_data.battery_threshold_critical
    if robot_data.temp_threshold_warning is not None:
        robot.temp_threshold_warning = robot_data.temp_threshold_warning
    if robot_data.temp_threshold_critical is not None:
        robot.temp_threshold_critical = robot_data.temp_threshold_critical
    if robot_data.is_active is not None:
        robot.is_active = robot_data.is_active
    
    db.commit()
    db.refresh(robot)
    
    # Log update
    log = SystemLog(
        level='INFO',
        category='api',
        message=f'Robot updated: {robot_id}',
        robot_id=robot_id,
        details=robot_data.dict(exclude_none=True)
    )
    db.add(log)
    db.commit()
    
    return robot.to_dict()


@router.delete("/robots/{robot_id}")
def delete_robot(robot_id: str, db: Session = Depends(get_db)):
    """Soft delete a robot (sets is_active=False)"""
    robot = db.query(Robot).filter(Robot.robot_id == robot_id).first()
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    
    robot.is_active = False
    db.commit()
    
    # Log deletion
    log = SystemLog(
        level='INFO',
        category='api',
        message=f'Robot deleted: {robot_id}',
        robot_id=robot_id
    )
    db.add(log)
    db.commit()
    
    return {"message": "Robot deleted successfully"}


@router.get("/logs")
def get_system_logs(
    limit: int = 100,
    level: Optional[str] = None,
    category: Optional[str] = None,
    robot_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get system logs with optional filters"""
    query = db.query(SystemLog)
    
    if level:
        query = query.filter(SystemLog.level == level.upper())
    if category:
        query = query.filter(SystemLog.category == category)
    if robot_id:
        query = query.filter(SystemLog.robot_id == robot_id)
    
    logs = query.order_by(SystemLog.timestamp.desc()).limit(limit).all()
    return [log.to_dict() for log in logs]


@router.get("/jobs/history")
def get_job_history(
    limit: int = 50,
    robot_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get job history from PostgreSQL"""
    from models.job import Job
    
    query = db.query(Job)
    
    if robot_id:
        query = query.filter(Job.robot_id == robot_id)
    
    jobs = query.order_by(Job.created_at.desc()).limit(limit).all()
    return [job.to_dict() for job in jobs]


@router.get("/stats")
def get_database_stats(db: Session = Depends(get_db)):
    """Get database statistics"""
    from models.job import Job
    from datetime import date
    
    today = date.today()
    
    total_robots = db.query(Robot).filter(Robot.is_active == True).count()
    online_robots = db.query(Robot).filter(Robot.status == 'online', Robot.is_active == True).count()
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.status == 'active').count()
    completed_today = db.query(Job).filter(
        Job.status == 'completed',
        Job.end_time >= datetime.combine(today, datetime.min.time())
    ).count()
    
    return {
        "total_robots": total_robots,
        "online_robots": online_robots,
        "offline_robots": total_robots - online_robots,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "completed_jobs_today": completed_today
    }
