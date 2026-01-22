"""
=============================================================================
System Logs API Tests - Log Management Endpoint Testing
=============================================================================

This module contains comprehensive tests for the system logs API endpoints,
verifying log CRUD operations, filtering, statistics, and export functionality.

TEST CLASSES:
    TestLogsAPI         - Log CRUD and filtering tests
    TestLogStats        - Log statistics endpoint tests
    TestCommandHistory  - Command history (category=command) tests
    TestErrorLogs       - Error-specific log retrieval tests
    TestLogCleanup      - Log retention/cleanup tests
    TestLogExport       - Log export (JSON/CSV) tests

FIXTURES USED (from conftest.py):
    - client:   FastAPI TestClient for making HTTP requests
    - test_db:  SQLAlchemy Session with test database

TEST MARKERS:
    @pytest.mark.api - Marks tests that require API endpoints

LOG LEVELS TESTED:
    - INFO     - Normal operation events
    - WARNING  - Potential issues
    - ERROR    - Errors requiring attention
    - CRITICAL - Severe failures

LOG CATEGORIES TESTED:
    - system   - General system events
    - mqtt     - MQTT communication logs
    - api      - API request logs
    - command  - Robot command history
    - database - Database operation logs

ENDPOINTS TESTED:
    GET    /api/v1/logs              - List logs with filters
    POST   /api/v1/logs              - Create new log entry
    GET    /api/v1/logs/categories   - Get available categories
    GET    /api/v1/logs/levels       - Get available log levels
    GET    /api/v1/logs/stats        - Log statistics
    GET    /api/v1/logs/commands     - Command history
    GET    /api/v1/logs/errors       - Error-only logs
    DELETE /api/v1/logs/clear        - Clear old logs
    GET    /api/v1/logs/export/json  - Export as JSON
    GET    /api/v1/logs/export/csv   - Export as CSV

RUNNING TESTS:
    # Run all log tests
    pytest tests/test_logs.py -v
    
    # Run specific test class
    pytest tests/test_logs.py::TestLogExport -v
    
    # Run with coverage
    pytest tests/test_logs.py --cov=routers/logs
"""

# =============================================================================
# IMPORTS
# =============================================================================

