"""
Database initialization script
Creates all tables and initializes the database schema
"""
import sys
import os
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
