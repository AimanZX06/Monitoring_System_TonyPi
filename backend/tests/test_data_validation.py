"""
Tests for data validation API endpoints.

Run with: pytest tests/test_data_validation.py -v
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestRobotDataValidation:
    """Tests for robot data validation endpoint."""

    def _create_test_robot(self, test_db: Session, **kwargs):
        """Helper to create a test robot."""
        from models.robot import Robot
        from datetime import datetime
        
        robot = Robot(
            robot_id=kwargs.get("robot_id", "test_robot_001"),
            name=kwargs.get("name", "Test Robot"),
            status=kwargs.get("status", "online"),
            last_seen=kwargs.get("last_seen", datetime.utcnow()),
            is_active=True
        )
        test_db.add(robot)
        test_db.commit()
        test_db.refresh(robot)
        return robot

    @pytest.mark.api
    @patch("routers.data_validation.influx_client")
    def test_validate_robot_data_healthy(self, mock_influx, client: TestClient, test_db: Session):
        """Test validating robot data when everything is healthy."""
        from datetime import datetime, timedelta
        
        # Create robot with recent last_seen
        robot = self._create_test_robot(
            test_db, 
            robot_id="healthy_robot",
            last_seen=datetime.utcnow() - timedelta(minutes=1)
        )
        
        # Mock InfluxDB returning valid data
        mock_influx.query_data.return_value = [
            {
                "system_cpu_percent": 45.0,
                "system_memory_percent": 60.0,
                "system_temperature": 55.0,
                "battery_level": 85.0
            }
        ]
        
        response = client.get(f"/api/v1/validate/robot/{robot.robot_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["robot_id"] == "healthy_robot"
        assert data["is_registered"] == True
        assert data["has_recent_data"] == True
        assert data["overall_status"] in ["HEALTHY", "PARTIAL"]

    @pytest.mark.api
    @patch("routers.data_validation.influx_client")
    def test_validate_robot_data_not_registered(self, mock_influx, client: TestClient):
        """Test validating data for unregistered robot."""
        mock_influx.query_data.return_value = []
        
        response = client.get("/api/v1/validate/robot/unregistered_robot")
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_registered"] == False
        assert data["overall_status"] in ["NO_DATA", "PARTIAL"]

    @pytest.mark.api
    @patch("routers.data_validation.influx_client")
    def test_validate_robot_data_no_influx_data(self, mock_influx, client: TestClient, test_db: Session):
        """Test validating robot with no InfluxDB data."""
        robot = self._create_test_robot(test_db, robot_id="no_data_robot")
        
        mock_influx.query_data.return_value = []
        
        response = client.get(f"/api/v1/validate/robot/{robot.robot_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_registered"] == True
        assert data["has_recent_data"] == False

    @pytest.mark.api
    @patch("routers.data_validation.influx_client")
    def test_validate_robot_data_out_of_range_values(self, mock_influx, client: TestClient, test_db: Session):
        """Test validating robot with out-of-range values."""
        robot = self._create_test_robot(test_db, robot_id="invalid_data_robot")
        
        # Mock InfluxDB returning invalid data
        mock_influx.query_data.return_value = [
            {
                "system_cpu_percent": 150.0,  # Invalid: > 100
                "system_memory_percent": -10.0,  # Invalid: < 0
                "system_temperature": 55.0,
                "battery_level": 85.0
            }
        ]
        
        response = client.get(f"/api/v1/validate/robot/{robot.robot_id}")
        assert response.status_code == 200
        
        data = response.json()
        # Should have validation issues
        validation_results = data["validation_results"]
        influx_result = next((r for r in validation_results if r["source"] == "InfluxDB"), None)
        if influx_result:
            assert influx_result["valid"] == False or len(influx_result.get("issues", [])) > 0


class TestDataSample:
    """Tests for data sample endpoint."""

    @pytest.mark.api
    @patch("routers.data_validation.influx_client")
    def test_get_data_sample(self, mock_influx, client: TestClient):
        """Test getting data sample for a robot."""
        mock_influx.query_data.return_value = [
            {"value": 45.0, "timestamp": "2025-01-01T12:00:00Z"},
            {"value": 50.0, "timestamp": "2025-01-01T12:01:00Z"}
        ]
        
        response = client.get("/api/v1/validate/data-sample/test_robot_001")
        assert response.status_code == 200
        
        data = response.json()
        assert data["robot_id"] == "test_robot_001"
        assert "samples" in data

    @pytest.mark.api
    @patch("routers.data_validation.influx_client")
    def test_get_data_sample_no_data(self, mock_influx, client: TestClient):
        """Test getting data sample when no data exists."""
        mock_influx.query_data.return_value = []
        
        response = client.get("/api/v1/validate/data-sample/empty_robot")
        assert response.status_code == 200
        
        data = response.json()
        assert data["samples"] == []
        assert "No data found" in data["message"]

    @pytest.mark.api
    @patch("routers.data_validation.influx_client")
    def test_get_data_sample_custom_measurement(self, mock_influx, client: TestClient):
        """Test getting data sample with custom measurement."""
        mock_influx.query_data.return_value = [{"value": 25.0}]
        
        response = client.get("/api/v1/validate/data-sample/test_robot?measurement=servo_data")
        assert response.status_code == 200
        
        data = response.json()
        assert data["measurement"] == "servo_data"

    @pytest.mark.api
    @patch("routers.data_validation.influx_client")
    def test_get_data_sample_with_limit(self, mock_influx, client: TestClient):
        """Test getting data sample with limit."""
        mock_influx.query_data.return_value = [
            {"value": i} for i in range(20)
        ]
        
        response = client.get("/api/v1/validate/data-sample/test_robot?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["samples"]) <= 5


class TestExpectedFormat:
    """Tests for expected data format endpoint."""

    @pytest.mark.api
    def test_get_expected_data_format(self, client: TestClient):
        """Test getting expected data format."""
        response = client.get("/api/v1/validate/expected-format")
        assert response.status_code == 200
        
        data = response.json()
        assert "mqtt_topics" in data
        assert "sensor_data_format" in data
        assert "status_data_format" in data
        assert "example_mqtt_publish" in data
        assert "notes" in data

    @pytest.mark.api
    def test_expected_format_contains_topics(self, client: TestClient):
        """Test that expected format contains required MQTT topics."""
        response = client.get("/api/v1/validate/expected-format")
        data = response.json()
        
        topics = data["mqtt_topics"]
        assert "sensors" in topics
        assert "status" in topics
        assert "battery" in topics


class TestValidateAllRobots:
    """Tests for validate all robots endpoint."""

    def _create_test_robot(self, test_db: Session, **kwargs):
        """Helper to create a test robot."""
        from models.robot import Robot
        from datetime import datetime
        
        robot = Robot(
            robot_id=kwargs.get("robot_id", "test_robot"),
            name=kwargs.get("name", "Test Robot"),
            status=kwargs.get("status", "online"),
            last_seen=kwargs.get("last_seen", datetime.utcnow()),
            is_active=True
        )
        test_db.add(robot)
        test_db.commit()
        return robot

    @pytest.mark.api
    @patch("routers.data_validation.influx_client")
    def test_validate_all_robots_empty(self, mock_influx, client: TestClient):
        """Test validating all robots when none exist."""
        response = client.get("/api/v1/validate/all-robots")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_robots"] == 0
        assert data["robots"] == []

    @pytest.mark.api
    @patch("routers.data_validation.influx_client")
    def test_validate_all_robots_with_data(self, mock_influx, client: TestClient, test_db: Session):
        """Test validating all robots when some exist."""
        from datetime import datetime, timedelta
        
        self._create_test_robot(
            test_db, 
            robot_id="robot_001",
            last_seen=datetime.utcnow() - timedelta(minutes=1)
        )
        self._create_test_robot(
            test_db, 
            robot_id="robot_002",
            last_seen=datetime.utcnow() - timedelta(hours=1)
        )
        
        mock_influx.query_data.return_value = [{"value": 45.0}]
        
        response = client.get("/api/v1/validate/all-robots")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_robots"] == 2
        assert len(data["robots"]) == 2
        
        # Check robot structure
        robot = data["robots"][0]
        assert "robot_id" in robot
        assert "status" in robot
        assert "has_influx_data" in robot
        assert "health" in robot
