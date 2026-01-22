"""
=============================================================================
Alert API Tests - Alert and Threshold Endpoint Testing
=============================================================================

This module contains comprehensive tests for the alerts and thresholds API
endpoints, verifying CRUD operations, filtering, and statistics.

TEST CLASSES:
    TestAlertsAPI        - Alert CRUD and filtering tests
    TestAlertStats       - Alert statistics endpoint tests
    TestAlertThresholds  - Threshold configuration tests

FIXTURES USED (from conftest.py):
    - client:   FastAPI TestClient for making HTTP requests
    - test_db:  SQLAlchemy Session with test database

TEST MARKERS:
    @pytest.mark.api - Marks tests that require API endpoints

ENDPOINTS TESTED:
    Alerts:
        GET    /api/v1/alerts                    - List alerts with filters
        POST   /api/v1/alerts                    - Create new alert
        POST   /api/v1/alerts/{id}/acknowledge   - Acknowledge alert
        POST   /api/v1/alerts/{id}/resolve       - Resolve alert
        POST   /api/v1/alerts/acknowledge-all    - Bulk acknowledge
        DELETE /api/v1/alerts/{id}               - Delete alert
        GET    /api/v1/alerts/stats              - Alert statistics
    
    Thresholds:
        GET    /api/v1/alerts/thresholds         - List thresholds
        GET    /api/v1/alerts/thresholds/defaults - Get default values
        POST   /api/v1/alerts/thresholds         - Create/update threshold
        PUT    /api/v1/alerts/thresholds/{id}    - Update threshold
        DELETE /api/v1/alerts/thresholds/{id}    - Delete threshold
        POST   /api/v1/alerts/thresholds/init-defaults - Init defaults

RUNNING TESTS:
    # Run all alert tests
    pytest tests/test_alerts.py -v
    
    # Run only threshold tests
    pytest tests/test_alerts.py::TestAlertThresholds -v
    
    # Run with coverage
    pytest tests/test_alerts.py --cov=routers/alerts
"""

