"""
Alert model for PostgreSQL storage
Stores system alerts, notifications, and threshold configurations
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Float
from sqlalchemy.sql import func
from database.database import Base


class Alert(Base):
    """Alert records for the monitoring system"""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(String, index=True, nullable=True)
    alert_type = Column(String, index=True, nullable=False)  # temperature, battery, servo, system
    severity = Column(String, index=True, nullable=False)  # critical, warning, info
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    source = Column(String, nullable=True)  # e.g., servo_1, cpu, battery
    value = Column(Float, nullable=True)  # The value that triggered the alert
    threshold = Column(Float, nullable=True)  # The threshold that was exceeded
    acknowledged = Column(Boolean, default=False, index=True)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'robot_id': self.robot_id,
            'alert_type': self.alert_type,
            'severity': self.severity,
            'title': self.title,
            'message': self.message,
            'source': self.source,
            'value': self.value,
            'threshold': self.threshold,
            'acknowledged': self.acknowledged,
            'acknowledged_by': self.acknowledged_by,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'resolved': self.resolved,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AlertThreshold(Base):
    """Configurable alert thresholds per robot"""
    __tablename__ = "alert_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(String, index=True, nullable=True)  # null = global default
    metric_type = Column(String, index=True, nullable=False)  # cpu, memory, temperature, battery, servo_temp
    warning_threshold = Column(Float, nullable=False)
    critical_threshold = Column(Float, nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'robot_id': self.robot_id,
            'metric_type': self.metric_type,
            'warning_threshold': self.warning_threshold,
            'critical_threshold': self.critical_threshold,
            'enabled': self.enabled,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
