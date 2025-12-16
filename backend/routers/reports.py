from fastapi import APIRouter, HTTPException, Depends, Response, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from database.database import get_db
from database.influx_client import influx_client
from models.report import Report as ReportModel
from models.job import Job as JobModel
import json
import io
import csv
import os

# PDF generation imports
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("Warning: reportlab not installed. PDF generation will be disabled.")

router = APIRouter()

class ReportResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    robot_id: Optional[str]
    report_type: str
    created_at: datetime
    data: Optional[dict]
    created_by: Optional[str]

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    title: str
    description: Optional[str] = None
    robot_id: Optional[str] = None
    report_type: str
    data: Optional[dict] = None
    created_by: Optional[str] = "system"

def generate_pdf_report(report_data: dict, report_type: str, robot_id: Optional[str] = None) -> bytes:
    """Generate a PDF report using reportlab"""
    if not PDF_AVAILABLE:
        raise HTTPException(status_code=500, detail="PDF generation library not available")
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a237e'),
        spaceAfter=30,
        alignment=1  # Center
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#283593'),
        spaceAfter=12
    )
    
    # Title
    title = f"{report_data.get('title', 'Robot Monitoring Report')}"
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Report metadata
    metadata = [
        ['Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
        ['Report Type:', report_type],
    ]
    if robot_id:
        metadata.append(['Robot ID:', robot_id])
    
    metadata_table = Table(metadata, colWidths=[2*inch, 4*inch])
    metadata_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e3f2fd')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    story.append(metadata_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Report content based on type
    if report_type == "performance":
        story.append(Paragraph("Performance Metrics", heading_style))
        
        perf_data = report_data.get('data', {})
        perf_table_data = [
            ['Metric', 'Value'],
            ['Average CPU Usage', f"{perf_data.get('avg_cpu_percent', 0):.2f}%"],
            ['Average Memory Usage', f"{perf_data.get('avg_memory_percent', 0):.2f}%"],
            ['Average Temperature', f"{perf_data.get('avg_temperature', 0):.2f}°C"],
            ['Data Points', str(perf_data.get('data_points', 0))],
            ['Period', perf_data.get('period', 'N/A')]
        ]
        
        perf_table = Table(perf_table_data, colWidths=[3*inch, 3*inch])
        perf_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3949ab')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        story.append(perf_table)
        
    elif report_type == "job":
        story.append(Paragraph("Job Summary", heading_style))
        
        job_data = report_data.get('data', {})
        job_table_data = [
            ['Field', 'Value'],
            ['Start Time', job_data.get('start_time', 'N/A')],
            ['End Time', job_data.get('end_time', 'N/A') or 'In Progress'],
            ['Items Processed', f"{job_data.get('items_processed', 0)} / {job_data.get('items_total', 0)}"],
            ['Completion', f"{job_data.get('percent_complete', 0):.1f}%"],
            ['Status', job_data.get('status', 'unknown').upper()]
        ]
        
        job_table = Table(job_table_data, colWidths=[3*inch, 3*inch])
        job_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3949ab')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        story.append(job_table)
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(
        f"<i>Report generated by TonyPi Monitoring System on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}</i>",
        styles['Normal']
    ))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

