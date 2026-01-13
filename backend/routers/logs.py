"""
Logs Router - System logs, command history, and audit trail
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from database.database import get_db
from models.system_log import SystemLog
import io
import json
import csv

router = APIRouter()


# Pydantic models
class LogResponse(BaseModel):
    id: int
    level: str
    category: str
    message: str
    robot_id: Optional[str]
    details: Optional[dict]
    timestamp: datetime

    class Config:
        from_attributes = True


class LogCreate(BaseModel):
    level: str  # INFO, WARNING, ERROR, CRITICAL
    category: str  # mqtt, api, database, system, command, robot
    message: str
    robot_id: Optional[str] = None
    details: Optional[dict] = None


class LogStats(BaseModel):
    total: int
    info: int
    warning: int
    error: int
    critical: int
    by_category: dict


class CommandLog(BaseModel):
    id: int
    command: str
    robot_id: Optional[str]
    status: str
    timestamp: datetime
    details: Optional[dict]


# Log levels with colors for frontend
LOG_LEVELS = {
    'INFO': {'color': 'blue', 'priority': 1},
    'WARNING': {'color': 'yellow', 'priority': 2},
    'ERROR': {'color': 'red', 'priority': 3},
    'CRITICAL': {'color': 'purple', 'priority': 4}
}

# Log categories
LOG_CATEGORIES = ['mqtt', 'api', 'database', 'system', 'command', 'robot', 'alert', 'report']


@router.get("/logs", response_model=List[LogResponse])
async def get_logs(
    level: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    robot_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    time_range: str = Query("24h"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    """Get system logs with filtering"""
    try:
        query = db.query(SystemLog)
        
        # Apply filters
        if level:
            query = query.filter(SystemLog.level == level.upper())
        if category:
            query = query.filter(SystemLog.category == category.lower())
        if robot_id:
            query = query.filter(SystemLog.robot_id == robot_id)
        if search:
            query = query.filter(SystemLog.message.ilike(f"%{search}%"))
        
        # Time filter
        time_map = {'1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720}
        hours = time_map.get(time_range, 24)
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(SystemLog.timestamp >= cutoff)
        
        logs = query.order_by(desc(SystemLog.timestamp)).offset(offset).limit(limit).all()
        return [LogResponse.model_validate(log) for log in logs]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching logs: {str(e)}")


@router.get("/logs/stats", response_model=LogStats)
async def get_log_stats(
    time_range: str = Query("24h"),
    robot_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get log statistics"""
    try:
        # Time filter
        time_map = {'1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720}
        hours = time_map.get(time_range, 24)
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        query = db.query(SystemLog).filter(SystemLog.timestamp >= cutoff)
        if robot_id:
            query = query.filter(SystemLog.robot_id == robot_id)
        
        logs = query.all()
        
        # Count by category
        by_category = {}
        for cat in LOG_CATEGORIES:
            by_category[cat] = len([l for l in logs if l.category == cat])
        
        return LogStats(
            total=len(logs),
            info=len([l for l in logs if l.level == 'INFO']),
            warning=len([l for l in logs if l.level == 'WARNING']),
            error=len([l for l in logs if l.level == 'ERROR']),
            critical=len([l for l in logs if l.level == 'CRITICAL']),
            by_category=by_category
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching log stats: {str(e)}")


@router.post("/logs", response_model=LogResponse)
async def create_log(log: LogCreate, db: Session = Depends(get_db)):
    """Create a new log entry"""
    try:
        db_log = SystemLog(
            level=log.level.upper(),
            category=log.category.lower(),
            message=log.message,
            robot_id=log.robot_id,
            details=log.details
        )
        
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        
        return LogResponse.model_validate(db_log)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating log: {str(e)}")


@router.get("/logs/categories")
async def get_log_categories():
    """Get available log categories"""
    return LOG_CATEGORIES


@router.get("/logs/levels")
async def get_log_levels():
    """Get available log levels with metadata"""
    return LOG_LEVELS


@router.get("/logs/commands", response_model=List[LogResponse])
async def get_command_history(
    robot_id: Optional[str] = Query(None),
    time_range: str = Query("24h"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """Get command history"""
    try:
        query = db.query(SystemLog).filter(SystemLog.category == 'command')
        
        if robot_id:
            query = query.filter(SystemLog.robot_id == robot_id)
        
        # Time filter
        time_map = {'1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720}
        hours = time_map.get(time_range, 24)
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(SystemLog.timestamp >= cutoff)
        
        logs = query.order_by(desc(SystemLog.timestamp)).limit(limit).all()
        return [LogResponse.model_validate(log) for log in logs]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching command history: {str(e)}")


@router.get("/logs/errors", response_model=List[LogResponse])
async def get_error_logs(
    robot_id: Optional[str] = Query(None),
    time_range: str = Query("24h"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """Get error logs (ERROR and CRITICAL levels)"""
    try:
        query = db.query(SystemLog).filter(
            or_(SystemLog.level == 'ERROR', SystemLog.level == 'CRITICAL')
        )
        
        if robot_id:
            query = query.filter(SystemLog.robot_id == robot_id)
        
        # Time filter
        time_map = {'1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720}
        hours = time_map.get(time_range, 24)
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(SystemLog.timestamp >= cutoff)
        
        logs = query.order_by(desc(SystemLog.timestamp)).limit(limit).all()
        return [LogResponse.model_validate(log) for log in logs]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching error logs: {str(e)}")


@router.delete("/logs/clear")
async def clear_old_logs(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Clear logs older than specified days"""
    try:
        cutoff = datetime.utcnow() - timedelta(days=days)
        count = db.query(SystemLog).filter(SystemLog.timestamp < cutoff).delete()
        db.commit()
        
        return {"message": f"Deleted {count} logs older than {days} days"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error clearing logs: {str(e)}")


@router.get("/logs/export/json")
async def export_logs_json(
    time_range: str = Query("24h"),
    level: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    robot_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Export logs as JSON"""
    try:
        query = db.query(SystemLog)
        
        # Apply filters
        if level:
            query = query.filter(SystemLog.level == level.upper())
        if category:
            query = query.filter(SystemLog.category == category.lower())
        if robot_id:
            query = query.filter(SystemLog.robot_id == robot_id)
        
        # Time filter
        time_map = {'1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720}
        hours = time_map.get(time_range, 24)
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(SystemLog.timestamp >= cutoff)
        
        logs = query.order_by(desc(SystemLog.timestamp)).all()
        
        # Convert to dict list
        log_data = [log.to_dict() for log in logs]
        
        json_content = json.dumps(log_data, indent=2, default=str)
        
        return StreamingResponse(
            io.BytesIO(json_content.encode()),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=system_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting logs: {str(e)}")


@router.get("/logs/export/csv")
async def export_logs_csv(
    time_range: str = Query("24h"),
    level: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    robot_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Export logs as CSV"""
    try:
        query = db.query(SystemLog)
        
        # Apply filters
        if level:
            query = query.filter(SystemLog.level == level.upper())
        if category:
            query = query.filter(SystemLog.category == category.lower())
        if robot_id:
            query = query.filter(SystemLog.robot_id == robot_id)
        
        # Time filter
        time_map = {'1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720}
        hours = time_map.get(time_range, 24)
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(SystemLog.timestamp >= cutoff)
        
        logs = query.order_by(desc(SystemLog.timestamp)).all()
        
        if not logs:
            raise HTTPException(status_code=404, detail="No logs found")
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['ID', 'Timestamp', 'Level', 'Category', 'Robot ID', 'Message', 'Details'])
        
        # Data rows
        for log in logs:
            writer.writerow([
                log.id,
                log.timestamp.isoformat() if log.timestamp else '',
                log.level,
                log.category,
                log.robot_id or '',
                log.message,
                json.dumps(log.details) if log.details else ''
            ])
        
        csv_content = output.getvalue()
        output.close()
        
        return StreamingResponse(
            io.BytesIO(csv_content.encode()),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=system_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting logs: {str(e)}")


# Utility function to log from other modules
def log_event(db: Session, level: str, category: str, message: str, 
              robot_id: str = None, details: dict = None):
    """Utility function to create a log entry from other modules"""
    try:
        db_log = SystemLog(
            level=level.upper(),
            category=category.lower(),
            message=message,
            robot_id=robot_id,
            details=details
        )
        db.add(db_log)
        db.commit()
        return db_log
    except Exception as e:
        db.rollback()
        print(f"Failed to log event: {e}")
        return None
