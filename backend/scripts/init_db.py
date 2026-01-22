"""
=============================================================================
Database Initialization Script - PostgreSQL Schema Setup
=============================================================================

This script creates all required database tables for the TonyPi Monitoring
System. It uses SQLAlchemy's ORM to generate tables from model definitions.

TABLES CREATED:
    - users:          User accounts and authentication
    - robots:         Robot configurations and thresholds
    - jobs:           Job/task tracking records
    - reports:        Generated report storage
    - alerts:         System alerts and notifications
    - alert_thresholds: Alert threshold configurations
    - system_logs:    Activity and error logs

USAGE:
    # Create all tables (safe - won't drop existing)
    python scripts/init_db.py
    
    # Drop and recreate all tables (WARNING: deletes all data!)
    python scripts/init_db.py --drop

WHEN TO RUN:
    1. First-time setup of the monitoring system
    2. After adding new models/tables to the codebase
    3. When resetting the database during development

NOTE: This script is automatically run by docker-compose on first startup.
For production, use proper database migrations (Alembic) instead.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import engine, Base, SessionLocal
from models import Job, Robot, SystemLog
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db():
    """Initialize database tables"""
    try:
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully!")
        
        # Log tables created
        db = SessionLocal()
        try:
            tables = Base.metadata.tables.keys()
            logger.info(f"Tables created: {', '.join(tables)}")
            
            # Create initial system log
            log = SystemLog(
                level='INFO',
                category='system',
                message='Database initialized successfully',
                details={'tables': list(tables)}
            )
            db.add(log)
            db.commit()
            logger.info("✅ Initial system log created")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ Error initializing database: {e}")
        raise


def drop_all_tables():
    """Drop all tables (use with caution!)"""
    try:
        logger.warning("⚠️  Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("✅ All tables dropped")
    except Exception as e:
        logger.error(f"❌ Error dropping tables: {e}")
        raise


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Database initialization script')
    parser.add_argument('--drop', action='store_true', help='Drop all tables before creating')
    args = parser.parse_args()
    
    if args.drop:
        drop_all_tables()
    
    init_db()
    print("\n🚀 Database is ready!")
