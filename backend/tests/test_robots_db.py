"""
Tests for robots database CRUD API endpoints.

Run with: pytest tests/test_robots_db.py -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestRobotsDBAPI:
    """Tests for the robots database API endpoints."""

    def _create_test_robot(self, test_db: Session, **kwargs):
        """Helper to create a test robot."""
        from models.robot import Robot
        
        robot = Robot(
            robot_id=kwargs.get("robot_id", "test_robot_001"),
            name=kwargs.get("name", "Test Robot"),
            description=kwargs.get("description", "A test robot"),
            status=kwargs.get("status", "online"),
            location=kwargs.get("location", "Lab A"),
            is_active=kwargs.get("is_active", True),
            battery_threshold_low=kwargs.get("battery_threshold_low", 20.0),
            battery_threshold_critical=kwargs.get("battery_threshold_critical", 10.0)
        )
        test_db.add(robot)
        test_db.commit()
        test_db.refresh(robot)
        return robot

    @pytest.mark.api
    def test_get_all_robots_empty(self, client: TestClient):
        """Test getting robots when none exist."""
        response = client.get("/api/v1/robots-db/robots")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.api
    def test_get_all_robots_with_data(self, client: TestClient, test_db: Session):
        """Test getting robots when some exist."""
        self._create_test_robot(test_db, robot_id="robot_001", name="Robot 1")
        self._create_test_robot(test_db, robot_id="robot_002", name="Robot 2")
        
        response = client.get("/api/v1/robots-db/robots")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2

    @pytest.mark.api
    def test_get_all_robots_excludes_inactive(self, client: TestClient, test_db: Session):
        """Test that inactive robots are excluded."""
        self._create_test_robot(test_db, robot_id="active_robot", is_active=True)
        self._create_test_robot(test_db, robot_id="inactive_robot", is_active=False)
        
        response = client.get("/api/v1/robots-db/robots")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["robot_id"] == "active_robot"

    @pytest.mark.api
    def test_get_robot_by_id(self, client: TestClient, test_db: Session):
        """Test getting a specific robot by ID."""
        robot = self._create_test_robot(test_db, robot_id="specific_robot", name="Specific Robot")
        
        response = client.get(f"/api/v1/robots-db/robots/{robot.robot_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["robot_id"] == "specific_robot"
        assert data["name"] == "Specific Robot"

    @pytest.mark.api
    def test_get_robot_not_found(self, client: TestClient):
        """Test getting a non-existent robot."""
        response = client.get("/api/v1/robots-db/robots/nonexistent")
        assert response.status_code == 404

    @pytest.mark.api
    def test_create_robot(self, client: TestClient):
        """Test creating a new robot."""
        robot_data = {
            "robot_id": "new_robot_001",
            "name": "New Test Robot",
            "description": "A newly created robot",
            "location": "Lab B",
            "battery_threshold_low": 25.0,
            "battery_threshold_critical": 15.0
        }
        
        response = client.post("/api/v1/robots-db/robots", json=robot_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["robot_id"] == "new_robot_001"
        assert data["name"] == "New Test Robot"

    @pytest.mark.api
    def test_create_robot_duplicate(self, client: TestClient, test_db: Session):
        """Test creating a robot with duplicate ID."""
        self._create_test_robot(test_db, robot_id="duplicate_robot")
        
        robot_data = {
            "robot_id": "duplicate_robot",
            "name": "Duplicate Robot"
        }
        
        response = client.post("/api/v1/robots-db/robots", json=robot_data)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    @pytest.mark.api
    def test_update_robot(self, client: TestClient, test_db: Session):
        """Test updating a robot."""
        robot = self._create_test_robot(test_db, robot_id="update_robot", name="Original Name")
        
        update_data = {
            "name": "Updated Name",
            "status": "offline",
            "location": "Lab C"
        }
        
        response = client.put(
            f"/api/v1/robots-db/robots/{robot.robot_id}",
            json=update_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["status"] == "offline"

    @pytest.mark.api
    def test_update_robot_not_found(self, client: TestClient):
        """Test updating a non-existent robot."""
        update_data = {"name": "New Name"}
        
        response = client.put(
            "/api/v1/robots-db/robots/nonexistent",
            json=update_data
        )
        assert response.status_code == 404

    @pytest.mark.api
    def test_delete_robot(self, client: TestClient, test_db: Session):
        """Test deleting (soft delete) a robot."""
        robot = self._create_test_robot(test_db, robot_id="delete_robot")
        
        response = client.delete(f"/api/v1/robots-db/robots/{robot.robot_id}")
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()
        
        # Verify robot is inactive (soft deleted)
        response = client.get("/api/v1/robots-db/robots")
        data = response.json()
        assert not any(r["robot_id"] == "delete_robot" for r in data)

    @pytest.mark.api
    def test_delete_robot_not_found(self, client: TestClient):
        """Test deleting a non-existent robot."""
        response = client.delete("/api/v1/robots-db/robots/nonexistent")
        assert response.status_code == 404


class TestSystemLogs:
    """Tests for system logs endpoint in robots_db router."""

    def _create_test_log(self, test_db: Session, **kwargs):
        """Helper to create a test log."""
        from models.system_log import SystemLog
        
        log = SystemLog(
            level=kwargs.get("level", "INFO"),
            category=kwargs.get("category", "api"),
            message=kwargs.get("message", "Test log"),
            robot_id=kwargs.get("robot_id")
        )
        test_db.add(log)
        test_db.commit()
        return log

    @pytest.mark.api
    def test_get_system_logs(self, client: TestClient, test_db: Session):
        """Test getting system logs."""
        self._create_test_log(test_db, message="Log 1")
        self._create_test_log(test_db, message="Log 2")
        
        response = client.get("/api/v1/robots-db/logs")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2

    @pytest.mark.api
    def test_get_system_logs_filter_by_level(self, client: TestClient, test_db: Session):
        """Test filtering system logs by level."""
        self._create_test_log(test_db, level="INFO")
        self._create_test_log(test_db, level="ERROR")
        
        response = client.get("/api/v1/robots-db/logs?level=error")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1

    @pytest.mark.api
    def test_get_system_logs_filter_by_category(self, client: TestClient, test_db: Session):
        """Test filtering system logs by category."""
        self._create_test_log(test_db, category="api")
        self._create_test_log(test_db, category="mqtt")
        
        response = client.get("/api/v1/robots-db/logs?category=mqtt")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1


class TestJobHistory:
    """Tests for job history endpoint."""

    def _create_test_job(self, test_db: Session, **kwargs):
        """Helper to create a test job."""
        from models.job import Job
        from datetime import datetime
        
        job = Job(
            robot_id=kwargs.get("robot_id", "test_robot_001"),
            status=kwargs.get("status", "completed"),
            items_total=kwargs.get("items_total", 100),
            items_done=kwargs.get("items_done", 100),
            start_time=kwargs.get("start_time", datetime.utcnow())
        )
        test_db.add(job)
        test_db.commit()
        return job

    @pytest.mark.api
    def test_get_job_history(self, client: TestClient, test_db: Session):
        """Test getting job history."""
        self._create_test_job(test_db, robot_id="robot_001")
        self._create_test_job(test_db, robot_id="robot_002")
        
        response = client.get("/api/v1/robots-db/jobs/history")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2

    @pytest.mark.api
    def test_get_job_history_filter_by_robot(self, client: TestClient, test_db: Session):
        """Test filtering job history by robot_id."""
        self._create_test_job(test_db, robot_id="robot_001")
        self._create_test_job(test_db, robot_id="robot_002")
        
        response = client.get("/api/v1/robots-db/jobs/history?robot_id=robot_001")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1


class TestDatabaseStats:
    """Tests for database statistics endpoint."""

    def _create_test_robot(self, test_db: Session, **kwargs):
        """Helper to create a test robot."""
        from models.robot import Robot
        
        robot = Robot(
            robot_id=kwargs.get("robot_id", "test_robot"),
            name=kwargs.get("name", "Test Robot"),
            status=kwargs.get("status", "online"),
            is_active=kwargs.get("is_active", True)
        )
        test_db.add(robot)
        test_db.commit()
        return robot

    @pytest.mark.api
    def test_get_database_stats(self, client: TestClient, test_db: Session):
        """Test getting database statistics."""
        self._create_test_robot(test_db, robot_id="robot_001", status="online")
        self._create_test_robot(test_db, robot_id="robot_002", status="offline")
        
        response = client.get("/api/v1/robots-db/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_robots" in data
        assert "online_robots" in data
        assert "offline_robots" in data
        assert "total_jobs" in data
        assert "active_jobs" in data
