"""
Tests for Raspberry Pi performance API endpoints.

Run with: pytest tests/test_pi_perf.py -v
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


class TestPiPerformance:
    """Tests for Raspberry Pi performance endpoint."""

    @pytest.mark.api
    @patch("routers.pi_perf.influx_client")
    def test_get_pi_performance(self, mock_influx, client: TestClient):
        """Test getting Pi performance data."""
        mock_influx.query_recent_data.return_value = [
            {"host": "tonypi_raspberrypi", "cpu_percent": 45.0, "memory_percent": 60.0},
            {"host": "tonypi_raspberrypi", "temperature": 55.0}
        ]
        
        response = client.get("/api/v1/pi/perf/tonypi_raspberrypi")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.api
    @patch("routers.pi_perf.influx_client")
    def test_get_pi_performance_no_data(self, mock_influx, client: TestClient):
        """Test getting Pi performance when no data exists."""
        mock_influx.query_recent_data.return_value = []
        
        response = client.get("/api/v1/pi/perf/unknown_host")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.api
    @patch("routers.pi_perf.influx_client")
    def test_get_pi_performance_custom_time_range(self, mock_influx, client: TestClient):
        """Test getting Pi performance with custom time range."""
        mock_influx.query_recent_data.return_value = [
            {"host": "tonypi_01", "cpu_percent": 50.0}
        ]
        
        response = client.get("/api/v1/pi/perf/tonypi_01?time_range=1h")
        assert response.status_code == 200

    @pytest.mark.api
    @patch("routers.pi_perf.influx_client")
    def test_get_pi_performance_fallback_to_robot_status(self, mock_influx, client: TestClient):
        """Test fallback to robot_status measurement when pi_perf has no data."""
        # First call (pi_perf) returns empty, second call (robot_status) returns data
        mock_influx.query_recent_data.side_effect = [
            [],  # pi_perf measurement
            [    # robot_status measurement
                {"robot_id": "tonypi_01", "field": "system_cpu_percent", "value": 45.0},
                {"robot_id": "tonypi_01", "field": "system_memory_percent", "value": 60.0}
            ]
        ]
        
        response = client.get("/api/v1/pi/perf/tonypi_01")
        assert response.status_code == 200

    @pytest.mark.api
    @patch("routers.pi_perf.influx_client")
    def test_get_pi_performance_influx_error(self, mock_influx, client: TestClient):
        """Test handling InfluxDB errors."""
        mock_influx.query_recent_data.side_effect = Exception("Connection failed")
        
        response = client.get("/api/v1/pi/perf/tonypi_01")
        assert response.status_code == 500
        assert "Error" in response.json()["detail"]

    @pytest.mark.api
    @patch("routers.pi_perf.influx_client")
    def test_get_pi_performance_filters_by_host(self, mock_influx, client: TestClient):
        """Test that results are filtered by host correctly."""
        mock_influx.query_recent_data.return_value = [
            {"host": "tonypi_01", "cpu_percent": 45.0},
            {"host": "tonypi_02", "cpu_percent": 55.0},
            {"host": "tonypi_01", "memory_percent": 60.0}
        ]
        
        response = client.get("/api/v1/pi/perf/tonypi_01")
        assert response.status_code == 200
        
        data = response.json()
        # All returned items should be for tonypi_01
        for item in data:
            if "host" in item:
                assert item["host"] == "tonypi_01"

    @pytest.mark.api
    @patch("routers.pi_perf.influx_client")
    def test_get_pi_performance_device_field_match(self, mock_influx, client: TestClient):
        """Test that device field is also used for matching."""
        mock_influx.query_recent_data.return_value = [
            {"device": "tonypi_raspberrypi", "cpu_percent": 45.0}
        ]
        
        response = client.get("/api/v1/pi/perf/tonypi_raspberrypi")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
