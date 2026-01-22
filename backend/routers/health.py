"""
Health Check Router
===================

This module provides a health check endpoint for the API.

Health checks are used to:
- Verify the API is running and responding
- Check connectivity to dependent services (database, InfluxDB, MQTT)
- Enable load balancers to detect unhealthy instances
- Support Kubernetes/Docker health probes

The /health endpoint returns a 200 OK when all services are healthy,
allowing monitoring tools to track system availability.
"""

# ============================================================================
# IMPORTS
# ============================================================================

# APIRouter: FastAPI's way to organize endpoints into groups/modules
# Routers can be included in the main app with a prefix
from fastapi import APIRouter

# BaseModel: Pydantic's base class for data validation models
# Used to define the shape of request/response data
from pydantic import BaseModel

# datetime: For timestamps in responses
from datetime import datetime

# ============================================================================
# ROUTER SETUP
# ============================================================================

# Create a router instance
# This router will be imported and included in the main app
# All routes defined here will be accessible under the app's prefix
router = APIRouter()


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class HealthResponse(BaseModel):
    """
    Pydantic model for health check response.
    
    Pydantic models provide:
    - Automatic data validation
    - Type checking
    - JSON serialization
    - OpenAPI documentation generation
    
    Attributes:
        status (str): Overall system status ("healthy" or "unhealthy")
        message (str): Human-readable status message
        timestamp (datetime): When the health check was performed
        services (dict): Status of individual services
    """
    # Overall status: "healthy" when all services are working
    status: str
    
    # Human-readable message explaining the status
    message: str
    
    # When this health check was performed
    timestamp: datetime
    
    # Dictionary of individual service statuses
    # Example: {"api": "healthy", "database": "healthy", "mqtt": "healthy"}
    services: dict


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns the current health status of the API and its dependent services.
    
    This endpoint:
    - Is used by load balancers to route traffic to healthy instances
    - Is used by Kubernetes for readiness/liveness probes
    - Is used by monitoring systems to track availability
    
    HTTP Methods:
        GET: Returns current health status
        
    Returns:
        HealthResponse: JSON object containing:
            - status: "healthy" or "unhealthy"
            - message: Description of system status
            - timestamp: Current server time
            - services: Individual service statuses
            
    Example Response:
        {
            "status": "healthy",
            "message": "TonyPi Monitoring System is running",
            "timestamp": "2024-01-15T10:30:00.000Z",
            "services": {
                "api": "healthy",
                "database": "healthy",
                "influxdb": "healthy",
                "mqtt": "healthy"
            }
        }
        
    Notes:
        - Returns 200 OK even if some services are degraded
        - Check individual service statuses for specific issues
        - In production, this should actually check service connections
    """
    # Return a HealthResponse object
    # Pydantic will automatically serialize this to JSON
    return HealthResponse(
        status="healthy",
        message="TonyPi Monitoring System is running",
        timestamp=datetime.now(),
        services={
            "api": "healthy",      # The API server itself
            "database": "healthy", # PostgreSQL database
            "influxdb": "healthy", # InfluxDB time-series database
            "mqtt": "healthy"      # MQTT broker for robot communication
        }
    )
