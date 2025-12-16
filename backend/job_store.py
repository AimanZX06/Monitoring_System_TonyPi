"""Job store for tracking robot job progress with PostgreSQL persistence.

Now stores data in PostgreSQL for durability and historical tracking.
"""
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from database.database import SessionLocal
from models.job import Job


class JobStore:
    def __init__(self):
        # Keep in-memory cache for quick access (optional)
        self.jobs: Dict[str, Dict[str, Any]] = {}
    
    def _get_db(self) -> Session:
        """Get database session"""
        return SessionLocal()

    def start_job(self, robot_id: str, total_items: int = 0):
        """Start a new job and persist to database"""
        db = self._get_db()
        try:
            # Check if there's an active job for this robot
            active_job = db.query(Job).filter(
                Job.robot_id == robot_id,
                Job.status == 'active'
            ).first()
            
            if active_job:
                # Finish the old job first
                active_job.end_time = datetime.utcnow()
                active_job.status = 'completed'
                db.commit()
            
            # Create new job in database
            new_job = Job(
                robot_id=robot_id,
                start_time=datetime.utcnow(),
                items_total=int(total_items),
                items_done=0,
                percent_complete=0.0,
                status='active'
            )
            db.add(new_job)
            db.commit()
            db.refresh(new_job)
            
            # Update cache
            job_dict = new_job.to_dict()
            job_dict['history'] = []
            self.jobs[robot_id] = job_dict
            
            return job_dict
        finally:
            db.close()

    def record_item(self, robot_id: str, item: Dict[str, Any]):
        """Record an item processed and update database"""
        db = self._get_db()
        try:
            # Get or create active job
            job = db.query(Job).filter(
                Job.robot_id == robot_id,
                Job.status == 'active'
            ).first()
            
            if not job:
                # Start a new job
                self.start_job(robot_id, total_items=0)
                job = db.query(Job).filter(
                    Job.robot_id == robot_id,
                    Job.status == 'active'
                ).first()
            
            # Update job
            job.items_done = (job.items_done or 0) + 1
            job.last_item = item
            
            # Update percent if total is known
            if job.items_total and job.items_total > 0:
                job.percent_complete = round((job.items_done / job.items_total) * 100, 2)
            
            db.commit()
            db.refresh(job)
            
            # Update cache
            job_dict = job.to_dict()
            if robot_id in self.jobs:
                job_dict['history'] = self.jobs[robot_id].get('history', [])
            else:
                job_dict['history'] = []
            job_dict['history'].append({
                'time': datetime.utcnow().isoformat(),
                'item': item
            })
            self.jobs[robot_id] = job_dict
            
            return job_dict
        finally:
            db.close()

    def set_progress(self, robot_id: str, percent: float):
        """Set job progress percentage"""
        db = self._get_db()
        try:
            job = db.query(Job).filter(
                Job.robot_id == robot_id,
                Job.status == 'active'
            ).first()
            
            if not job:
                self.start_job(robot_id, total_items=0)
                job = db.query(Job).filter(
                    Job.robot_id == robot_id,
                    Job.status == 'active'
                ).first()
            
            job.percent_complete = float(percent)
            db.commit()
            db.refresh(job)
            
            # Update cache
            job_dict = job.to_dict()
            if robot_id in self.jobs:
                job_dict['history'] = self.jobs[robot_id].get('history', [])
            self.jobs[robot_id] = job_dict
            
            return job_dict
        finally:
            db.close()

    def finish_job(self, robot_id: str):
        """Finish the active job"""
        db = self._get_db()
        try:
            job = db.query(Job).filter(
                Job.robot_id == robot_id,
                Job.status == 'active'
            ).first()
            
            if job:
                job.end_time = datetime.utcnow()
                job.percent_complete = 100.0
                job.status = 'completed'
                db.commit()
                db.refresh(job)
                
                # Update cache
                job_dict = job.to_dict()
                if robot_id in self.jobs:
                    job_dict['history'] = self.jobs[robot_id].get('history', [])
                self.jobs[robot_id] = job_dict
                
                return job_dict
            return None
        finally:
            db.close()

    def get(self, robot_id: str) -> Optional[Dict[str, Any]]:
        """Get active job from database"""
        db = self._get_db()
        try:
            job = db.query(Job).filter(
                Job.robot_id == robot_id,
                Job.status == 'active'
            ).first()
            
            if job:
                job_dict = job.to_dict()
                if robot_id in self.jobs:
                    job_dict['history'] = self.jobs[robot_id].get('history', [])
                else:
                    job_dict['history'] = []
                return job_dict
            return None
        finally:
            db.close()

    def get_summary(self, robot_id: str) -> Dict[str, Any]:
        """Get job summary from database"""
        db = self._get_db()
        try:
            job = db.query(Job).filter(
                Job.robot_id == robot_id,
                Job.status == 'active'
            ).first()
            
            if not job:
                return {
                    'robot_id': robot_id,
                    'start_time': None,
                    'end_time': None,
                    'items_total': 0,
                    'items_done': 0,
                    'percent_complete': 0.0,
                    'last_item': None
                }
            
            return {
                'robot_id': robot_id,
                'start_time': job.start_time.isoformat() if job.start_time else None,
                'end_time': job.end_time.isoformat() if job.end_time else None,
                'items_total': job.items_total or 0,
                'items_done': job.items_done or 0,
                'percent_complete': job.percent_complete or 0.0,
                'last_item': job.last_item
            }
        finally:
            db.close()
    
    def get_all_jobs(self, limit: int = 100) -> list:
        """Get all jobs from database"""
        db = self._get_db()
        try:
            jobs = db.query(Job).order_by(Job.created_at.desc()).limit(limit).all()
            return [job.to_dict() for job in jobs]
        finally:
            db.close()
    
    def get_completed_jobs_today(self) -> list:
        """Get jobs completed today"""
        db = self._get_db()
        try:
            from datetime import date
            today = date.today()
            jobs = db.query(Job).filter(
                Job.status == 'completed',
                Job.end_time >= datetime.combine(today, datetime.min.time())
            ).all()
            return [job.to_dict() for job in jobs]
        finally:
            db.close()


# Export a singleton job_store
job_store = JobStore()
