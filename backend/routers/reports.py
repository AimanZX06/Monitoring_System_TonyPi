from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from database.database import get_db
from database.influx_client import influx_client
import json
import io
import csv

router = APIRouter()

class Report(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    robot_id: str
    report_type: str
    created_at: Optional[datetime] = None
    data: Optional[dict] = None

class ReportCreate(BaseModel):
    title: str
    description: str
    robot_id: str
    report_type: str
    data: Optional[dict] = None

@router.get("/reports", response_model=List[Report])
async def get_reports(
    robot_id: Optional[str] = None,
    report_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get reports with optional filtering"""
    try:
        # Generate real reports from InfluxDB data
        reports = []
        
        # Get all robots if no specific robot_id is provided
        robot_ids = [robot_id] if robot_id else []
        if not robot_ids:
            # Query for all unique robot IDs
            try:
                status_data = influx_client.query_data(
                    measurement="robot_status",
                    time_range="24h"
                )
                robot_ids = list(set([point.get("robot_id") for point in status_data if point.get("robot_id")]))
            except:
                robot_ids = []
        
        # Generate reports for each robot
        for rid in robot_ids:
            if not report_type or report_type == "performance":
                # Performance Report
                try:
                    perf_data = influx_client.query_data(
                        measurement="robot_status",
                        time_range="24h",
                        filters={"robot_id": rid}
                    )
                    
                    if perf_data:
                        avg_cpu = sum(float(p.get("system_cpu_percent", 0)) for p in perf_data) / len(perf_data)
                        avg_mem = sum(float(p.get("system_memory_percent", 0)) for p in perf_data) / len(perf_data)
                        avg_temp = sum(float(p.get("system_temperature", 0)) for p in perf_data) / len(perf_data)
                        
                        reports.append(Report(
                            id=len(reports) + 1,
                            title=f"Performance Report - {rid}",
                            description="24-hour performance summary",
                            robot_id=rid,
                            report_type="performance",
                            created_at=datetime.now(),
                            data={
                                "avg_cpu_percent": round(avg_cpu, 2),
                                "avg_memory_percent": round(avg_mem, 2),
                                "avg_temperature": round(avg_temp, 2),
                                "data_points": len(perf_data),
                                "period": "24 hours"
                            }
                        ))
                except Exception as e:
                    print(f"Error generating performance report for {rid}: {e}")
            
            if not report_type or report_type == "job":
                # Job Completion Report
                try:
                    # Get job summary from job_store
                    from main import job_store
                    job_summary = job_store.get_summary(rid)
                    
                    if job_summary and job_summary.get("items_done", 0) > 0:
                        reports.append(Report(
                            id=len(reports) + 1,
                            title=f"Job Report - {rid}",
                            description="Job completion summary",
                            robot_id=rid,
                            report_type="job",
                            created_at=datetime.now(),
                            data={
                                "start_time": job_summary.get("start_time"),
                                "end_time": job_summary.get("end_time"),
                                "items_processed": job_summary.get("items_done"),
                                "items_total": job_summary.get("items_total"),
                                "percent_complete": job_summary.get("percent_complete"),
                                "status": "completed" if job_summary.get("end_time") else "in_progress"
                            }
                        ))
                except Exception as e:
                    print(f"Error generating job report for {rid}: {e}")
        
        return reports[:limit]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@router.post("/reports", response_model=Report)
async def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    """Create a new report"""
    try:
        # Mock report creation - replace with actual database logic
        new_report = Report(
            id=999,  # Mock ID
            title=report.title,
            description=report.description,
            robot_id=report.robot_id,
            report_type=report.report_type,
            created_at=datetime.now(),
            data=report.data
        )
        
        return new_report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")

@router.get("/reports/{report_id}", response_model=Report)
async def get_report(report_id: int, db: Session = Depends(get_db)):
    """Get a specific report by ID"""
    try:
        # Mock report retrieval
        mock_report = Report(
            id=report_id,
            title="Sample Report",
            description="This is a sample report",
            robot_id="tonypi_01",
            report_type="general",
            created_at=datetime.now(),
            data={"sample": "data"}
        )
        
        return mock_report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching report: {str(e)}")

@router.delete("/reports/{report_id}")
async def delete_report(report_id: int, db: Session = Depends(get_db)):
    """Delete a report"""
    try:
        # Mock deletion
        return {"message": f"Report {report_id} deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")

@router.get("/reports/export/csv")
async def export_reports_csv(
    robot_id: Optional[str] = None,
    report_type: Optional[str] = None,
    time_range: str = "24h"
):
    """Export performance data as CSV"""
    try:
        # Query performance data from InfluxDB
        filters = {}
        if robot_id:
            filters["robot_id"] = robot_id
        
        data = influx_client.query_data(
            measurement="robot_status",
            time_range=time_range,
            filters=filters
        )
        
        if not data:
            raise HTTPException(status_code=404, detail="No data found")
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        
        # Create response
        csv_content = output.getvalue()
        output.close()
        
        return StreamingResponse(
            io.BytesIO(csv_content.encode()),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=robot_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting CSV: {str(e)}")

@router.get("/reports/export/json")
async def export_reports_json(
    robot_id: Optional[str] = None,
    time_range: str = "24h"
):
    """Export performance data as JSON"""
    try:
        filters = {}
        if robot_id:
            filters["robot_id"] = robot_id
        
        data = influx_client.query_data(
            measurement="robot_status",
            time_range=time_range,
            filters=filters
        )
        
        if not data:
            raise HTTPException(status_code=404, detail="No data found")
        
        json_content = json.dumps(data, indent=2, default=str)
        
        return StreamingResponse(
            io.BytesIO(json_content.encode()),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=robot_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting JSON: {str(e)}")