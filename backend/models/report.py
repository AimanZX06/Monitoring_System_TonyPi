"""
Report Model for PostgreSQL Storage
===================================

This module defines the Report model for storing generated reports
with metadata and data.

Reports are generated analyses of robot and system data over a time period.
They can include:
- Performance metrics (CPU, memory, temperature averages)
- Job completion statistics
- Maintenance/servo health analysis
- AI-powered insights (if Gemini API is configured)

Report Types:
- performance: System performance metrics over time
- job: Job execution statistics and history
- maintenance: Servo health and maintenance recommendations
- custom: User-defined reports

Reports can be:
- Generated on-demand via API
- Exported as PDF with charts and tables
- Stored in the database for historical access
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
# REPORT MODEL
# ============================================================================

class Report(Base):
    """
    Report database model for storing generated reports.
    
    Reports contain aggregated analysis of robot data over time.
    They can include AI-powered insights from Gemini if configured.
    
    Table name: reports
    
    Attributes:
        id: Auto-incrementing primary key
        title: Report title for display
        description: Detailed description of what the report contains
        robot_id: Which robot this report is about (nullable for system-wide)
        report_type: Type of report (performance, job, maintenance, custom)
        data: Report content and data as JSON
        file_path: Path to generated PDF file (if saved)
        created_at: When the report was generated
        created_by: User or system that created the report
    
    Report Data Structure (varies by type):
        Performance Report:
        {
            "avg_cpu_percent": 45.2,
            "avg_memory_percent": 62.1,
            "avg_temperature": 55.3,
            "data_points": 1440,
            "period": "24h",
            "ai_analysis": {...}  # If Gemini is available
        }
        
        Job Report:
        {
            "start_time": "2024-01-15T10:00:00",
            "end_time": "2024-01-15T10:30:00",
            "items_processed": 45,
            "items_total": 50,
            "percent_complete": 90.0,
            "status": "completed",
            "ai_analysis": {...}
        }
        
        Maintenance Report:
        {
            "servos": {...},
            "servo_count": 6,
            "period": "7d",
            "ai_analysis": {...}
        }
    """
    
    # Database table name
    __tablename__ = "reports"

    # ========== PRIMARY KEY ==========
    
    # id: Auto-incrementing integer primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # ========== REPORT IDENTIFICATION ==========
    
    # title: Human-readable report title
    # - nullable=False: Required field
    # - index=True: For searching reports by title
    # 
    # Example: "Performance Report - tonypi_01 - 24h"
    title = Column(String, nullable=False, index=True)
    
    # description: Detailed description of the report
    # - Text: Allows longer content
    # - nullable=True: Optional field
    # 
    # Can include scope, parameters, and summary
    description = Column(Text, nullable=True)
    
    # robot_id: Which robot this report is about
    # - index=True: For filtering reports by robot
    # - nullable=True: System-wide reports may not be robot-specific
    robot_id = Column(String, index=True, nullable=True)
    
    # report_type: Category of report
    # - index=True: For filtering by type
    # - nullable=False: Required field
    # 
    # Types:
    # - "performance": CPU, memory, temperature metrics
    # - "job": Job execution statistics
    # - "maintenance": Servo health analysis
    # - "custom": User-defined reports
    report_type = Column(String, index=True, nullable=False)
    
    # ========== REPORT CONTENT ==========
    
    # data: Report content as JSON
    # - nullable=True: May be generated later
    # 
    # Structure varies by report_type
    # Always includes raw metrics plus optional AI analysis
    data = Column(JSON, nullable=True)
    
    # file_path: Path to saved PDF file
    # - nullable=True: PDF may not be generated yet
    # 
    # When a PDF is exported, the path is stored here
    # for later download without regenerating
    file_path = Column(String, nullable=True)
    
    # ========== METADATA ==========
    
    # created_at: When this report was generated
    # - server_default: Database generates timestamp
    # - index=True: For time-based queries
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # created_by: Who/what generated this report
    # - nullable=True: System-generated reports may not have a user
    # 
    # Can be:
    # - Username (for user-requested reports)
    # - "system" (for scheduled reports)
    # - "api" (for API-triggered reports)
    created_by = Column(String, nullable=True)

    def to_dict(self):
        """
        Convert the Report model to a dictionary for API responses.
        
        Returns:
            dict: Dictionary with all report fields
        """
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'robot_id': self.robot_id,
            'report_type': self.report_type,
            'data': self.data,  # JSON field - already a dict
            'file_path': self.file_path,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.created_by
        }
