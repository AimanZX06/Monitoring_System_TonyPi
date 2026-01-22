"""
Database Configuration Module
=============================

This module sets up the SQLAlchemy database connection for PostgreSQL.
It provides:
- Database engine configuration
- Session factory for database operations
- Base class for ORM models
- Dependency function for FastAPI routes

SQLAlchemy is an ORM (Object-Relational Mapper) that allows us to
interact with the database using Python objects instead of raw SQL.
"""

# ============================================================================
# IMPORTS
# ============================================================================

# create_engine: Creates a new SQLAlchemy engine instance
# The engine is the starting point for any SQLAlchemy application
# It's a "home base" for the actual database and its connection pool
from sqlalchemy import create_engine

# declarative_base: Factory function that creates a base class for models
# All ORM models will inherit from this base class
from sqlalchemy.ext.declarative import declarative_base

# sessionmaker: Factory for creating new Session objects
# Sessions are used to manage persistence operations for ORM-mapped objects
from sqlalchemy.orm import sessionmaker

# os: Operating system interface for environment variables
import os

# load_dotenv: Loads environment variables from .env file
from dotenv import load_dotenv

# Load environment variables from .env file
# This allows configuration to be stored in a file during development
# In production, these would typically be set via environment variables
load_dotenv()

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# Get the database URL from environment variable or use default
# Format: postgresql://username:password@host:port/database_name
#
# Components explained:
# - postgresql:// : The database driver/protocol
# - postgres:postgres : Username and password (default for development)
# - localhost:5432 : Host and port (5432 is PostgreSQL's default port)
# - tonypi_db : The database name
#
# In production, this should be set via environment variable with proper credentials
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://postgres:postgres@localhost:5432/tonypi_db")

# ============================================================================
# ENGINE CREATION
# ============================================================================

# Create the SQLAlchemy engine
# The engine manages the database connection pool and handles all communication
# with the database. It's created once and reused throughout the application.
#
# The connection string (POSTGRES_URL) tells the engine:
# - What type of database to connect to (PostgreSQL)
# - How to authenticate (username/password)
# - Where to find the database (host/port)
# - Which database to use (database name)
engine = create_engine(POSTGRES_URL)

# ============================================================================
# SESSION FACTORY
# ============================================================================

# Create a configured Session class (not an instance, but a factory)
#
# Parameters:
# - autocommit=False: Don't automatically commit after each statement
#   This gives us control over transaction boundaries
# - autoflush=False: Don't automatically flush pending changes before queries
#   This gives us control over when changes are sent to the database
# - bind=engine: Bind this session factory to our database engine
#
# Using autocommit=False and autoflush=False is recommended for web applications
# because it gives explicit control over database transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ============================================================================
# BASE CLASS FOR MODELS
# ============================================================================

# Create the declarative base class
# All ORM model classes will inherit from this base
# This provides:
# - A metaclass that manages the mapping between Python classes and database tables
# - A metadata object that contains all table definitions
# - Methods for querying the database through model classes
Base = declarative_base()

# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

def get_db():
    """
    Dependency function for FastAPI to get a database session.
    
    This function is used with FastAPI's dependency injection system.
    It creates a new database session for each request and automatically
    closes it when the request is complete.
    
    Usage in FastAPI routes:
        @router.get("/items")
        def get_items(db: Session = Depends(get_db)):
            # Use db to query the database
            items = db.query(Item).all()
            return items
    
    The 'yield' keyword makes this a generator function:
    - Everything before 'yield' runs when the dependency is first requested
    - Everything after 'yield' runs when the request is complete
    - This ensures the session is always closed, even if an error occurs
    
    Yields:
        Session: A SQLAlchemy database session
    
    Note:
        The session is automatically closed in the 'finally' block,
        which runs whether the request succeeds or fails.
    """
    # Create a new database session
    db = SessionLocal()
    try:
        # Yield the session to the route handler
        # The route handler can now use 'db' to interact with the database
        yield db
    finally:
        # Always close the session when done
        # This releases the database connection back to the pool
        db.close()
