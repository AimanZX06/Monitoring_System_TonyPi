"""
TonyPi Robot Monitoring System - Backend API
=============================================

This is the main entry point for the FastAPI backend server.
It handles:
- Application startup and shutdown lifecycle
- Database initialization and connection
- MQTT client startup for real-time robot communication
- API routing and CORS configuration

A comprehensive monitoring and management system for HiWonder TonyPi robots.
"""

# ============================================================================
# IMPORTS SECTION
# ============================================================================

# time: Provides time-related functions for delays and timing
import time

# os: Operating system interface for environment variables and file paths
import os

# asynccontextmanager: Decorator for creating async context managers
# Used here for application lifecycle management (startup/shutdown)
from contextlib import asynccontextmanager

# dotenv: Loads environment variables from a .env file
# This is useful for local development to set configuration without modifying system env
from dotenv import load_dotenv

# Load environment variables from .env file (for local development)
# In Docker, environment variables are passed via docker-compose.yml instead
load_dotenv()

# FastAPI: The web framework used to build this REST API
# It provides automatic API documentation, request validation, and async support
from fastapi import FastAPI

# CORSMiddleware: Handles Cross-Origin Resource Sharing
# Required for the frontend (running on different port) to access this API
from fastapi.middleware.cors import CORSMiddleware

# text: SQLAlchemy's way to write raw SQL queries
# Used here to test database connectivity
from sqlalchemy import text

# Base: The declarative base class for SQLAlchemy models
# engine: The database connection engine
from database.database import Base, engine

# mqtt_client: Singleton MQTT client for real-time robot communication
from mqtt.mqtt_client import mqtt_client

# Import all router modules that define API endpoints
# Each router handles a specific domain/feature of the API
from routers import (
    health,          # Health check endpoints (/health)
    robot_data,      # Robot sensor and telemetry data endpoints
    reports,         # Report generation and retrieval endpoints
    management,      # Robot management and command endpoints
    grafana_proxy,   # Proxy for Grafana dashboard rendering
    pi_perf,         # Raspberry Pi performance metrics endpoints
    robots_db,       # Robot database CRUD operations
    data_validation, # Data validation endpoints
    alerts,          # Alert management and threshold configuration
    logs,            # System logging endpoints
    users            # User authentication and management
)

# ============================================================================
# API VERSION CONFIGURATION
# ============================================================================

# API version string - used for versioning the API endpoints
# This allows future breaking changes without affecting existing clients
API_VERSION = "v1"

# The prefix for all API endpoints (e.g., /api/v1/health)
API_PREFIX = f"/api/{API_VERSION}"

# Print startup message to console for debugging/logging
print("Starting TonyPi Monitoring System...")


# ============================================================================
# DATABASE INITIALIZATION FUNCTIONS
# ============================================================================

def init_database():
    """
    Initialize database tables.
    
    This function:
    1. Imports all SQLAlchemy models to register them with the ORM
    2. Creates all tables defined in the models if they don't exist
    3. Initializes default user accounts (admin, etc.)
    
    Called during application startup after database connection is verified.
    """
    try:
        print("Initializing database tables...")
        
        # Import all model classes to register them with SQLAlchemy's metadata
        # This must happen before create_all() so SQLAlchemy knows about all tables
        from models import Job, Robot, SystemLog, Alert, AlertThreshold, User
        
        # Create all tables in the database based on model definitions
        # This is safe to call multiple times - it won't recreate existing tables
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
        
        # Initialize default users if they don't exist
        # This creates the admin account on first startup
        try:
            from scripts.init_users import init_default_users
            init_default_users()
        except Exception as e:
            # Don't fail startup if user initialization fails
            # The system can still work without default users
            print(f"Warning: Could not initialize default users: {e}")
            
    except Exception as e:
        # Database initialization failure is critical - re-raise to stop startup
        print(f"Error initializing database: {e}")
        raise


def wait_for_db(max_retries=30, delay=2):
    """
    Wait for database to be ready with retries.
    
    In containerized environments, the database might not be ready immediately
    when the application starts. This function implements retry logic to wait
    for the database to become available.
    
    Args:
        max_retries (int): Maximum number of connection attempts (default: 30)
        delay (int): Seconds to wait between retries (default: 2)
        
    Returns:
        bool: True if connection successful
        
    Raises:
        Exception: If max retries exceeded
    """
    # Try to connect up to max_retries times
    for attempt in range(max_retries):
        try:
            # Attempt to execute a simple query to test connectivity
            # Using context manager ensures connection is properly closed
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))  # Simple query that always works
            print("Database connection successful!")
            return True
        except Exception as e:
            # Log the failed attempt
            print(f"Database connection attempt {attempt + 1}/{max_retries} failed: {e}")
            
            # If we haven't exhausted retries, wait and try again
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                # Final attempt failed - raise exception to stop startup
                print("Max database connection retries exceeded!")
                raise
    return False