import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestLogsAPI:
    """Tests for the logs API endpoints."""

    def _create_test_log(self, test_db: Session, **kwargs):
        """Helper to create a test log entry."""
        from models.system_log import SystemLog
        
        log = SystemLog(
            level=kwargs.get("level", "INFO"),
            category=kwargs.get("category", "system"),
            message=kwargs.get("message", "Test log message"),
            robot_id=kwargs.get("robot_id"),
            details=kwargs.get("details", {})
        )
        test_db.add(log)
        test_db.commit()
        test_db.refresh(log)
        return log

    @pytest.mark.api
    def test_get_logs_empty(self, client: TestClient):
        """Test getting logs when none exist."""
        response = client.get("/api/v1/logs")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.api
    def test_get_logs_with_data(self, client: TestClient, test_db: Session):
        """Test getting logs when some exist."""
        self._create_test_log(test_db, message="Log 1")
        self._create_test_log(test_db, message="Log 2")
        
        response = client.get("/api/v1/logs")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2

    @pytest.mark.api
    def test_get_logs_filter_by_level(self, client: TestClient, test_db: Session):
        """Test filtering logs by level."""
        self._create_test_log(test_db, level="INFO")
        self._create_test_log(test_db, level="ERROR")
        self._create_test_log(test_db, level="WARNING")
        
        response = client.get("/api/v1/logs?level=error")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["level"] == "ERROR"

    @pytest.mark.api
    def test_get_logs_filter_by_category(self, client: TestClient, test_db: Session):
        """Test filtering logs by category."""
        self._create_test_log(test_db, category="system")
        self._create_test_log(test_db, category="mqtt")
        self._create_test_log(test_db, category="api")
        
        response = client.get("/api/v1/logs?category=mqtt")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["category"] == "mqtt"

    @pytest.mark.api
    def test_get_logs_filter_by_robot_id(self, client: TestClient, test_db: Session):
        """Test filtering logs by robot_id."""
        self._create_test_log(test_db, robot_id="robot_001")
        self._create_test_log(test_db, robot_id="robot_002")
        
        response = client.get("/api/v1/logs?robot_id=robot_001")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["robot_id"] == "robot_001"

    @pytest.mark.api
    def test_get_logs_search(self, client: TestClient, test_db: Session):
        """Test searching logs by message content."""
        self._create_test_log(test_db, message="Robot started successfully")
        self._create_test_log(test_db, message="Connection failed")
        
        response = client.get("/api/v1/logs?search=robot")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert "robot" in data[0]["message"].lower()

    @pytest.mark.api
    def test_create_log(self, client: TestClient):
        """Test creating a new log entry."""
        log_data = {
            "level": "INFO",
            "category": "api",
            "message": "Test log entry created",
            "robot_id": "test_robot_001",
            "details": {"key": "value"}
        }
        
        response = client.post("/api/v1/logs", json=log_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["level"] == "INFO"
        assert data["message"] == "Test log entry created"

    @pytest.mark.api
    def test_get_log_categories(self, client: TestClient):
        """Test getting available log categories."""
        response = client.get("/api/v1/logs/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert "mqtt" in data
        assert "api" in data
        assert "system" in data

    @pytest.mark.api
    def test_get_log_levels(self, client: TestClient):
        """Test getting available log levels."""
        response = client.get("/api/v1/logs/levels")
        assert response.status_code == 200
        
        data = response.json()
        assert "INFO" in data
        assert "WARNING" in data
        assert "ERROR" in data
        assert "CRITICAL" in data


class TestLogStats:
    """Tests for log statistics endpoint."""

    def _create_test_log(self, test_db: Session, **kwargs):
        """Helper to create a test log entry."""
        from models.system_log import SystemLog
        
        log = SystemLog(
            level=kwargs.get("level", "INFO"),
            category=kwargs.get("category", "system"),
            message=kwargs.get("message", "Test log message"),
            robot_id=kwargs.get("robot_id")
        )
        test_db.add(log)
        test_db.commit()
        return log

    @pytest.mark.api
    def test_get_log_stats(self, client: TestClient, test_db: Session):
        """Test getting log statistics."""
        self._create_test_log(test_db, level="INFO", category="system")
        self._create_test_log(test_db, level="ERROR", category="mqtt")
        self._create_test_log(test_db, level="WARNING", category="api")
        
        response = client.get("/api/v1/logs/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "info" in data
        assert "warning" in data
        assert "error" in data
        assert "by_category" in data


class TestCommandHistory:
    """Tests for command history endpoint."""

    def _create_command_log(self, test_db: Session, **kwargs):
        """Helper to create a command log."""
        from models.system_log import SystemLog
        
        log = SystemLog(
            level="INFO",
            category="command",
            message=kwargs.get("message", "Command executed"),
            robot_id=kwargs.get("robot_id", "robot_001"),
            details=kwargs.get("details", {"command": "move_forward"})
        )
        test_db.add(log)
        test_db.commit()
        return log

    @pytest.mark.api
    def test_get_command_history(self, client: TestClient, test_db: Session):
        """Test getting command history."""
        self._create_command_log(test_db, message="Move forward command")
        self._create_command_log(test_db, message="Stop command")
        
        response = client.get("/api/v1/logs/commands")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2

    @pytest.mark.api
    def test_get_command_history_filter_by_robot(self, client: TestClient, test_db: Session):
        """Test filtering command history by robot_id."""
        self._create_command_log(test_db, robot_id="robot_001")
        self._create_command_log(test_db, robot_id="robot_002")
        
        response = client.get("/api/v1/logs/commands?robot_id=robot_001")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1


class TestErrorLogs:
    """Tests for error logs endpoint."""

    def _create_test_log(self, test_db: Session, **kwargs):
        """Helper to create a test log."""
        from models.system_log import SystemLog
        
        log = SystemLog(
            level=kwargs.get("level", "INFO"),
            category=kwargs.get("category", "system"),
            message=kwargs.get("message", "Test log"),
            robot_id=kwargs.get("robot_id")
        )
        test_db.add(log)
        test_db.commit()
        return log

    @pytest.mark.api
    def test_get_error_logs(self, client: TestClient, test_db: Session):
        """Test getting error logs."""
        self._create_test_log(test_db, level="INFO")
        self._create_test_log(test_db, level="ERROR", message="Error occurred")
        self._create_test_log(test_db, level="CRITICAL", message="Critical failure")
        
        response = client.get("/api/v1/logs/errors")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2


class TestLogCleanup:
    """Tests for log cleanup functionality."""

    @pytest.mark.api
    def test_clear_old_logs(self, client: TestClient, test_db: Session):
        """Test clearing old logs."""
        response = client.delete("/api/v1/logs/clear?days=30")
        assert response.status_code == 200
        
        data = response.json()
        assert "deleted" in data["message"].lower()


class TestLogExport:
    """Tests for log export functionality."""

    def _create_test_log(self, test_db: Session, **kwargs):
        """Helper to create a test log."""
        from models.system_log import SystemLog
        
        log = SystemLog(
            level=kwargs.get("level", "INFO"),
            category=kwargs.get("category", "system"),
            message=kwargs.get("message", "Test log"),
            robot_id=kwargs.get("robot_id")
        )
        test_db.add(log)
        test_db.commit()
        return log

    @pytest.mark.api
    def test_export_logs_json(self, client: TestClient, test_db: Session):
        """Test exporting logs as JSON."""
        self._create_test_log(test_db, message="Log for export")
        
        response = client.get("/api/v1/logs/export/json")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

    @pytest.mark.api
    def test_export_logs_csv(self, client: TestClient, test_db: Session):
        """Test exporting logs as CSV."""
        self._create_test_log(test_db, message="Log for CSV export")
        
        response = client.get("/api/v1/logs/export/csv")
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]

    @pytest.mark.api
    def test_export_logs_csv_empty(self, client: TestClient):
        """Test exporting CSV when no logs exist."""
        response = client.get("/api/v1/logs/export/csv")
        # Should return 404 when no logs found
        assert response.status_code == 404
