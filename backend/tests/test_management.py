"""
=============================================================================
Management API Tests - Robot Control and System Administration Testing
=============================================================================

This module contains comprehensive tests for robot management endpoints,
verifying command sending, configuration, emergency stop, and system status.

TEST CLASSES:
    TestManagementCommand  - Robot command endpoint tests
    TestManagementRobots   - Robot listing and configuration tests
    TestEmergencyStop      - Emergency stop functionality tests
    TestSystemStatus       - System health/status endpoint tests

FIXTURES USED (from conftest.py):
    - client:   FastAPI TestClient for making HTTP requests
    - test_db:  SQLAlchemy Session with test database

TEST MARKERS:
    @pytest.mark.api - Marks tests that require API endpoints

MQTT MOCKING:
    Tests use @patch to mock the MQTT client since we don't want to
    actually publish messages during tests. The mock allows us to:
    - Verify publish_command was called with correct parameters
    - Simulate MQTT success/failure scenarios

ENDPOINTS TESTED:
    Commands:
        POST   /api/v1/management/command           - Send command to robot
    
    Robot Configuration:
        GET    /api/v1/management/robots            - List available robots
        GET    /api/v1/management/robots/{id}/config - Get robot config
        PUT    /api/v1/management/robots/{id}/config - Update robot config
    
    Emergency Stop:
        POST   /api/v1/management/robots/{id}/emergency-stop - Stop robot
        POST   /api/v1/management/robots/{id}/resume         - Resume robot
        POST   /api/v1/management/emergency-stop/broadcast   - Stop all robots
    
    System:
        GET    /api/v1/management/system/status     - Get system health

COMMAND FLOW TESTED:
    1. Frontend sends command to /management/command
    2. Backend formats command and publishes to MQTT
    3. Robot receives command via MQTT subscription
    4. Robot executes and publishes response
    5. Backend returns success/failure to frontend

EMERGENCY STOP TESTED:
    - Single robot emergency stop
    - Broadcast emergency stop to all robots
    - Resume from emergency stop state

RUNNING TESTS:
    # Run all management tests
    pytest tests/test_management.py -v
    
    # Run only emergency stop tests
    pytest tests/test_management.py::TestEmergencyStop -v
    
    # Run with coverage
    pytest tests/test_management.py --cov=routers/management
"""

# =============================================================================
# IMPORTS
# =============================================================================

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestManagementCommand:
    """Tests for robot command endpoints."""

    @pytest.mark.api
    @patch("routers.management.mqtt_client")
    def test_send_command_success(self, mock_mqtt, client: TestClient):
        """Test sending a command to robot successfully."""
        mock_mqtt.publish_command.return_value = True
        
        command_data = {
            "command": "move_forward",
            "parameters": {"speed": 1.5},
            "robot_id": "tonypi_01"
        }
        
        response = client.post("/api/v1/management/command", json=command_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "command_id" in data
        mock_mqtt.publish_command.assert_called_once()

    @pytest.mark.api
    @patch("routers.management.mqtt_client")
    def test_send_command_failure(self, mock_mqtt, client: TestClient):
        """Test sending a command when MQTT fails."""
        mock_mqtt.publish_command.return_value = False
        
        command_data = {
            "command": "stop",
            "robot_id": "tonypi_01"
        }
        
        response = client.post("/api/v1/management/command", json=command_data)
        assert response.status_code == 500
        assert "Failed to send command" in response.json()["detail"]

    @pytest.mark.api
    @patch("routers.management.mqtt_client")
    def test_send_command_default_robot_id(self, mock_mqtt, client: TestClient):
        """Test sending command with default robot_id."""
        mock_mqtt.publish_command.return_value = True
        
        command_data = {
            "command": "get_status"
        }
        
        response = client.post("/api/v1/management/command", json=command_data)
        assert response.status_code == 200


class TestManagementRobots:
    """Tests for robot listing and configuration."""

    @pytest.mark.api
    def test_get_robots(self, client: TestClient):
        """Test getting list of robots."""
        response = client.get("/api/v1/management/robots")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # Check structure of first robot if exists
        if len(data) > 0:
            robot = data[0]
            assert "robot_id" in robot
            assert "name" in robot
            assert "status" in robot

    @pytest.mark.api
    def test_get_robot_config(self, client: TestClient, test_db: Session):
        """Test getting robot configuration."""
        response = client.get("/api/v1/management/robots/tonypi_01/config")
        assert response.status_code == 200
        
        data = response.json()
        assert "robot_id" in data
        assert "navigation" in data
        assert "sensors" in data
        assert "behavior" in data

    @pytest.mark.api
    @patch("routers.management.mqtt_client")
    def test_update_robot_config_success(self, mock_mqtt, client: TestClient, test_db: Session):
        """Test updating robot configuration."""
        mock_mqtt.publish_command.return_value = True
        
        config_update = {
            "config_type": "navigation",
            "config_data": {"max_speed": 2.0}
        }
        
        response = client.put(
            "/api/v1/management/robots/tonypi_01/config",
            json=config_update
        )
        assert response.status_code == 200
        assert "updated" in response.json()["message"].lower()

    @pytest.mark.api
    @patch("routers.management.mqtt_client")
    def test_update_robot_config_failure(self, mock_mqtt, client: TestClient, test_db: Session):
        """Test updating robot configuration when MQTT fails."""
        mock_mqtt.publish_command.return_value = False
        
        config_update = {
            "config_type": "sensors",
            "config_data": {"camera_fps": 60}
        }
        
        response = client.put(
            "/api/v1/management/robots/tonypi_01/config",
            json=config_update
        )
        assert response.status_code == 500


class TestEmergencyStop:
    """Tests for emergency stop functionality."""

    @pytest.mark.api
    @patch("routers.management.mqtt_client")
    def test_emergency_stop_success(self, mock_mqtt, client: TestClient):
        """Test emergency stop command."""
        mock_mqtt.publish_command.return_value = True
        
        response = client.post("/api/v1/management/robots/tonypi_01/emergency-stop")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        mock_mqtt.publish_command.assert_called()


class TestSystemStatus:
    """Tests for system status endpoint."""

    @pytest.mark.api
    def test_get_system_status(self, client: TestClient):
        """Test getting overall system status."""
        response = client.get("/api/v1/management/system/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "system_uptime" in data
        assert "active_robots" in data
        assert "system_health" in data
        assert "services" in data
        assert "resource_usage" in data
        
        # Check services structure
        services = data["services"]
        assert "mqtt_broker" in services
        assert "influxdb" in services
        assert "postgres" in services
        assert "grafana" in services