# =============================================================================
# IMPORTS
# =============================================================================

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestAlertsAPI:
    """Tests for the alerts API endpoints."""

    def _create_test_alert(self, test_db: Session, **kwargs):
        """Helper to create a test alert."""
        from models.alert import Alert
        
        alert = Alert(
            robot_id=kwargs.get("robot_id", "test_robot_001"),
            alert_type=kwargs.get("alert_type", "temperature"),
            severity=kwargs.get("severity", "warning"),
            title=kwargs.get("title", "Test Alert"),
            message=kwargs.get("message", "This is a test alert"),
            source=kwargs.get("source", "sensor"),
            value=kwargs.get("value", 75.5),
            threshold=kwargs.get("threshold", 70.0),
            acknowledged=kwargs.get("acknowledged", False),
            resolved=kwargs.get("resolved", False),
            details=kwargs.get("details", {})
        )
        test_db.add(alert)
        test_db.commit()
        test_db.refresh(alert)
        return alert

    @pytest.mark.api
    def test_get_alerts_empty(self, client: TestClient):
        """Test getting alerts when none exist."""
        response = client.get("/api/v1/alerts")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.api
    def test_get_alerts_with_data(self, client: TestClient, test_db: Session):
        """Test getting alerts when some exist."""
        self._create_test_alert(test_db, title="Alert 1", severity="warning")
        self._create_test_alert(test_db, title="Alert 2", severity="critical")
        
        response = client.get("/api/v1/alerts")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2

    @pytest.mark.api
    def test_get_alerts_filter_by_robot_id(self, client: TestClient, test_db: Session):
        """Test filtering alerts by robot_id."""
        self._create_test_alert(test_db, robot_id="robot_001")
        self._create_test_alert(test_db, robot_id="robot_002")
        
        response = client.get("/api/v1/alerts?robot_id=robot_001")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["robot_id"] == "robot_001"

    @pytest.mark.api
    def test_get_alerts_filter_by_severity(self, client: TestClient, test_db: Session):
        """Test filtering alerts by severity."""
        self._create_test_alert(test_db, severity="warning")
        self._create_test_alert(test_db, severity="critical")
        self._create_test_alert(test_db, severity="info")
        
        response = client.get("/api/v1/alerts?severity=critical")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["severity"] == "critical"

    @pytest.mark.api
    def test_get_alerts_filter_by_acknowledged(self, client: TestClient, test_db: Session):
        """Test filtering alerts by acknowledged status."""
        self._create_test_alert(test_db, acknowledged=True)
        self._create_test_alert(test_db, acknowledged=False)
        
        response = client.get("/api/v1/alerts?acknowledged=false")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["acknowledged"] == False

    @pytest.mark.api
    def test_create_alert(self, client: TestClient):
        """Test creating a new alert."""
        alert_data = {
            "robot_id": "test_robot_001",
            "alert_type": "cpu_high",
            "severity": "warning",
            "title": "High CPU Usage",
            "message": "CPU usage exceeded 80%",
            "value": 85.0,
            "threshold": 80.0
        }
        
        response = client.post("/api/v1/alerts", json=alert_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "High CPU Usage"
        assert data["severity"] == "warning"
        assert "id" in data

    @pytest.mark.api
    def test_acknowledge_alert(self, client: TestClient, test_db: Session):
        """Test acknowledging an alert."""
        alert = self._create_test_alert(test_db, acknowledged=False)
        
        response = client.post(
            f"/api/v1/alerts/{alert.id}/acknowledge?acknowledged_by=admin"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "acknowledged" in data["message"].lower()

    @pytest.mark.api
    def test_acknowledge_nonexistent_alert(self, client: TestClient):
        """Test acknowledging a non-existent alert."""
        response = client.post("/api/v1/alerts/99999/acknowledge")
        assert response.status_code == 404

    @pytest.mark.api
    def test_resolve_alert(self, client: TestClient, test_db: Session):
        """Test resolving an alert."""
        alert = self._create_test_alert(test_db, resolved=False)
        
        response = client.post(f"/api/v1/alerts/{alert.id}/resolve")
        assert response.status_code == 200
        
        data = response.json()
        assert "resolved" in data["message"].lower()

    @pytest.mark.api
    def test_resolve_nonexistent_alert(self, client: TestClient):
        """Test resolving a non-existent alert."""
        response = client.post("/api/v1/alerts/99999/resolve")
        assert response.status_code == 404

    @pytest.mark.api
    def test_acknowledge_all_alerts(self, client: TestClient, test_db: Session):
        """Test acknowledging all unacknowledged alerts."""
        self._create_test_alert(test_db, acknowledged=False)
        self._create_test_alert(test_db, acknowledged=False)
        self._create_test_alert(test_db, acknowledged=True)
        
        response = client.post("/api/v1/alerts/acknowledge-all?acknowledged_by=admin")
        assert response.status_code == 200
        
        data = response.json()
        assert "2" in data["message"] or "acknowledged" in data["message"].lower()

    @pytest.mark.api
    def test_delete_alert(self, client: TestClient, test_db: Session):
        """Test deleting an alert."""
        alert = self._create_test_alert(test_db)
        
        response = client.delete(f"/api/v1/alerts/{alert.id}")
        assert response.status_code == 200
        
        # Verify it's deleted
        response = client.get(f"/api/v1/alerts")
        data = response.json()
        assert not any(a["id"] == alert.id for a in data)

    @pytest.mark.api
    def test_delete_nonexistent_alert(self, client: TestClient):
        """Test deleting a non-existent alert."""
        response = client.delete("/api/v1/alerts/99999")
        assert response.status_code == 404


class TestAlertStats:
    """Tests for alert statistics endpoint."""

    def _create_test_alert(self, test_db: Session, **kwargs):
        """Helper to create a test alert."""
        from models.alert import Alert
        
        alert = Alert(
            robot_id=kwargs.get("robot_id", "test_robot_001"),
            alert_type=kwargs.get("alert_type", "temperature"),
            severity=kwargs.get("severity", "warning"),
            title=kwargs.get("title", "Test Alert"),
            message=kwargs.get("message", "This is a test alert"),
            acknowledged=kwargs.get("acknowledged", False),
            resolved=kwargs.get("resolved", False)
        )
        test_db.add(alert)
        test_db.commit()
        return alert

    @pytest.mark.api
    def test_get_alert_stats(self, client: TestClient, test_db: Session):
        """Test getting alert statistics."""
        self._create_test_alert(test_db, severity="critical", acknowledged=False)
        self._create_test_alert(test_db, severity="warning", acknowledged=True)
        self._create_test_alert(test_db, severity="info", resolved=True)
        
        response = client.get("/api/v1/alerts/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "critical" in data
        assert "warning" in data
        assert "info" in data
        assert "unacknowledged" in data
        assert "unresolved" in data

    @pytest.mark.api
    def test_get_alert_stats_filter_by_robot(self, client: TestClient, test_db: Session):
        """Test getting alert statistics filtered by robot_id."""
        self._create_test_alert(test_db, robot_id="robot_001", severity="critical")
        self._create_test_alert(test_db, robot_id="robot_002", severity="warning")
        
        response = client.get("/api/v1/alerts/stats?robot_id=robot_001")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] == 1
        assert data["critical"] == 1


class TestAlertThresholds:
    """Tests for alert threshold management."""

    def _create_test_threshold(self, test_db: Session, **kwargs):
        """Helper to create a test threshold."""
        from models.alert import AlertThreshold
        
        threshold = AlertThreshold(
            robot_id=kwargs.get("robot_id"),
            metric_type=kwargs.get("metric_type", "cpu"),
            warning_threshold=kwargs.get("warning_threshold", 70.0),
            critical_threshold=kwargs.get("critical_threshold", 90.0),
            enabled=kwargs.get("enabled", True)
        )
        test_db.add(threshold)
        test_db.commit()
        test_db.refresh(threshold)
        return threshold

    @pytest.mark.api
    def test_get_thresholds(self, client: TestClient, test_db: Session):
        """Test getting alert thresholds."""
        self._create_test_threshold(test_db, metric_type="cpu")
        self._create_test_threshold(test_db, metric_type="memory")
        
        response = client.get("/api/v1/alerts/thresholds")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2

    @pytest.mark.api
    def test_get_default_thresholds(self, client: TestClient):
        """Test getting default threshold values."""
        response = client.get("/api/v1/alerts/thresholds/defaults")
        assert response.status_code == 200
        
        data = response.json()
        assert "cpu" in data
        assert "memory" in data
        assert "temperature" in data
        assert "battery" in data

    @pytest.mark.api
    def test_create_threshold(self, client: TestClient):
        """Test creating a new threshold."""
        threshold_data = {
            "robot_id": "test_robot_001",
            "metric_type": "cpu",
            "warning_threshold": 75.0,
            "critical_threshold": 90.0,
            "enabled": True
        }
        
        response = client.post("/api/v1/alerts/thresholds", json=threshold_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["metric_type"] == "cpu"
        assert data["warning_threshold"] == 75.0

    @pytest.mark.api
    def test_create_threshold_updates_existing(self, client: TestClient, test_db: Session):
        """Test that creating a threshold with same robot/metric updates existing."""
        self._create_test_threshold(
            test_db, 
            robot_id="test_robot_001",
            metric_type="cpu",
            warning_threshold=70.0
        )
        
        # Try to create same threshold - should update
        threshold_data = {
            "robot_id": "test_robot_001",
            "metric_type": "cpu",
            "warning_threshold": 80.0,
            "critical_threshold": 95.0,
            "enabled": True
        }
        
        response = client.post("/api/v1/alerts/thresholds", json=threshold_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["warning_threshold"] == 80.0

    @pytest.mark.api
    def test_update_threshold(self, client: TestClient, test_db: Session):
        """Test updating a threshold."""
        threshold = self._create_test_threshold(test_db, metric_type="cpu")
        
        response = client.put(
            f"/api/v1/alerts/thresholds/{threshold.id}",
            json={"warning_threshold": 65.0, "enabled": False}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["warning_threshold"] == 65.0
        assert data["enabled"] == False

    @pytest.mark.api
    def test_update_nonexistent_threshold(self, client: TestClient):
        """Test updating a non-existent threshold."""
        response = client.put(
            "/api/v1/alerts/thresholds/99999",
            json={"warning_threshold": 65.0}
        )
        assert response.status_code == 404

    @pytest.mark.api
    def test_delete_threshold(self, client: TestClient, test_db: Session):
        """Test deleting a threshold."""
        threshold = self._create_test_threshold(test_db, metric_type="cpu")
        
        response = client.delete(f"/api/v1/alerts/thresholds/{threshold.id}")
        assert response.status_code == 200

    @pytest.mark.api
    def test_delete_nonexistent_threshold(self, client: TestClient):
        """Test deleting a non-existent threshold."""
        response = client.delete("/api/v1/alerts/thresholds/99999")
        assert response.status_code == 404

    @pytest.mark.api
    def test_init_default_thresholds(self, client: TestClient):
        """Test initializing default thresholds."""
        response = client.post("/api/v1/alerts/thresholds/init-defaults")
        assert response.status_code == 200
        
        data = response.json()
        assert "initialized" in data["message"].lower() or "default" in data["message"].lower()
