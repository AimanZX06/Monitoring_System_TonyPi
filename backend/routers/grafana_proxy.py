"""
=============================================================================
Grafana Proxy Router - Server-Side Panel Rendering
=============================================================================

This router provides a proxy endpoint for rendering Grafana panels server-side.
It allows the frontend to request panel images without needing direct access
to Grafana or its API key.

WHY A PROXY?
    1. Security: API key stays on the server, not exposed to frontend
    2. CORS: Avoids cross-origin issues with Grafana
    3. Simplicity: Frontend just calls our API, we handle Grafana auth

HOW IT WORKS:
    1. Frontend calls /api/grafana/render with panel parameters
    2. This endpoint calls Grafana's render API with server-side API key
    3. Grafana renders the panel to a PNG image
    4. Image is returned to the frontend

REQUIREMENTS:
    - GRAFANA_BASE_URL: Grafana server URL (default: http://grafana:3000)
    - GRAFANA_API_KEY: API key with viewer permissions
    - Grafana Image Renderer plugin must be installed

API ENDPOINT:
    GET /api/grafana/render
    
    Query Parameters:
        - dashboard_uid: Grafana dashboard UID (required)
        - panel_id: Panel ID within the dashboard (required)
        - from_time: Start time (default: now-1h)
        - to_time: End time (default: now)
        - var_robot_id: Robot ID variable for filtering
        - width: Image width in pixels (default: 1000)
        - height: Image height in pixels (default: 500)
    
    Returns:
        PNG image (image/png content type)

USAGE:
    <img src="/api/grafana/render?dashboard_uid=tonypi&panel_id=1&width=800&height=400" />

NOTE: This is an alternative to iframe embedding. Use iframes when possible
for interactive panels, use this endpoint for static snapshots.
"""

# =============================================================================
# IMPORTS
# =============================================================================

from fastapi import APIRouter, Query, Response, HTTPException
import os
import httpx

# =============================================================================
# ROUTER SETUP
# =============================================================================

router = APIRouter(prefix="/api/grafana", tags=["grafana"])

GRAFANA_BASE = os.getenv("GRAFANA_BASE_URL", "http://grafana:3000")
GRAFANA_KEY = os.getenv("GRAFANA_API_KEY")


@router.get("/render")
async def render_panel(
    dashboard_uid: str = Query(...),
    panel_id: int = Query(...),
    from_time: str = Query("now-1h"),
    to_time: str = Query("now"),
    var_robot_id: str | None = Query(None),
    width: int = Query(1000),
    height: int = Query(500),
):
    """Render a Grafana panel server-side and return PNG to the client.

    This endpoint calls Grafana's render API using a server-side API key so the
    frontend does not need direct access to Grafana or the API key.
    """
    if not GRAFANA_KEY:
        raise HTTPException(status_code=500, detail="Grafana API key not configured on server")

    params = {
        "panelId": panel_id,
        "from": from_time,
        "to": to_time,
        "width": width,
        "height": height,
    }
    if var_robot_id:
        params["var-robot_id"] = var_robot_id

    url = f"{GRAFANA_BASE}/render/d/{dashboard_uid}"
    headers = {"Authorization": f"Bearer {GRAFANA_KEY}"}

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(url, headers=headers, params=params)

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=f"Grafana render failed: {resp.text}")

    return Response(content=resp.content, media_type="image/png")