# ============================================================================
# APPLICATION LIFECYCLE MANAGEMENT
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler for startup and shutdown events.
    
    This is FastAPI's recommended way to handle application lifecycle.
    Code before 'yield' runs during startup, code after runs during shutdown.
    
    Startup tasks:
    - Wait for database connection
    - Initialize database tables
    - Start MQTT client for robot communication
    
    Shutdown tasks:
    - Stop MQTT client gracefully
    
    Args:
        app: The FastAPI application instance
    """
    # Skip startup/shutdown during tests to speed up test execution
    # The TESTING environment variable is set by the test configuration
    if os.getenv("TESTING") == "true":
        yield  # Still need to yield even when skipping
        return
    
    # ============ STARTUP ============
    
    # Wait for database to be ready before proceeding
    wait_for_db()
    
    # Initialize database tables and default data
    init_database()
    
    # Start MQTT client for real-time robot communication
    # MQTT is used for bidirectional communication with robots
    try:
        await mqtt_client.start()
        print("MQTT client started successfully!")
    except Exception as e:
        # MQTT failure is logged but doesn't stop the application
        # The API can still work for historical data even without MQTT
        print(f"MQTT client startup failed: {e}")
    
    # Yield control to the application - it will run until shutdown
    yield
    
    # ============ SHUTDOWN ============
    
    # Gracefully stop the MQTT client
    try:
        await mqtt_client.stop()
        print("MQTT client stopped successfully!")
    except Exception as e:
        print(f"MQTT client shutdown failed: {e}")


# ============================================================================
# FASTAPI APPLICATION SETUP
# ============================================================================

# Create the FastAPI application instance with configuration
app = FastAPI(
    # Title shown in API documentation
    title="TonyPi Robot Monitoring System",
    
    # Description shown in API documentation
    description="A comprehensive monitoring and management system for HiWonder TonyPi robot",
    
    # API version string
    version="1.0.0",
    
    # Lifecycle handler for startup/shutdown
    lifespan=lifespan,
    
    # URL for Swagger UI documentation (interactive API explorer)
    docs_url=f"{API_PREFIX}/docs",
    
    # URL for ReDoc documentation (alternative documentation UI)
    redoc_url=f"{API_PREFIX}/redoc",
    
    # URL for OpenAPI schema (machine-readable API specification)
    openapi_url=f"{API_PREFIX}/openapi.json"
)

# ============================================================================
# CORS MIDDLEWARE CONFIGURATION
# ============================================================================

# Add CORS (Cross-Origin Resource Sharing) middleware
# This is required for the frontend to make requests to this API
# when running on a different origin (host:port)
app.add_middleware(
    CORSMiddleware,
    # List of origins allowed to make requests
    # These correspond to different development/production environments
    allow_origins=[
        "http://localhost:3001",    # Development frontend (alternate port)
        "http://frontend:3000",     # Docker container frontend
        "http://localhost:3000"     # Development frontend (default port)
    ],
    # Allow cookies to be sent with requests (needed for authentication)
    allow_credentials=True,
    # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_methods=["*"],
    # Allow all headers in requests
    allow_headers=["*"],
)

# ============================================================================
# ROUTER REGISTRATION
# ============================================================================

# Include all API routers with the versioned prefix
# Each router handles a specific domain of the API
# Tags are used for grouping in the API documentation

# Health check endpoints for monitoring system status
app.include_router(health.router, prefix=API_PREFIX, tags=["health"])

# Robot data endpoints for sensor readings and telemetry
app.include_router(robot_data.router, prefix=API_PREFIX, tags=["robot-data"])

# Report generation and retrieval endpoints
app.include_router(reports.router, prefix=API_PREFIX, tags=["reports"])

# Robot management and command endpoints
app.include_router(management.router, prefix=API_PREFIX, tags=["management"])

# Grafana proxy for secure dashboard rendering
app.include_router(grafana_proxy.router, prefix=API_PREFIX, tags=["grafana"])

# Raspberry Pi performance metrics endpoints
app.include_router(pi_perf.router, prefix=API_PREFIX, tags=["pi-performance"])

# Robot database CRUD operations
app.include_router(robots_db.router, prefix=API_PREFIX, tags=["robots-database"])

# Data validation endpoints
app.include_router(data_validation.router, prefix=API_PREFIX, tags=["validation"])

# Alert management and threshold configuration
app.include_router(alerts.router, prefix=API_PREFIX, tags=["alerts"])

# System logging endpoints
app.include_router(logs.router, prefix=API_PREFIX, tags=["logs"])

# User authentication and management
app.include_router(users.router, prefix=API_PREFIX, tags=["users"])


# ============================================================================
# ROOT ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """
    Root endpoint with API information.
    
    Returns basic information about the API including:
    - Welcome message
    - Version information
    - Links to documentation and health check
    
    Returns:
        dict: API information object
    """
    return {
        "message": "TonyPi Robot Monitoring System API",
        "version": "1.0.0",
        "api_version": API_VERSION,
        "docs": f"{API_PREFIX}/docs",      # Link to Swagger docs
        "health": f"{API_PREFIX}/health"   # Link to health check
    }


@app.get("/api")
async def api_info():
    """
    API version information endpoint.
    
    Provides information about API versioning for clients
    that need to check compatibility.
    
    Returns:
        dict: API version information
    """
    return {
        "current_version": API_VERSION,           # Currently active version
        "supported_versions": [API_VERSION],      # List of supported versions
        "base_url": API_PREFIX                    # Base URL for API calls
    }


# ============================================================================
# DEVELOPMENT SERVER
# ============================================================================

# This block only runs when the script is executed directly (not imported)
# Used for local development - in production, use uvicorn or gunicorn
if __name__ == "__main__":
    # Import uvicorn - the ASGI server for running FastAPI
    import uvicorn
    
    # Run the application with auto-reload for development
    # host="0.0.0.0" makes it accessible from other machines
    # port=8000 is the default API port
    # reload=True enables hot-reloading when code changes
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
