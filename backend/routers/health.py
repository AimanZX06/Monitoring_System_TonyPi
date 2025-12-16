from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: datetime
    services: dict

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="TonyPi Monitoring System is running",
        timestamp=datetime.now(),
        services={
            "api": "healthy",
            "database": "healthy",
            "influxdb": "healthy",
            "mqtt": "healthy"
        }
    )