@router.get("/reports", response_model=List[ReportResponse])
async def get_reports(
    robot_id: Optional[str] = Query(None),
    report_type: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    """Get reports from PostgreSQL with optional filtering"""
    try:
        query = db.query(ReportModel)
        
        if robot_id:
            query = query.filter(ReportModel.robot_id == robot_id)
        if report_type:
            query = query.filter(ReportModel.report_type == report_type)
        
        reports = query.order_by(desc(ReportModel.created_at)).limit(limit).all()
        return [ReportResponse.model_validate(r) for r in reports]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@router.post("/reports", response_model=ReportResponse)
async def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    """Create a new report and store in PostgreSQL"""
    try:
        # Create report in database
        db_report = ReportModel(
            title=report.title,
            description=report.description,
            robot_id=report.robot_id,
            report_type=report.report_type,
            data=report.data,
            created_by=report.created_by
        )
        
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        return ReportResponse.model_validate(db_report)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")

@router.post("/reports/generate", response_model=ReportResponse)
async def generate_and_store_report(
    robot_id: Optional[str] = Query(None),
    report_type: str = Query("performance"),
    time_range: str = Query("24h"),
    db: Session = Depends(get_db)
):
    """Generate a report from InfluxDB data and store in PostgreSQL"""
    try:
        report_data = {}
        
        if report_type == "performance":
            # Get performance data from InfluxDB
            filters = {}
            if robot_id:
                filters["robot_id"] = robot_id
            
            perf_data = influx_client.query_data(
                measurement="robot_status",
                time_range=time_range,
                filters=filters
            )
            
            if not perf_data:
                raise HTTPException(status_code=404, detail="No performance data found")
            
            # Calculate averages
            cpu_values = [float(p.get("system_cpu_percent", 0)) for p in perf_data if p.get("system_cpu_percent")]
            mem_values = [float(p.get("system_memory_percent", 0)) for p in perf_data if p.get("system_memory_percent")]
            temp_values = [float(p.get("system_temperature", 0)) for p in perf_data if p.get("system_temperature")]
            
            avg_cpu = sum(cpu_values) / len(cpu_values) if cpu_values else 0
            avg_mem = sum(mem_values) / len(mem_values) if mem_values else 0
            avg_temp = sum(temp_values) / len(temp_values) if temp_values else 0
            
            report_data = {
                "title": f"Performance Report - {robot_id or 'All Robots'}",
                "description": f"{time_range} performance summary",
                "robot_id": robot_id,
                "report_type": "performance",
                "data": {
                    "avg_cpu_percent": round(avg_cpu, 2),
                    "avg_memory_percent": round(avg_mem, 2),
                    "avg_temperature": round(avg_temp, 2),
                    "data_points": len(perf_data),
                    "period": time_range
                }
            }
            
        elif report_type == "job":
            # Get job data from PostgreSQL
            if not robot_id:
                raise HTTPException(status_code=400, detail="robot_id required for job reports")
            
            # Get latest job for robot
            job = db.query(JobModel).filter(
                JobModel.robot_id == robot_id
            ).order_by(desc(JobModel.created_at)).first()
            
            if not job:
                raise HTTPException(status_code=404, detail="No job data found")
            
            report_data = {
                "title": f"Job Report - {robot_id}",
                "description": "Job completion summary",
                "robot_id": robot_id,
                "report_type": "job",
                "data": {
                    "start_time": job.start_time.isoformat() if job.start_time else None,
                    "end_time": job.end_time.isoformat() if job.end_time else None,
                    "items_processed": job.items_done,
                    "items_total": job.items_total,
                    "percent_complete": job.percent_complete,
                    "status": job.status
                }
            }
        
        # Store report in PostgreSQL
        db_report = ReportModel(**report_data, created_by="system")
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        return ReportResponse.model_validate(db_report)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

@router.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, db: Session = Depends(get_db)):
    """Get a specific report by ID from PostgreSQL"""
    try:
        report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
        return ReportResponse.from_orm(report)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching report: {str(e)}")

@router.delete("/reports/{report_id}")
async def delete_report(report_id: int, db: Session = Depends(get_db)):
    """Delete a report from PostgreSQL"""
    try:
        report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
        
        db.delete(report)
        db.commit()
        return {"message": f"Report {report_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")

@router.get("/reports/{report_id}/pdf")
async def get_report_pdf(report_id: int, db: Session = Depends(get_db)):
    """Generate and download a PDF report"""
    try:
        report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
        
        if not PDF_AVAILABLE:
            raise HTTPException(status_code=500, detail="PDF generation not available")
        
        # Generate PDF
        report_dict = {
            "title": report.title,
            "data": report.data
        }
        pdf_content = generate_pdf_report(
            report_dict,
            report.report_type,
            report.robot_id
        )
        
        filename = f"report_{report_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.get("/reports/export/csv")
async def export_reports_csv(
    robot_id: Optional[str] = Query(None),
    report_type: Optional[str] = Query(None),
    time_range: str = Query("24h")
):
    """Export performance data as CSV"""
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
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        
        csv_content = output.getvalue()
        output.close()
        
        return StreamingResponse(
            io.BytesIO(csv_content.encode()),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=robot_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting CSV: {str(e)}")

@router.get("/reports/export/json")
async def export_reports_json(
    robot_id: Optional[str] = Query(None),
    time_range: str = Query("24h")
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting JSON: {str(e)}")
