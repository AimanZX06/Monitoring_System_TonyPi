"""
SystemLog Model for PostgreSQL Storage
======================================

This module defines the SystemLog model for storing system events,
errors, and activity logs.

System logs provide an audit trail of everything that happens in the
monitoring system, including:
- MQTT events (connections, messages)
- API requests and responses
- Database operations
- Robot commands and responses
- Alert generation
- User actions
- Errors and exceptions

Logs are essential for:
- Debugging issues
- Security auditing
- Performance analysis
- Compliance requirements
- Historical analysis

Log Levels (from least to most severe):
- INFO: Normal operations, status updates
- WARNING: Potential issues, degraded performance
- ERROR: Errors that don't stop operation
- CRITICAL: Severe errors, system may be unstable
"""

# ============================================================================
# IMPORTS
# ============================================================================

# SQLAlchemy Column types
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON

# func: SQL functions for timestamps
from sqlalchemy.sql import func

# Base: Parent class for all ORM models
from database.database import Base


# ============================================================================
# SYSTEM LOG MODEL
# ============================================================================

class SystemLog(Base):
    """
    SystemLog database model for storing events and activities.
    
    Every significant event in the system is recorded as a log entry.
    Logs can be filtered by level, category, robot, and time range.
    
    Table name: system_logs
    
    Attributes:
        id: Auto-incrementing primary key
        level: Log severity (INFO, WARNING, ERROR, CRITICAL)
        category: Type of event (mqtt, api, database, system, etc.)
        message: Human-readable description of the event
        robot_id: Associated robot (if applicable)
        details: Additional structured data as JSON
        timestamp: When the event occurred
    
    Categories:
        - mqtt: MQTT broker events, message handling
        - api: REST API requests and responses
        - database: Database operations
        - system: System-level events
        - command: Robot commands sent/received
        - robot: Robot status updates
        - alert: Alert generation events
        - report: Report generation
        - servo: Servo-related events
        - vision: Camera/vision detection events
        - battery: Battery-related events
        - sensor: Sensor reading events
        - job: Job/task progress events
        - movement: Robot movement events
    """
    
    # Database table name
    __tablename__ = "system_logs"

    # ========== PRIMARY KEY ==========
    
    # id: Auto-incrementing integer primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # ========== LOG CLASSIFICATION ==========
    
    # level: Severity level of the log entry
    # - index=True: For filtering by severity
    # - nullable=False: Required field
    # 
    # Levels (in order of severity):
    # - INFO: Normal operations, status updates
    #   Example: "Robot tonypi_01 connected to MQTT"
    # 
    # - WARNING: Potential issues, degraded performance
    #   Example: "Battery level below 30%"
    # 
    # - ERROR: Errors that don't stop the system
    #   Example: "Failed to send command to robot"
    # 
    # - CRITICAL: Severe errors, immediate attention needed
    #   Example: "Database connection lost"
    level = Column(String, index=True, nullable=False)
    
    # category: Type/source of the event
    # - index=True: For filtering by category
    # - nullable=False: Required field
    # 
    # Used to group related logs together
    # Examples: "mqtt", "api", "database", "system", "command"
    category = Column(String, index=True, nullable=False)
    
    # ========== LOG CONTENT ==========
    
    # message: Human-readable description of the event
    # - Text: Allows longer content than String (unlimited in PostgreSQL)
    # - nullable=False: Required field
    # 
    # Should be clear and actionable
    # Good: "Robot tonypi_01 battery at 25%, charging recommended"
    # Bad: "low battery"
    message = Column(Text, nullable=False)
    
    # ========== CONTEXT ==========
    
    # robot_id: Which robot is associated with this log
    # - index=True: For filtering logs by robot
    # - nullable=True: System-wide logs may not have a robot
    # 
    # Allows filtering logs for a specific robot
    robot_id = Column(String, index=True, nullable=True)
    
    # details: Additional structured data as JSON
    # - nullable=True: Not all logs need extra details
    # 
    # Can store any additional context that doesn't fit in message
    # Example: {
    #     "command_id": "cmd_123",
    #     "request_body": {...},
    #     "response_code": 200,
    #     "duration_ms": 150
    # }
    details = Column(JSON, nullable=True)
    
    # ========== TIMESTAMP ==========
    
    # timestamp: When this event occurred
    # - server_default: Database generates the timestamp
    # - index=True: For time-based queries and sorting
    # 
    # Using server_default ensures consistent timestamps even if
    # the application server clock is slightly different
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def to_dict(self):
        """
        Convert the SystemLog model to a dictionary for API responses.
        
        Returns:
            dict: Dictionary with all log fields
        """
        return {
            'id': self.id,
            'level': self.level,
            'category': self.category,
            'message': self.message,
            'robot_id': self.robot_id,
            'details': self.details,  # JSON field - already a dict
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
