"""
Robot Model for PostgreSQL Storage
==================================

This module defines the Robot model which stores robot configuration,
metadata, and settings.

Each Robot record represents a physical TonyPi robot that can connect
to the monitoring system. The model stores:

1. Identification: robot_id (unique identifier), name, description
2. Status: current online/offline status, last seen timestamp
3. Network: IP address, camera stream URL
4. Thresholds: Alert thresholds for battery and temperature
5. Settings: Custom configuration as JSON
6. Location: Current position as JSON (x, y, z coordinates)

This data is used for:
- Robot management and discovery
- Status monitoring on the dashboard
- Alert threshold configuration
- Network connectivity (camera streams)
"""

# ============================================================================
# IMPORTS
# ============================================================================

# SQLAlchemy Column types for defining database columns
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Boolean

# func: SQL functions like NOW() for timestamps
from sqlalchemy.sql import func

# Base: Parent class for all ORM models
from database.database import Base


# ============================================================================
# ROBOT MODEL CLASS
# ============================================================================

class Robot(Base):
    """
    Robot database model for storing robot configuration and status.
    
    This model represents a physical TonyPi robot in the monitoring system.
    It stores both configuration (thresholds, settings) and runtime
    information (status, IP address, last seen).
    
    Table name: robots
    
    Attributes:
        id: Auto-incrementing primary key
        robot_id: Unique string identifier (e.g., "tonypi_01")
        name: Human-friendly display name
        description: Optional description of the robot
        location: JSON object with x, y, z coordinates
        status: Current status (online, offline, error, maintenance)
        ip_address: Robot's IP address for network communication
        camera_url: URL for the robot's camera stream
        battery_threshold_low: Battery % to trigger warning (default: 20%)
        battery_threshold_critical: Battery % to trigger critical alert (default: 10%)
        temp_threshold_warning: Temperature to trigger warning (default: 70°C)
        temp_threshold_critical: Temperature to trigger critical alert (default: 80°C)
        settings: JSON object for additional custom settings
        last_seen: Timestamp of last communication
        created_at: When the robot was registered
        updated_at: Last configuration update
        is_active: Soft delete flag (False = deleted)
    """
    
    # Database table name
    __tablename__ = "robots"

    # ========== PRIMARY KEY ==========
    
    # id: Auto-incrementing integer primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # ========== IDENTIFICATION ==========
    
    # robot_id: Unique string identifier for the robot
    # - unique=True: No two robots can have the same robot_id
    # - index=True: Indexed for fast lookups
    # - nullable=False: Required field
    # Example: "tonypi_01", "tonypi_warehouse_1"
    robot_id = Column(String, unique=True, index=True, nullable=False)
    
    # name: Human-friendly display name
    # Shown in the UI for easier identification
    # Example: "Warehouse Robot 1"
    name = Column(String, nullable=True)
    
    # description: Optional detailed description
    # Can include notes about the robot's purpose, location, etc.
    description = Column(String, nullable=True)
    
    # ========== LOCATION ==========
    
    # location: Current position as JSON object
    # Format: {"x": float, "y": float, "z": float}
    # - x, y: Position on the floor (meters)
    # - z: Height (usually 0 for ground robots)
    # Stored as JSON for flexibility in coordinate systems
    location = Column(JSON, nullable=True)
    
    # ========== STATUS ==========
    
    # status: Current operational status
    # Possible values:
    # - "online": Robot is connected and responding
    # - "offline": Robot is not connected
    # - "error": Robot has an error condition
    # - "maintenance": Robot is under maintenance
    status = Column(String, default='offline')
    
    # ========== NETWORK INFORMATION ==========
    
    # ip_address: Robot's current IP address
    # Used for direct communication and camera access
    # Updated automatically when robot connects
    ip_address = Column(String, nullable=True)
    
    # camera_url: URL for the robot's camera stream
    # Typically: http://{ip_address}:8081/?action=stream
    # Used to embed camera feed in the frontend
    camera_url = Column(String, nullable=True)
    
    # ========== ALERT THRESHOLDS ==========
    # These define when alerts should be triggered for this robot
    
    # battery_threshold_low: Warning threshold for battery percentage
    # When battery drops below this, a warning alert is generated
    # Default: 20% - robot should be charged soon
    battery_threshold_low = Column(Float, default=20.0)
    
    # battery_threshold_critical: Critical threshold for battery percentage
    # When battery drops below this, a critical alert is generated
    # Default: 10% - robot needs immediate charging
    battery_threshold_critical = Column(Float, default=10.0)
    
    # temp_threshold_warning: Warning threshold for temperature (°C)
    # When any component exceeds this, a warning is generated
    # Default: 70°C - robot is running hot
    temp_threshold_warning = Column(Float, default=70.0)
    
    # temp_threshold_critical: Critical threshold for temperature (°C)
    # When any component exceeds this, critical alert is generated
    # Default: 80°C - risk of damage, should stop operation
    temp_threshold_critical = Column(Float, default=80.0)
    
    # ========== CUSTOM SETTINGS ==========
    
    # settings: Additional configuration as JSON
    # Flexible field for robot-specific settings not covered by other columns
    # Example: {"patrol_route": [...], "speed_limit": 0.5}
    settings = Column(JSON, nullable=True)
    
    # ========== TIMESTAMPS ==========
    
    # last_seen: When the robot last communicated with the system
    # Updated every time the robot sends data via MQTT
    # Used to detect offline robots (last_seen too old = offline)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    
    # created_at: When this robot record was created
    # Auto-populated by the database on insert
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # updated_at: When this robot record was last modified
    # Auto-updated by SQLAlchemy when the record changes
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ========== SOFT DELETE ==========
    
    # is_active: Soft delete flag
    # - True: Robot is active and should be shown
    # - False: Robot is "deleted" but record remains for history
    # Soft delete preserves historical data while hiding inactive robots
    is_active = Column(Boolean, default=True)

    def to_dict(self):
        """
        Convert the Robot model to a dictionary for API responses.
        
        Creates a serializable representation of the robot that can
        be returned from API endpoints as JSON.
        
        Returns:
            dict: Dictionary with all robot fields
        
        Note:
            - DateTime fields are converted to ISO format strings
            - JSON fields (location, settings) are returned as-is
              since they're already dictionaries
        """
        return {
            'id': self.id,
            'robot_id': self.robot_id,
            'name': self.name,
            'description': self.description,
            'location': self.location,  # JSON field - returns as dict {x, y, z}
            'status': self.status,
            'ip_address': self.ip_address,
            'camera_url': self.camera_url,
            'battery_threshold_low': self.battery_threshold_low,
            'battery_threshold_critical': self.battery_threshold_critical,
            'temp_threshold_warning': self.temp_threshold_warning,
            'temp_threshold_critical': self.temp_threshold_critical,
            'settings': self.settings,  # JSON field - returns as dict
            # Convert datetime to ISO string, handle None case
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active
        }
