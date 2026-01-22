"""
Alert Models for PostgreSQL Storage
====================================

This module defines two related models:
1. Alert: Stores system alerts, notifications, and incidents
2. AlertThreshold: Configures when alerts should be triggered

The alerting system works as follows:
1. Sensor data comes in via MQTT
2. Values are compared against AlertThreshold configurations
3. If thresholds are exceeded, an Alert record is created
4. Alerts appear in the dashboard and can be acknowledged/resolved

Alert Types:
- temperature: CPU or servo temperature too high
- battery: Battery level too low
- servo_temp: Servo motor overheating
- servo_voltage: Servo voltage too low
- cpu: CPU usage too high
- memory: Memory usage too high
- emergency_stop: Emergency stop was triggered

Severities:
- critical: Immediate action required
- warning: Should be addressed soon
- info: Informational, no action needed
"""

# ============================================================================
# IMPORTS
# ============================================================================

# SQLAlchemy Column types
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Float

# func: SQL functions for timestamps
from sqlalchemy.sql import func

# Base: Parent class for all ORM models
from database.database import Base


# ============================================================================
# ALERT MODEL
# ============================================================================

class Alert(Base):
    """
    Alert records for the monitoring system.
    
    An Alert is created when a monitored value exceeds its threshold.
    Alerts can be acknowledged by users and resolved when the issue is fixed.
    
    Table name: alerts
    
    Lifecycle:
    1. Created: Alert is generated (acknowledged=False, resolved=False)
    2. Acknowledged: User sees the alert (acknowledged=True, resolved=False)
    3. Resolved: Issue is fixed (acknowledged=True, resolved=True)
    
    Attributes:
        id: Auto-incrementing primary key
        robot_id: Which robot triggered the alert (nullable for system alerts)
        alert_type: Category of alert (temperature, battery, etc.)
        severity: How urgent (critical, warning, info)
        title: Short summary for display
        message: Detailed description
        source: What component triggered it (servo_1, cpu, battery, etc.)
        value: The actual value that triggered the alert
        threshold: The threshold that was exceeded
        acknowledged: Whether a user has seen it
        acknowledged_by: Username who acknowledged
        acknowledged_at: When it was acknowledged
        resolved: Whether the issue is fixed
        resolved_at: When it was resolved
        details: Additional JSON data
        created_at: When the alert was created
    """
    
    # Database table name
    __tablename__ = "alerts"

    # ========== PRIMARY KEY ==========
    
    # id: Auto-incrementing integer primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # ========== ALERT IDENTIFICATION ==========
    
    # robot_id: Which robot triggered this alert
    # - index=True: For filtering alerts by robot
    # - nullable=True: System-wide alerts may not be robot-specific
    robot_id = Column(String, index=True, nullable=True)
    
    # alert_type: Category of the alert
    # - index=True: For filtering by type
    # - nullable=False: Required field
    # Examples: "temperature", "battery", "servo_temp", "cpu", "memory"
    alert_type = Column(String, index=True, nullable=False)
    
    # severity: How urgent is this alert
    # - index=True: For filtering by severity
    # - nullable=False: Required field
    # Values: "critical" (red), "warning" (yellow), "info" (blue)
    severity = Column(String, index=True, nullable=False)
    
    # ========== ALERT CONTENT ==========
    
    # title: Short summary for list views and notifications
    # Example: "High CPU Temperature on tonypi_01"
    title = Column(String, nullable=False)
    
    # message: Detailed description of the alert
    # - Text: Allows longer content than String
    # Example: "CPU temperature reached 78°C (threshold: 70°C)"
    message = Column(Text, nullable=False)
    
    # source: What component/sensor triggered the alert
    # Examples: "servo_1", "cpu", "battery", "main_board"
    # Helps identify the specific hardware/software component
    source = Column(String, nullable=True)
    
    # value: The actual value that triggered the alert
    # Example: 78.5 for a temperature of 78.5°C
    value = Column(Float, nullable=True)
    
    # threshold: The threshold value that was exceeded
    # Example: 70.0 for a temperature threshold of 70°C
    threshold = Column(Float, nullable=True)
    
    # ========== ALERT STATUS ==========
    
    # acknowledged: Has a user seen/acknowledged this alert?
    # - default=False: New alerts start unacknowledged
    # - index=True: For filtering unacknowledged alerts
    acknowledged = Column(Boolean, default=False, index=True)
    
    # acknowledged_by: Username of the person who acknowledged
    acknowledged_by = Column(String, nullable=True)
    
    # acknowledged_at: When the alert was acknowledged
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    # resolved: Is the underlying issue fixed?
    # - default=False: New alerts start unresolved
    # - index=True: For filtering unresolved alerts
    resolved = Column(Boolean, default=False, index=True)
    
    # resolved_at: When the alert was marked as resolved
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # ========== ADDITIONAL DATA ==========
    
    # details: Additional JSON data about the alert
    # Can store context-specific information
    # Example: {"metric_type": "cpu", "current_value": 78.5, "trend": "rising"}
    details = Column(JSON, nullable=True)
    
    # ========== TIMESTAMP ==========
    
    # created_at: When this alert was created
    # - server_default: Database generates the timestamp
    # - index=True: For time-based queries and sorting
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def to_dict(self):
        """
        Convert the Alert model to a dictionary for API responses.
        
        Returns:
            dict: Dictionary with all alert fields
        """
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
            'details': self.details,  # JSON field
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ============================================================================
# ALERT THRESHOLD MODEL
# ============================================================================

