"""
=============================================================================
Robot Data API Tests - Unit Tests for Robot Data Endpoints
=============================================================================

This test module validates the robot data API endpoints including:
- Robot status retrieval
- Sensor data queries
- Job summary fetching
- Command sending
- Servo data access

TEST CATEGORIES:
    TestRobotDataAPI:
        - test_get_robot_status: Verify /status endpoint returns robot list
        - test_get_sensor_data: Test sensor data with mocked InfluxDB
        - test_get_sensor_data_missing_params: Handle missing parameters
        - test_get_latest_data_for_robot: Get latest data for specific robot
        - test_get_job_summary: Verify job summary with mocked job_store
        - test_send_command: Test command sending via MQTT
        - test_trigger_scan: Test QR scan triggering

    TestServoData:
        - test_get_servo_data: Verify servo data retrieval endpoint

MOCKING STRATEGY:
    - InfluxDB client is mocked to avoid time-series database dependency
    - job_store is mocked to avoid PostgreSQL dependency
    - MQTT client is implicitly mocked (commands queued even if robot offline)

FIXTURES USED (from conftest.py):
    - client: FastAPI TestClient instance
    - sample_sensor_data: Mock sensor readings
    - sample_robot_data: Mock robot status data

RUN COMMANDS:
    pytest tests/test_robot_data.py -v
    pytest tests/test_robot_data.py -v -m api
    pytest tests/test_robot_data.py --cov=routers.robot_data

NOTE: Tests use @pytest.mark.api for filtering API-specific tests
"""

# =============================================================================
# IMPORTS
# =============================================================================

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


# =============================================================================
# ROBOT DATA API TESTS
# =============================================================================

class TestRobotDataAPI:
    """
    Tests for the robot data API endpoints.
    
    These tests verify the /api/v1/robot-data/* endpoints function correctly,
    including proper error handling and response formats.
    """

    @pytest.mark.api
    def test_get_robot_status(self, client: TestClient):
        """Test getting robot status."""
        response = client.get("/api/v1/robot-data/status")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.api
    @patch("routers.robot_data.influx_client")
    def test_get_sensor_data(self, mock_influx, client: TestClient, sample_sensor_data):
        """Test getting sensor data with mocked InfluxDB."""
        mock_influx.query_data.return_value = sample_sensor_data
        
        response = client.get("/api/v1/robot-data/sensors?measurement=sensors&time_range=1h")
        assert response.status_code == 200

    @pytest.mark.api
    def test_get_sensor_data_missing_params(self, client: TestClient):
        """Test sensor data endpoint with missing required params."""
        response = client.get("/api/v1/robot-data/sensors")
        # Should either return 422 (validation error) or 200 with defaults
        assert response.status_code in [200, 422]

    @pytest.mark.api
    def test_get_latest_data_for_robot(self, client: TestClient):
        """Test getting latest data for a specific robot."""
        response = client.get("/api/v1/robot-data/latest/test_robot_001")
        # May return 200 with data or 404 if robot doesn't exist
        assert response.status_code in [200, 404]

    @pytest.mark.api
    @patch("routers.robot_data.job_store")
    def test_get_job_summary(self, mock_job_store, client: TestClient):
        """Test getting job summary for a robot."""
        # Mock the job_store to avoid database connection issues in tests
        mock_job_store.get_summary.return_value = {
            'robot_id': 'test_robot_001',
            'start_time': None,
            'end_time': None,
            'items_total': 0,
            'items_done': 0,
            'percent_complete': 0.0,
            'last_item': None
        }
        
        response = client.get("/api/v1/robot-data/job-summary/test_robot_001")
        # May return 200 with data or 404 if no job exists
        assert response.status_code in [200, 404]

    @pytest.mark.api
    def test_send_command(self, client: TestClient, sample_robot_data):
        """Test sending a command to a robot."""
        command = {
            "type": "status_request",
            "robot_id": "test_robot_001",
            "id": "test_cmd_001",
        }
        
        response = client.post("/api/v1/robot-data/command", json=command)
        # Should succeed even if robot doesn't exist (command queued)
        assert response.status_code in [200, 202]

    @pytest.mark.api
    def test_trigger_scan(self, client: TestClient):
        """Test triggering a QR scan."""
        scan_data = {
            "robot_id": "test_robot_001",
            "qr": "QR12345",
        }
        
        response = client.post("/api/v1/robot-data/trigger-scan", json=scan_data)
        assert response.status_code in [200, 202]


class TestServoData:
    """Tests for servo data endpoints."""

    @pytest.mark.api
    def test_get_servo_data(self, client: TestClient):
        """Test getting servo data for a robot."""
        response = client.get("/api/v1/robot-data/servos/test_robot_001?time_range=5m")
        # May return 200 with data or 404 if no servo data exists
        assert response.status_code in [200, 404]
