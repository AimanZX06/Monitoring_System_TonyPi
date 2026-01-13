"""
Tests for reports API endpoints.

Run with: pytest tests/test_reports.py -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.conftest import create_test_report


class TestReportsAPI:
    """Tests for the reports API endpoints."""

    @pytest.mark.api
    def test_get_reports_empty(self, client: TestClient):
        """Test getting reports when none exist."""
        response = client.get("/api/v1/reports")
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.api
    def test_get_reports_with_data(self, client: TestClient, test_db: Session):
        """Test getting reports when some exist."""
        # Create test reports
        create_test_report(test_db, title="Report 1")
        create_test_report(test_db, title="Report 2")
        
        response = client.get("/api/v1/reports")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2

    @pytest.mark.api
    def test_create_report(self, client: TestClient):
        """Test creating a new report."""
        report_data = {
            "title": "Test Report",
            "description": "Test description",
            "robot_id": "test_robot_001",
            "report_type": "performance",
            "data": {"test_key": "test_value"},
        }
        
        response = client.post("/api/v1/reports", json=report_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "Test Report"
        assert data["report_type"] == "performance"
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.api
    def test_get_report_by_id(self, client: TestClient, test_db: Session):
        """Test getting a specific report by ID."""
        report = create_test_report(test_db, title="Specific Report")
        
        response = client.get(f"/api/v1/reports/{report.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "Specific Report"

    @pytest.mark.api
    def test_get_report_not_found(self, client: TestClient):
        """Test getting a non-existent report."""
        response = client.get("/api/v1/reports/99999")
        assert response.status_code == 404

    @pytest.mark.api
    def test_delete_report(self, client: TestClient, test_db: Session):
        """Test deleting a report."""
        report = create_test_report(test_db, title="To Delete")
        
        response = client.delete(f"/api/v1/reports/{report.id}")
        assert response.status_code == 200
        
        # Verify it's deleted
        response = client.get(f"/api/v1/reports/{report.id}")
        assert response.status_code == 404

    @pytest.mark.api
    def test_filter_reports_by_robot_id(self, client: TestClient, test_db: Session):
        """Test filtering reports by robot_id."""
        create_test_report(test_db, title="Robot 1 Report", robot_id="robot_001")
        create_test_report(test_db, title="Robot 2 Report", robot_id="robot_002")
        
        response = client.get("/api/v1/reports?robot_id=robot_001")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["robot_id"] == "robot_001"

    @pytest.mark.api
    def test_filter_reports_by_type(self, client: TestClient, test_db: Session):
        """Test filtering reports by report_type."""
        create_test_report(test_db, title="Perf Report", report_type="performance")
        create_test_report(test_db, title="Job Report", report_type="job")
        
        response = client.get("/api/v1/reports?report_type=performance")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["report_type"] == "performance"

    @pytest.mark.api
    def test_ai_status_endpoint(self, client: TestClient):
        """Test AI status endpoint."""
        response = client.get("/api/v1/reports/ai-status")
        assert response.status_code == 200
        
        data = response.json()
        assert "gemini_available" in data
        assert "pdf_available" in data
        assert "message" in data
