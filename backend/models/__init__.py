"""
Database Models Package
=======================

This module exports all SQLAlchemy ORM models for the TonyPi monitoring system.

SQLAlchemy ORM (Object-Relational Mapping) allows us to:
- Define database tables as Python classes
- Query and manipulate data using Python objects
- Automatically handle SQL generation and database interactions

Models in this package:
- Job: Tracks robot job/task execution and progress
- Robot: Stores robot configuration and current status
- SystemLog: Records system events and activities
- Report: Stores generated reports and analytics
- Alert: Manages system alerts and notifications
- AlertThreshold: Configures alert trigger thresholds
- User: Manages user accounts and authentication

Each model class maps to a database table and provides methods
for converting to/from Python dictionaries for API responses.
"""

# Import all model classes from their respective modules
# This allows importing all models from a single location:
# from models import Job, Robot, etc.

# Job model: Tracks robot tasks and their execution progress
from .job import Job

# Robot model: Stores robot configuration, status, and thresholds
from .robot import Robot

# SystemLog model: Records all system events for auditing
from .system_log import SystemLog

# Report model: Stores generated reports (performance, job, maintenance)
from .report import Report

# Alert model: Manages alerts triggered by threshold violations
# AlertThreshold model: Configures when alerts should be triggered
from .alert import Alert, AlertThreshold

# User model: Manages user accounts for authentication
from .user import User

# __all__ defines what gets exported when someone does:
# from models import *
# This is a Python convention for controlling module exports
__all__ = ['Job', 'Robot', 'SystemLog', 'Report', 'Alert', 'AlertThreshold', 'User']
