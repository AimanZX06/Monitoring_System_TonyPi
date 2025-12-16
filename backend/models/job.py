"""
Job model for PostgreSQL storage
Stores job tracking data: start/end times, items processed, completion percentage
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Boolean
from sqlalchemy.sql import func
from database.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(String, index=True, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    items_total = Column(Integer, nullable=True)
    items_done = Column(Integer, default=0)
    percent_complete = Column(Float, default=0.0)
    last_item = Column(JSON, nullable=True)
    status = Column(String, default='active')  # active, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'robot_id': self.robot_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'items_total': self.items_total,
            'items_done': self.items_done,
            'percent_complete': self.percent_complete,
            'last_item': self.last_item,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
