from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from database.database import engine, Base
from database.influx_client import influx_client
from mqtt.mqtt_client import mqtt_client
from routers import health, robot_data, reports, management
from routers import grafana_proxy, pi_perf
from routers import grafana_proxy

# Load environment variables
load_dotenv()

import asyncio
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import Base, engine
from mqtt.mqtt_client import mqtt_client
from routers import health, robot_data, reports, management, robots_db
from sqlalchemy import text

print("Starting TonyPi Monitoring System...")

def init_database():
    """Initialize database tables"""
    try:
        print("Initializing database tables...")
        # Import models to register them
        from models import Job, Robot, SystemLog
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
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
    # Startup - Wait for database and create tables
    wait_for_db()
    init_database()
    
    # Start MQTT client
    try:
        await mqtt_client.start()
    except Exception as e:
        print(f"MQTT client startup failed: {e}")
    
    yield
    
    # Shutdown - Stop MQTT client
    try:
        await mqtt_client.stop()
    except Exception as e:
        print(f"MQTT client shutdown failed: {e}")

# Create FastAPI app
app = FastAPI(
    title="TonyPi Robot Monitoring System",
    description="A comprehensive monitoring and management system for HiWonder TonyPi robot",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(robot_data.router, prefix="/api", tags=["robot-data"])
app.include_router(reports.router, prefix="/api", tags=["reports"])
app.include_router(management.router, prefix="/api", tags=["management"])
app.include_router(grafana_proxy.router, prefix="/api", tags=["grafana"])
app.include_router(pi_perf.router, prefix="/api", tags=["pi"])
app.include_router(robots_db.router, tags=["robots-database"])

@app.get("/")
async def root():
    return {"message": "TonyPi Robot Monitoring System API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)