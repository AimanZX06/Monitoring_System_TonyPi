"""
SystemLog model for PostgreSQL storage
Stores system events, errors, and activity logs
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from database.database import Base


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, index=True, nullable=False)  # INFO, WARNING, ERROR, CRITICAL
    category = Column(String, index=True, nullable=False)  # mqtt, api, database, system
    message = Column(Text, nullable=False)
    robot_id = Column(String, index=True, nullable=True)
    details = Column(JSON, nullable=True)  # Additional structured data
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'level': self.level,
            'category': self.category,
            'message': self.message,
            'robot_id': self.robot_id,
            'details': self.details,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
