"""
User Model for PostgreSQL Storage
=================================

This module defines the User model for authentication and authorization.

The User model stores user accounts that can log into the monitoring system.
It supports role-based access control with three roles:
- admin: Full access to all features including user management
- operator: Can control robots and view all data
- viewer: Read-only access to dashboards and reports

Security features:
- Passwords are hashed using bcrypt (never stored in plain text)
- JWT tokens are used for authentication sessions
- Users can be deactivated without deleting their records
"""

# ============================================================================
# IMPORTS
# ============================================================================

# SQLAlchemy Column types
from sqlalchemy import Column, String, DateTime, Boolean

# func: SQL functions for timestamps
from sqlalchemy.sql import func

# Base: Parent class for all ORM models
from database.database import Base


# ============================================================================
# USER MODEL CLASS
# ============================================================================

class User(Base):
    """
    User database model for authentication and authorization.
    
    Stores user account information for the monitoring system.
    Supports role-based access control (RBAC).
    
    Table name: users
    
    Attributes:
        id: UUID string primary key
        username: Unique login username (max 50 chars)
        email: Unique email address (max 100 chars)
        password_hash: Bcrypt hash of the password (never plain text!)
        role: User role (admin, operator, viewer)
        is_active: Whether the account is active
        created_at: Account creation timestamp
        updated_at: Last modification timestamp
        
    Roles:
        - admin: Full access including user management
        - operator: Can control robots, view all data
        - viewer: Read-only access to dashboards
    """
    
    # Database table name
    __tablename__ = "users"

    # ========== PRIMARY KEY ==========
    
    # id: UUID string as primary key
    # Using string instead of auto-increment for distributed systems
    # UUID format: "123e4567-e89b-12d3-a456-426614174000"
    id = Column(String, primary_key=True, index=True)
    
    # ========== AUTHENTICATION FIELDS ==========
    
    # username: Unique login identifier
    # - String(50): Maximum 50 characters
    # - unique=True: No two users can have the same username
    # - index=True: Indexed for fast login lookups
    # - nullable=False: Required field
    username = Column(String(50), unique=True, index=True, nullable=False)
    
    # email: User's email address
    # - String(100): Maximum 100 characters
    # - unique=True: No two users can have the same email
    # - index=True: Indexed for lookups
    # - nullable=False: Required field
    email = Column(String(100), unique=True, index=True, nullable=False)
    
    # password_hash: Bcrypt hash of the user's password
    # IMPORTANT: This stores the HASH, not the plain text password!
    # - String(255): Bcrypt hashes are typically 60 characters
    # - nullable=False: Required field
    # 
    # Password security:
    # 1. Plain text password is received during registration/login
    # 2. Password is hashed using bcrypt with random salt
    # 3. Only the hash is stored in the database
    # 4. During login, the hash of the entered password is compared
    password_hash = Column(String(255), nullable=False)
    
    # ========== AUTHORIZATION ==========
    
    # role: User's permission level
    # - default='viewer': New users get minimal permissions
    # 
    # Role hierarchy:
    # - admin: Can do everything
    #   - Create/edit/delete users
    #   - Control robots
    #   - View all data
    #   - Configure system settings
    # 
    # - operator: Can control but not admin
    #   - Control robots (commands, emergency stop)
    #   - View all data
    #   - Acknowledge alerts
    #   - Generate reports
    # 
    # - viewer: Read-only access
    #   - View dashboards
    #   - View reports
    #   - View robot status
    role = Column(String(20), default='viewer')
    
    # ========== ACCOUNT STATUS ==========
    
    # is_active: Whether the account can be used
    # - True: User can log in
    # - False: User is deactivated (cannot log in)
    # 
    # Using is_active instead of deleting allows:
    # - Preserving audit trails
    # - Easy reactivation if needed
    # - Maintaining referential integrity with logs
    is_active = Column(Boolean, default=True)
    
    # ========== TIMESTAMPS ==========
    
    # created_at: When the account was created
    # Auto-populated by the database
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # updated_at: When the account was last modified
    # Auto-updated on any change to the record
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        """
        Convert the User model to a dictionary for API responses.
        
        IMPORTANT: This method intentionally EXCLUDES password_hash
        for security. Never expose password hashes in API responses!
        
        Returns:
            dict: Dictionary with user fields (excluding password)
        """
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            # NOTE: password_hash is intentionally NOT included!
            # Never expose password hashes to the client.
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
