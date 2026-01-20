"""
Robot model for PostgreSQL storage
Stores robot configuration, metadata, and settings
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Boolean
from sqlalchemy.sql import func
from database.database import Base


class Robot(Base):
    __tablename__ = "robots"

    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    description = Column(String, nullable=True)
    location = Column(String, nullable=True)
    status = Column(String, default='offline')  # online, offline, error, maintenance
    battery_threshold_low = Column(Float, default=20.0)
    battery_threshold_critical = Column(Float, default=10.0)
    temp_threshold_warning = Column(Float, default=70.0)
    temp_threshold_critical = Column(Float, default=80.0)
    settings = Column(JSON, nullable=True)  # Additional custom settings
    last_seen = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'robot_id': self.robot_id,
            'name': self.name,
            'description': self.description,
            'location': self.location,
            'status': self.status,
            'battery_threshold_low': self.battery_threshold_low,
            'battery_threshold_critical': self.battery_threshold_critical,
            'temp_threshold_warning': self.temp_threshold_warning,
            'temp_threshold_critical': self.temp_threshold_critical,
            'settings': self.settings,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active
        }