class AlertThreshold(Base):
    """
    Configurable alert thresholds per robot or system-wide.
    
    Thresholds define at what values alerts should be triggered.
    Can be configured:
    - Globally (robot_id=NULL): Applies to all robots
    - Per-robot (robot_id=specific_id): Overrides global for that robot
    
    Table name: alert_thresholds
    
    Attributes:
        id: Auto-incrementing primary key
        robot_id: Robot this applies to (NULL = global default)
        metric_type: What metric this threshold is for
        warning_threshold: Value to trigger warning alert
        critical_threshold: Value to trigger critical alert
        enabled: Whether this threshold is active
        created_at: When this threshold was created
        updated_at: When this threshold was last modified
    
    Example configurations:
        - CPU Temperature: warning=60°C, critical=75°C
        - Battery: warning=30%, critical=15% (inverted - low is bad)
        - Servo Temperature: warning=50°C, critical=70°C
    """
    
    # Database table name
    __tablename__ = "alert_thresholds"

    # ========== PRIMARY KEY ==========
    
    id = Column(Integer, primary_key=True, index=True)
    
    # ========== THRESHOLD IDENTIFICATION ==========
    
    # robot_id: Which robot this threshold applies to
    # - index=True: For lookups by robot
    # - nullable=True: NULL means this is a global default
    # 
    # Lookup order:
    # 1. Check for robot-specific threshold
    # 2. Fall back to global threshold (robot_id=NULL)
    # 3. Fall back to hardcoded defaults
    robot_id = Column(String, index=True, nullable=True)
    
    # metric_type: What metric this threshold monitors
    # - index=True: For lookups by metric
    # - nullable=False: Required field
    # Values: "cpu", "memory", "temperature", "battery", "servo_temp", "servo_voltage"
    metric_type = Column(String, index=True, nullable=False)
    
    # ========== THRESHOLD VALUES ==========
    
    # warning_threshold: Value that triggers a warning alert
    # For most metrics: alert when value EXCEEDS this
    # For battery/voltage: alert when value FALLS BELOW this
    # - nullable=False: Required field
    warning_threshold = Column(Float, nullable=False)
    
    # critical_threshold: Value that triggers a critical alert
    # For most metrics: alert when value EXCEEDS this
    # For battery/voltage: alert when value FALLS BELOW this
    # - nullable=False: Required field
    critical_threshold = Column(Float, nullable=False)
    
    # ========== STATUS ==========
    
    # enabled: Whether this threshold is active
    # - True: Threshold is checked during monitoring
    # - False: Threshold is ignored (disabled)
    # Allows temporarily disabling without deleting
    enabled = Column(Boolean, default=True)
    
    # ========== TIMESTAMPS ==========
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        """
        Convert the AlertThreshold model to a dictionary.
        
        Returns:
            dict: Dictionary with all threshold fields
        """
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
