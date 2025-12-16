from fastapi import APIRouter, Query, Response, HTTPException
import os
import httpx

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
