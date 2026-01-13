"""
Pytest configuration and fixtures for TonyPi backend tests.

This file contains shared fixtures that can be used across all tests.
"""
import os
import pytest
from typing import Generator, AsyncGenerator
from unittest.mock import MagicMock, AsyncMock

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Set test environment before importing app
os.environ["TESTING"] = "true"
os.environ["POSTGRES_URL"] = "sqlite:///:memory:"

from database.database import Base, get_db
from main import app


# =============================================================================
# Database Fixtures
# =============================================================================

@pytest.fixture(scope="function")
def test_db() -> Generator[Session, None, None]:
    """
    Create a fresh test database for each test.
    Uses SQLite in-memory for fast tests.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def override_get_db(test_db: Session):
    """Override the get_db dependency to use test database."""
    def _override_get_db():
        try:
            yield test_db
        finally:
            pass
    return _override_get_db


# =============================================================================
# API Client Fixtures
# =============================================================================

@pytest.fixture(scope="function")
def client(override_get_db) -> Generator[TestClient, None, None]:
    """
    Create a test client with database dependency override.
    Use this for API endpoint tests.
    """
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="module")
def client_no_db() -> Generator[TestClient, None, None]:
    """
    Create a test client without database override.
    Use this for simple endpoint tests that don't need DB.
    """
    with TestClient(app) as test_client:
        yield test_client


# =============================================================================
# Mock Fixtures
# =============================================================================

@pytest.fixture
def mock_mqtt_client():
    """Mock MQTT client for tests that don't need real MQTT."""
    mock = MagicMock()
    mock.publish = MagicMock(return_value=None)
    mock.subscribe = MagicMock(return_value=None)
    mock.start = AsyncMock(return_value=None)
    mock.stop = AsyncMock(return_value=None)
    return mock


@pytest.fixture
def mock_influx_client():
    """Mock InfluxDB client for tests that don't need real InfluxDB."""
    mock = MagicMock()
    mock.query_data = MagicMock(return_value=[])
    mock.write_data = MagicMock(return_value=None)
    mock.query_recent_data = MagicMock(return_value=[])
    return mock


# =============================================================================
# Sample Data Fixtures
# =============================================================================

@pytest.fixture
def sample_robot_data():
    """Sample robot data for tests."""
    return {
        "robot_id": "test_robot_001",
        "name": "Test Robot",
        "status": "online",
        "battery_level": 85.5,
        "location": {"x": 1.0, "y": 2.0, "z": 0.0},
        "system_cpu_percent": 45.2,
        "system_memory_percent": 62.1,
        "system_temperature": 52.3,
    }


@pytest.fixture
def sample_sensor_data():
    """Sample sensor data for tests."""
    return [
        {
            "timestamp": "2025-01-01T12:00:00Z",
            "robot_id": "test_robot_001",
            "sensor_type": "temperature",
            "value": 52.3,
            "unit": "°C",
        },
        {
            "timestamp": "2025-01-01T12:00:00Z",
            "robot_id": "test_robot_001",
            "sensor_type": "cpu",
            "value": 45.2,
            "unit": "%",
        },
    ]


@pytest.fixture
def sample_report_data():
    """Sample report data for tests."""
    return {
        "title": "Test Performance Report",
        "description": "Test report description",
        "robot_id": "test_robot_001",
        "report_type": "performance",
        "data": {
            "avg_cpu_percent": 45.2,
            "avg_memory_percent": 62.1,
            "avg_temperature": 52.3,
            "data_points": 100,
            "period": "24h",
        },
    }


@pytest.fixture
def sample_job_data():
    """Sample job data for tests."""
    return {
        "robot_id": "test_robot_001",
        "status": "active",
        "items_total": 100,
        "items_done": 45,
        "percent_complete": 45.0,
        "start_time": "2025-01-01T10:00:00Z",
    }


# =============================================================================
# Utility Functions
# =============================================================================

def create_test_robot(db: Session, robot_id: str = "test_robot_001", **kwargs):
    """Helper function to create a test robot in the database."""
    from models.robot import Robot
    
    robot = Robot(
        robot_id=robot_id,
        name=kwargs.get("name", f"Test Robot {robot_id}"),
        status=kwargs.get("status", "online"),
        **{k: v for k, v in kwargs.items() if k not in ["name", "status"]}
    )
    db.add(robot)
    db.commit()
    db.refresh(robot)
    return robot


def create_test_report(db: Session, **kwargs):
    """Helper function to create a test report in the database."""
    from models.report import Report
    
    report = Report(
        title=kwargs.get("title", "Test Report"),
        description=kwargs.get("description", "Test description"),
        robot_id=kwargs.get("robot_id", "test_robot_001"),
        report_type=kwargs.get("report_type", "performance"),
        data=kwargs.get("data", {}),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
