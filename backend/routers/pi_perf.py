from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database.influx_client import influx_client

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
                    # if the field contains json-like system_info, include it
                    extracted.append(d)
            filtered = extracted

        return filtered[-100:]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pi performance: {e}")
