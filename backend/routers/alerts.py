"""
Alerts Router - Manage alerts, notifications, and thresholds
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from database.database import get_db
from models.alert import Alert, AlertThreshold

router = APIRouter()


# Pydantic models for request/response
class AlertResponse(BaseModel):
    id: int
    robot_id: Optional[str]
    alert_type: str
    severity: str
    title: str
    message: str
    source: Optional[str]
    value: Optional[float]
    threshold: Optional[float]
    acknowledged: bool
    acknowledged_by: Optional[str]
    acknowledged_at: Optional[datetime]
    resolved: bool
    resolved_at: Optional[datetime]
    details: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class AlertCreate(BaseModel):
    robot_id: Optional[str] = None
    alert_type: str
    severity: str  # critical, warning, info
    title: str
    message: str
    source: Optional[str] = None
    value: Optional[float] = None
    threshold: Optional[float] = None
    details: Optional[dict] = None


class ThresholdResponse(BaseModel):
    id: int
    robot_id: Optional[str]
    metric_type: str
    warning_threshold: float
    critical_threshold: float
    enabled: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ThresholdCreate(BaseModel):
    robot_id: Optional[str] = None
    metric_type: str
    warning_threshold: float
    critical_threshold: float
    enabled: bool = True


class ThresholdUpdate(BaseModel):
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    enabled: Optional[bool] = None


class AlertStats(BaseModel):
    total: int
    critical: int
    warning: int
    info: int
    unacknowledged: int
    unresolved: int


# Default thresholds
DEFAULT_THRESHOLDS = {
    'cpu': {'warning': 70, 'critical': 90},
    'memory': {'warning': 75, 'critical': 90},
    'temperature': {'warning': 60, 'critical': 75},
    'battery': {'warning': 30, 'critical': 15},
    'servo_temp': {'warning': 50, 'critical': 70},
    'servo_voltage': {'warning': 5.5, 'critical': 5.0},
}


@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    robot_id: Optional[str] = Query(None),
    alert_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    acknowledged: Optional[bool] = Query(None),
    resolved: Optional[bool] = Query(None),
    time_range: str = Query("24h"),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    """Get alerts with optional filtering"""
    try:
        query = db.query(Alert)
        
        # Apply filters
        if robot_id:
            query = query.filter(Alert.robot_id == robot_id)
        if alert_type:
            query = query.filter(Alert.alert_type == alert_type)
        if severity:
            query = query.filter(Alert.severity == severity)
        if acknowledged is not None:
            query = query.filter(Alert.acknowledged == acknowledged)
        if resolved is not None:
            query = query.filter(Alert.resolved == resolved)
        
        # Time filter
        time_map = {'1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720}
        hours = time_map.get(time_range, 24)
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(Alert.created_at >= cutoff)
        
        alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()
        return [AlertResponse.model_validate(a) for a in alerts]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")


@router.get("/alerts/stats", response_model=AlertStats)
async def get_alert_stats(
    robot_id: Optional[str] = Query(None),
    time_range: str = Query("24h"),
    db: Session = Depends(get_db)
):
    """Get alert statistics"""
    try:
        # Time filter
        time_map = {'1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720}
        hours = time_map.get(time_range, 24)
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        query = db.query(Alert).filter(Alert.created_at >= cutoff)
        if robot_id:
            query = query.filter(Alert.robot_id == robot_id)
        
        alerts = query.all()
        
        return AlertStats(
            total=len(alerts),
            critical=len([a for a in alerts if a.severity == 'critical']),
            warning=len([a for a in alerts if a.severity == 'warning']),
            info=len([a for a in alerts if a.severity == 'info']),
            unacknowledged=len([a for a in alerts if not a.acknowledged]),
            unresolved=len([a for a in alerts if not a.resolved])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alert stats: {str(e)}")


@router.post("/alerts", response_model=AlertResponse)
async def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    """Create a new alert"""
    try:
        db_alert = Alert(
            robot_id=alert.robot_id,
            alert_type=alert.alert_type,
            severity=alert.severity,
            title=alert.title,
            message=alert.message,
            source=alert.source,
            value=alert.value,
            threshold=alert.threshold,
            details=alert.details
        )
        
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)
        
        return AlertResponse.model_validate(db_alert)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating alert: {str(e)}")


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    acknowledged_by: str = Query("system"),
    db: Session = Depends(get_db)
):
    """Acknowledge an alert"""
    try:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
        
        alert.acknowledged = True
        alert.acknowledged_by = acknowledged_by
        alert.acknowledged_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": f"Alert {alert_id} acknowledged", "acknowledged_by": acknowledged_by}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error acknowledging alert: {str(e)}")


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as resolved"""
    try:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
        
        alert.resolved = True
        alert.resolved_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": f"Alert {alert_id} resolved"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resolving alert: {str(e)}")


