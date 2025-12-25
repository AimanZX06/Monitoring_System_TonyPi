"""
Report model for PostgreSQL storage
Stores generated reports with metadata and data
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from database.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    robot_id = Column(String, index=True, nullable=True)
    report_type = Column(String, index=True, nullable=False)  # performance, job, system, custom
    data = Column(JSON, nullable=True)  # Report data/content
    file_path = Column(String, nullable=True)  # Path to generated PDF file (if saved)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_by = Column(String, nullable=True)  # User/system that created the report

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'robot_id': self.robot_id,
            'report_type': self.report_type,
            'data': self.data,
            'file_path': self.file_path,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.created_by
        }












