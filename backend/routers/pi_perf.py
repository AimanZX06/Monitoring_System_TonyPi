"""
=============================================================================
Raspberry Pi Performance Router - System Metrics API
=============================================================================

This router provides an API endpoint for fetching Raspberry Pi system
performance metrics from InfluxDB. It supports querying by host/robot ID
and time range.

METRICS AVAILABLE:
    - system_cpu_percent:    CPU utilization percentage
    - system_memory_percent: RAM utilization percentage
    - system_disk_usage:     SD card storage utilization
    - system_temperature:    CPU temperature in Celsius
    - system_uptime:         Seconds since boot

DATA SOURCES:
    1. pi_perf measurement - Dedicated performance measurement
    2. robot_status measurement - Fallback if pi_perf not available
       (system_* fields are included in robot status telemetry)

API ENDPOINT:
    GET /pi/perf/{host}?time_range=5m
    
    Parameters:
        - host: Robot ID or hostname (path parameter)
        - time_range: InfluxDB time range (default: 5m)
    
    Returns:
        List of data points with fields like:
        - system_cpu_percent
        - system_memory_percent
        - system_disk_usage
        - system_temperature
        - system_uptime

USAGE:
    # Get last 5 minutes of performance data
    GET /api/v1/pi/perf/tonypi_001?time_range=5m
    
    # Get last hour of data
    GET /api/v1/pi/perf/tonypi_001?time_range=1h
"""

# =============================================================================
# IMPORTS
# =============================================================================

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database.influx_client import influx_client

# =============================================================================
# ROUTER SETUP
# =============================================================================

router = APIRouter()


@router.get("/pi/perf/{host}")
async def get_pi_performance(host: str, time_range: str = Query("5m")):
    """Return recent performance metrics for a Raspberry Pi identified by `host`.

    Expected measurement name in InfluxDB: `pi_perf`. Records should include a tag or field
    named `host` to filter by.
    """
    try:
        # Try measurement specifically for pi_perf first
        data = influx_client.query_recent_data("pi_perf", time_range)
        filtered = [d for d in data if d.get('host') == host or d.get('device') == host or d.get('hostname') == host]

        # If no pi_perf records found, fall back to robot_status measurement where system_info was stored
        if not filtered:
            status_data = influx_client.query_recent_data("robot_status", time_range)
            # system_info may be stored as a field or nested; try to extract cpu/memory entries
            extracted = []
            for d in status_data:
                # match on robot_id tag
                if d.get('robot_id') == host or d.get('robot_id') == f"{host}" or d.get('robot_id', '').startswith(host):
                    # Only include system_* fields (performance metrics)
                    field = d.get('field', '')
                    if field.startswith('system_') or field in ['status', 'ip_address', 'camera_url']:
                        extracted.append(d)
            filtered = extracted

        # Return more records to ensure all fields are included
        # InfluxDB returns each field as separate record, so we need enough to cover all fields
        return filtered[-500:]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pi performance: {e}")
