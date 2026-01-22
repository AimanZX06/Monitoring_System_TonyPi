"""
Job Model for PostgreSQL Storage
================================

This module defines the Job model which tracks robot task execution.

A Job represents a single task or mission that a robot is executing,
such as:
- Finding and approaching a red ball
- Patrolling an area
- Executing a series of movements

The Job model stores:
- Start/end times for duration tracking
- Items processed (for inventory-type jobs)
- Completion percentage
- Task name and current phase
- Success/failure status
- Cancellation reasons if applicable

This data is used for:
- Real-time progress monitoring on the dashboard
- Historical job analysis and reporting
- Performance metrics and optimization
"""

# ============================================================================
# IMPORTS
# ============================================================================

# SQLAlchemy Column types for defining table columns
# Column: Defines a column in the database table
# Integer: Integer data type (whole numbers)
# String: Variable-length string (VARCHAR)
# DateTime: Date and time values
# Float: Floating-point numbers (decimals)
# JSON: JSON data type for flexible structured data
# Boolean: True/False values
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Boolean

# func: SQLAlchemy's SQL function library
# Used here for server-side defaults like NOW()
from sqlalchemy.sql import func

# Base: The declarative base class all models inherit from
# This connects our model to the SQLAlchemy ORM system
from database.database import Base


# ============================================================================
# JOB MODEL CLASS
# ============================================================================

class Job(Base):
    """
    Job database model for tracking robot task execution.
    
    This model stores information about jobs/tasks that robots execute.
    Jobs can be things like finding objects, patrolling, or executing
    sequences of actions.
    
    Table name: jobs
    
    Attributes:
        id: Primary key, auto-incrementing integer
        robot_id: Identifier of the robot executing this job
        start_time: When the job started
        end_time: When the job completed (null if still running)
        items_total: Total items to process (for item-based jobs)
        items_done: Number of items completed
        percent_complete: Progress percentage (0-100)
        last_item: JSON data of the most recently processed item
        status: Current status (active, completed, cancelled, failed)
        task_name: Human-readable name of the task
        phase: Current execution phase (scanning, searching, executing, done)
        estimated_duration: Expected total time in seconds
        action_duration: Actual time taken to complete
        success: Whether the job completed successfully
        cancel_reason: Reason if the job was cancelled
        created_at: Record creation timestamp
        updated_at: Last modification timestamp
    """
    
    # Table name in the database
    # This is how SQLAlchemy maps this class to a database table
    __tablename__ = "jobs"

    # ========== PRIMARY KEY ==========
    
    # id: Primary key column
    # - Integer: Uses integer type for the column
    # - primary_key=True: Makes this the primary key (unique identifier)
    # - index=True: Creates an index for faster lookups
    # The database will auto-generate unique values for new records
    id = Column(Integer, primary_key=True, index=True)
    
    # ========== CORE JOB FIELDS ==========
    
    # robot_id: Identifies which robot is executing this job
    # - String: Variable-length text
    # - index=True: Indexed for fast filtering by robot
    # - nullable=False: This field is required (cannot be NULL)
    robot_id = Column(String, index=True, nullable=False)
    
    # start_time: When the job started executing
    # - DateTime(timezone=True): Stores timezone-aware timestamps
    # - nullable=False: Required field
    start_time = Column(DateTime(timezone=True), nullable=False)
    
    # end_time: When the job finished (completed, cancelled, or failed)
    # - nullable=True: Can be NULL while job is still running
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    # ========== PROGRESS TRACKING ==========
    
    # items_total: Total number of items to process in this job
    # - nullable=True: Not all jobs are item-based
    items_total = Column(Integer, nullable=True)
    
    # items_done: Number of items completed so far
    # - default=0: Starts at zero when job begins
    items_done = Column(Integer, default=0)
    
    # percent_complete: Job progress as a percentage (0.0 to 100.0)
    # - Float: Decimal number for precise progress
    # - default=0.0: Starts at 0%
    percent_complete = Column(Float, default=0.0)
    
    # last_item: JSON data about the most recently processed item
    # - JSON: Flexible structured data type
    # - nullable=True: May not have processed any items yet
    # Example: {"qr": "QR12345", "status": "processed", "timestamp": "..."}
    last_item = Column(JSON, nullable=True)
    
    # status: Current job status
    # - default='active': New jobs start as active
    # Possible values: active, completed, cancelled, failed
    status = Column(String, default='active')
    
    # ========== TIMESTAMP FIELDS ==========
    
    # created_at: When this record was created in the database
    # - server_default=func.now(): Database generates the value automatically
    # This is more reliable than application-level timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # updated_at: When this record was last modified
    # - onupdate=func.now(): Automatically updates when record changes
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ========== EXTENDED FIELDS FOR TONYPI ==========
    # These fields provide additional detail for TonyPi robot tasks
    
    # task_name: Human-readable name of the task being executed
    # Examples: "find_red_ball", "patrol", "return_home"
    task_name = Column(String, nullable=True)
    
    # phase: Current phase of task execution
    # Examples: "scanning", "searching", "executing", "done"
    # This helps track where in the task workflow the robot is
    phase = Column(String, nullable=True)
    
    # estimated_duration: Expected total time for the job (seconds)
    # Used for progress estimation and timeout detection
    estimated_duration = Column(Float, nullable=True)
    
    # action_duration: Actual time the action took (seconds)
    # Recorded when job completes for performance analysis
    action_duration = Column(Float, nullable=True)
    
    # success: Whether the job completed successfully
    # - True: Job succeeded
    # - False: Job failed
    # - None/NULL: Job still running or status unknown
    success = Column(Boolean, nullable=True)
    
    # cancel_reason: Why the job was cancelled (if applicable)
    # Example: "obstacle detected", "battery low", "user request"
    cancel_reason = Column(String, nullable=True)

    # ========== SERIALIZATION METHOD ==========
    
    def to_dict(self):
        """
        Convert the Job model to a dictionary for API responses.
        
        SQLAlchemy models can't be directly serialized to JSON,
        so this method creates a dictionary representation that
        can be returned from API endpoints.
        
        Returns:
            dict: Dictionary representation of the job with all fields
        
        Note:
            DateTime fields are converted to ISO format strings
            using .isoformat() for JSON compatibility.
        """
        return {
            'id': self.id,
            'robot_id': self.robot_id,
            # Convert datetime to ISO string, handle None case
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'items_total': self.items_total,
            'items_done': self.items_done,
            'percent_complete': self.percent_complete,
            'last_item': self.last_item,  # JSON field - already serializable
            'status': self.status,
            'task_name': self.task_name,
            'phase': self.phase,
            'estimated_duration': self.estimated_duration,
            'action_duration': self.action_duration,
            'success': self.success,
            'cancel_reason': self.cancel_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
