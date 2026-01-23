"""
=============================================================================
Robots Database Router - Robot Configuration and Management API
=============================================================================

This router provides CRUD (Create, Read, Update, Delete) operations for robot
configuration stored in PostgreSQL. It manages robot metadata, thresholds,
and provides database statistics.

DIFFERENCE FROM robot_data.py:
    - robot_data.py:  Real-time telemetry from InfluxDB (sensor readings)
    - robots_db.py:   Static configuration in PostgreSQL (thresholds, names)

FEATURES:
    - Robot CRUD operations (create, read, update, soft-delete)
    - Configurable alert thresholds per robot
    - System log retrieval
    - Job history from PostgreSQL
    - Database statistics dashboard

ROBOT CONFIGURATION FIELDS:
    Basic Info:
        - robot_id:    Unique identifier (e.g., "tonypi_001")
        - name:        Human-readable name (e.g., "TonyPi #1")
        - description: Optional description
        - location:    Physical location
    
    Alert Thresholds:
        - battery_threshold_low:      Low battery warning (default: 20%)
        - battery_threshold_critical: Critical battery alert (default: 10%)
        - temp_threshold_warning:     Temperature warning (default: 70°C)
        - temp_threshold_critical:    Critical temperature (default: 80°C)

API ENDPOINTS:
    GET    /robots-db/robots          - List all active robots
    GET    /robots-db/robots/{id}     - Get specific robot
    POST   /robots-db/robots          - Create new robot
    PUT    /robots-db/robots/{id}     - Update robot configuration
    DELETE /robots-db/robots/{id}     - Soft-delete robot (is_active=False)
    GET    /robots-db/logs            - Get system logs with filters
    GET    /robots-db/jobs/history    - Get job history
    GET    /robots-db/stats           - Get database statistics

NOTE: Delete is soft-delete (sets is_active=False) to preserve history.
"""

# =============================================================================
# IMPORTS
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from models.robot import Robot
from models.system_log import SystemLog
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

# =============================================================================
# ROUTER SETUP
# =============================================================================

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


@router.get("/jobs/cumulative-stats")
def get_cumulative_job_stats(
    robot_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get cumulative job statistics across all jobs (not just current job).
    
    This endpoint returns accumulated totals for:
    - Total items processed (sum of items_done across all completed jobs)
    - Total items target (sum of items_total across all jobs)
    - Total jobs completed
    - Total jobs cancelled/failed
    - Average job duration
    - Total run time
    
    Unlike /job-summary which only returns the current/latest job,
    this endpoint accumulates data across all historical jobs.
    """
    from models.job import Job
    from sqlalchemy import func
    
    query = db.query(Job)
    
    if robot_id:
        query = query.filter(Job.robot_id == robot_id)
    
    # Get all jobs for calculating cumulative stats
    all_jobs = query.all()
    
    # Calculate cumulative stats
    total_items_done = sum(j.items_done or 0 for j in all_jobs)
    total_items_target = sum(j.items_total or 0 for j in all_jobs)
    completed_jobs = [j for j in all_jobs if j.status == 'completed']
    cancelled_jobs = [j for j in all_jobs if j.status == 'cancelled']
    failed_jobs = [j for j in all_jobs if j.status == 'failed']
    active_jobs = [j for j in all_jobs if j.status == 'active']
    
    # Calculate total duration (only from jobs with both start and end time)
    total_duration_seconds = 0
    durations = []
    for job in all_jobs:
        if job.start_time and job.end_time:
            duration = (job.end_time - job.start_time).total_seconds()
            total_duration_seconds += duration
            durations.append(duration)
    
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    # Get current/active job if any (for real-time display)
    current_job = None
    if robot_id:
        current_job_db = db.query(Job).filter(
            Job.robot_id == robot_id,
            Job.status == 'active'
        ).first()
        if current_job_db:
            current_job = current_job_db.to_dict()
    
    return {
        "robot_id": robot_id,
        "cumulative": {
            "total_jobs": len(all_jobs),
            "completed_jobs": len(completed_jobs),
            "cancelled_jobs": len(cancelled_jobs),
            "failed_jobs": len(failed_jobs),
            "active_jobs": len(active_jobs),
            "total_items_done": total_items_done,
            "total_items_target": total_items_target,
            "total_duration_seconds": round(total_duration_seconds, 2),
            "average_duration_seconds": round(avg_duration, 2)
        },
        "current_job": current_job
    }


@router.get("/jobs/overall-stats")
def get_overall_job_stats(db: Session = Depends(get_db)):
    """Get overall cumulative stats across ALL robots and ALL jobs.
    
    Returns aggregated statistics useful for dashboard summary cards.
    """
    from models.job import Job
    
    all_jobs = db.query(Job).all()
    
    # Group by robot
    robots_with_jobs = set(j.robot_id for j in all_jobs)
    
    # Calculate totals
    total_items_done = sum(j.items_done or 0 for j in all_jobs)
    total_items_target = sum(j.items_total or 0 for j in all_jobs)
    completed_jobs = [j for j in all_jobs if j.status == 'completed']
    active_jobs = [j for j in all_jobs if j.status == 'active']
    
    # Calculate total duration
    total_duration_seconds = 0
    for job in all_jobs:
        if job.start_time and job.end_time:
            total_duration_seconds += (job.end_time - job.start_time).total_seconds()
    
    # Average completion percentage (only for jobs that have started)
    jobs_with_progress = [j for j in all_jobs if j.percent_complete is not None]
    avg_completion = sum(j.percent_complete for j in jobs_with_progress) / len(jobs_with_progress) if jobs_with_progress else 0
    
    return {
        "total_robots_with_jobs": len(robots_with_jobs),
        "total_jobs": len(all_jobs),
        "active_jobs": len(active_jobs),
        "completed_jobs": len(completed_jobs),
        "total_items_done": total_items_done,
        "total_items_target": total_items_target,
        "total_duration_seconds": round(total_duration_seconds, 2),
        "average_completion_percent": round(avg_completion, 2)
    }


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
