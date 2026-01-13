"""
Tests for robot data API endpoints.

Run with: pytest tests/test_robot_data.py -v
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


class TestRobotDataAPI:
    """Tests for the robot data API endpoints."""

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
    def test_get_job_summary(self, client: TestClient):
        """Test getting job summary for a robot."""
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