@router.post("/alerts/acknowledge-all")
async def acknowledge_all_alerts(
    robot_id: Optional[str] = Query(None),
    acknowledged_by: str = Query("system"),
    db: Session = Depends(get_db)
):
    """Acknowledge all unacknowledged alerts"""
    try:
        query = db.query(Alert).filter(Alert.acknowledged == False)
        if robot_id:
            query = query.filter(Alert.robot_id == robot_id)
        
        count = query.update({
            Alert.acknowledged: True,
            Alert.acknowledged_by: acknowledged_by,
            Alert.acknowledged_at: datetime.utcnow()
        })
        
        db.commit()
        
        return {"message": f"Acknowledged {count} alerts"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error acknowledging alerts: {str(e)}")


@router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    """Delete an alert"""
    try:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
        
        db.delete(alert)
        db.commit()
        
        return {"message": f"Alert {alert_id} deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting alert: {str(e)}")


# Threshold management
@router.get("/alerts/thresholds", response_model=List[ThresholdResponse])
async def get_thresholds(
    robot_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get alert thresholds"""
    try:
        query = db.query(AlertThreshold)
        if robot_id:
            query = query.filter(
                (AlertThreshold.robot_id == robot_id) | (AlertThreshold.robot_id == None)
            )
        
        thresholds = query.all()
        return [ThresholdResponse.model_validate(t) for t in thresholds]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching thresholds: {str(e)}")


@router.get("/alerts/thresholds/defaults")
async def get_default_thresholds():
    """Get default threshold values"""
    return DEFAULT_THRESHOLDS


@router.post("/alerts/thresholds", response_model=ThresholdResponse)
async def create_threshold(threshold: ThresholdCreate, db: Session = Depends(get_db)):
    """Create or update a threshold"""
    try:
        # Check if threshold already exists for this robot and metric
        existing = db.query(AlertThreshold).filter(
            and_(
                AlertThreshold.robot_id == threshold.robot_id,
                AlertThreshold.metric_type == threshold.metric_type
            )
        ).first()
        
        if existing:
            # Update existing
            existing.warning_threshold = threshold.warning_threshold
            existing.critical_threshold = threshold.critical_threshold
            existing.enabled = threshold.enabled
            db.commit()
            db.refresh(existing)
            return ThresholdResponse.model_validate(existing)
        
        # Create new
        db_threshold = AlertThreshold(
            robot_id=threshold.robot_id,
            metric_type=threshold.metric_type,
            warning_threshold=threshold.warning_threshold,
            critical_threshold=threshold.critical_threshold,
            enabled=threshold.enabled
        )
        
        db.add(db_threshold)
        db.commit()
        db.refresh(db_threshold)
        
        return ThresholdResponse.model_validate(db_threshold)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating threshold: {str(e)}")


@router.put("/alerts/thresholds/{threshold_id}", response_model=ThresholdResponse)
async def update_threshold(
    threshold_id: int,
    update: ThresholdUpdate,
    db: Session = Depends(get_db)
):
    """Update a threshold"""
    try:
        threshold = db.query(AlertThreshold).filter(AlertThreshold.id == threshold_id).first()
        if not threshold:
            raise HTTPException(status_code=404, detail=f"Threshold {threshold_id} not found")
        
        if update.warning_threshold is not None:
            threshold.warning_threshold = update.warning_threshold
        if update.critical_threshold is not None:
            threshold.critical_threshold = update.critical_threshold
        if update.enabled is not None:
            threshold.enabled = update.enabled
        
        db.commit()
        db.refresh(threshold)
        
        return ThresholdResponse.model_validate(threshold)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating threshold: {str(e)}")


@router.delete("/alerts/thresholds/{threshold_id}")
async def delete_threshold(threshold_id: int, db: Session = Depends(get_db)):
    """Delete a threshold"""
    try:
        threshold = db.query(AlertThreshold).filter(AlertThreshold.id == threshold_id).first()
        if not threshold:
            raise HTTPException(status_code=404, detail=f"Threshold {threshold_id} not found")
        
        db.delete(threshold)
        db.commit()
        
        return {"message": f"Threshold {threshold_id} deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting threshold: {str(e)}")


@router.post("/alerts/thresholds/init-defaults")
async def init_default_thresholds(db: Session = Depends(get_db)):
    """Initialize default thresholds if they don't exist"""
    try:
        created = 0
        for metric_type, values in DEFAULT_THRESHOLDS.items():
            existing = db.query(AlertThreshold).filter(
                and_(
                    AlertThreshold.robot_id == None,
                    AlertThreshold.metric_type == metric_type
                )
            ).first()
            
            if not existing:
                db_threshold = AlertThreshold(
                    robot_id=None,
                    metric_type=metric_type,
                    warning_threshold=values['warning'],
                    critical_threshold=values['critical'],
                    enabled=True
                )
                db.add(db_threshold)
                created += 1
        
        db.commit()
        
        return {"message": f"Initialized {created} default thresholds"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error initializing thresholds: {str(e)}")
