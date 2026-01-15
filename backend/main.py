"""
TonyPi Robot Monitoring System - Backend API

A comprehensive monitoring and management system for HiWonder TonyPi robots.
"""
import time
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file (for local development)
# In Docker, environment variables are passed via docker-compose.yml
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database.database import Base, engine
from mqtt.mqtt_client import mqtt_client
from routers import (
    health,
    robot_data,
    reports,
    management,
    grafana_proxy,
    pi_perf,
    robots_db,
    data_validation,
    alerts,
    logs,
    users
)

# API Version
API_VERSION = "v1"
API_PREFIX = f"/api/{API_VERSION}"

print("Starting TonyPi Monitoring System...")


def init_database():
    """Initialize database tables"""
    try:
        print("Initializing database tables...")
        # Import models to register them
        from models import Job, Robot, SystemLog, Alert, AlertThreshold, User
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
        
        # Initialize default users if they don't exist
        try:
            from scripts.init_users import init_default_users
            init_default_users()
        except Exception as e:
            print(f"Warning: Could not initialize default users: {e}")
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise


def wait_for_db(max_retries=30, delay=2):
    """Wait for database to be ready with retries"""
    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("Database connection successful!")
            return True
        except Exception as e:
            print(f"Database connection attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                print("Max database connection retries exceeded!")
                raise
    return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events"""
    # Startup - Wait for database and create tables
    wait_for_db()
    init_database()
    
    # Start MQTT client
    try:
        await mqtt_client.start()
        print("MQTT client started successfully!")
    except Exception as e:
        print(f"MQTT client startup failed: {e}")
    
    yield
    
    # Shutdown - Stop MQTT client
    try:
        await mqtt_client.stop()
        print("MQTT client stopped successfully!")
    except Exception as e:
        print(f"MQTT client shutdown failed: {e}")


# Create FastAPI app
app = FastAPI(
    title="TonyPi Robot Monitoring System",
    description="A comprehensive monitoring and management system for HiWonder TonyPi robot",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=f"{API_PREFIX}/docs",
    redoc_url=f"{API_PREFIX}/redoc",
    openapi_url=f"{API_PREFIX}/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://frontend:3000",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with API versioning prefix
app.include_router(health.router, prefix=API_PREFIX, tags=["health"])
app.include_router(robot_data.router, prefix=API_PREFIX, tags=["robot-data"])
app.include_router(reports.router, prefix=API_PREFIX, tags=["reports"])
app.include_router(management.router, prefix=API_PREFIX, tags=["management"])
app.include_router(grafana_proxy.router, prefix=API_PREFIX, tags=["grafana"])
app.include_router(pi_perf.router, prefix=API_PREFIX, tags=["pi-performance"])
app.include_router(robots_db.router, prefix=API_PREFIX, tags=["robots-database"])
app.include_router(data_validation.router, prefix=API_PREFIX, tags=["validation"])
app.include_router(alerts.router, prefix=API_PREFIX, tags=["alerts"])
app.include_router(logs.router, prefix=API_PREFIX, tags=["logs"])
app.include_router(users.router, prefix=API_PREFIX, tags=["users"])


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "TonyPi Robot Monitoring System API",
        "version": "1.0.0",
        "api_version": API_VERSION,
        "docs": f"{API_PREFIX}/docs",
        "health": f"{API_PREFIX}/health"
    }


@app.get("/api")
async def api_info():
    """API version information"""
    return {
        "current_version": API_VERSION,
        "supported_versions": [API_VERSION],
        "base_url": API_PREFIX
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
