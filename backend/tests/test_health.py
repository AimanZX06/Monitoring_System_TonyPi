"""
Tests for health check endpoints.

Run with: pytest tests/test_health.py -v
"""
import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoints:
    """Tests for the health check API endpoints."""

    @pytest.mark.unit
    def test_health_check_returns_200(self, client: TestClient):
        """Test that health endpoint returns 200 OK."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    @pytest.mark.unit
    def test_health_check_response_format(self, client: TestClient):
        """Test that health endpoint returns expected format."""
        response = client.get("/api/v1/health")
        data = response.json()
        
        # Should have status field
        assert "status" in data
        assert data["status"] in ["healthy", "ok", "online"]

    @pytest.mark.unit
    def test_root_endpoint(self, client: TestClient):
        """Test root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "TonyPi" in data["message"]

    @pytest.mark.unit
    def test_api_info_endpoint(self, client: TestClient):
        """Test API version info endpoint."""
        response = client.get("/api")
        assert response.status_code == 200
        
        data = response.json()
        assert "current_version" in data
        assert data["current_version"] == "v1"
