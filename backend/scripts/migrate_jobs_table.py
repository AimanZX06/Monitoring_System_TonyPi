"""
Migration script to add new columns to the jobs table for TonyPi job tracking.

New columns:
- task_name: Name of the task (e.g., "find_red_ball")
- phase: Current phase (scanning, searching, executing, done)
- estimated_duration: Expected total time in seconds
- action_duration: Actual time taken
- success: Whether task completed successfully
- cancel_reason: Reason if job was cancelled

Run this script once to update an existing database:
    python -m scripts.migrate_jobs_table
"""
import os
import sys
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import engine


def migrate_jobs_table():
    """Add new columns to jobs table if they don't exist"""
    
    columns_to_add = [
        ("task_name", "VARCHAR(255)"),
        ("phase", "VARCHAR(50)"),
        ("estimated_duration", "FLOAT"),
        ("action_duration", "FLOAT"),
        ("success", "BOOLEAN"),
        ("cancel_reason", "VARCHAR(255)"),
    ]
    
    with engine.connect() as conn:
        for column_name, column_type in columns_to_add:
            try:
                # Check if column exists (PostgreSQL specific)
                result = conn.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='jobs' AND column_name='{column_name}'
                """))
                
                if result.fetchone() is None:
                    # Column doesn't exist, add it
                    conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {column_name} {column_type}"))
                    conn.commit()
                    print(f"Added column: {column_name} ({column_type})")
                else:
                    print(f"Column already exists: {column_name}")
                    
            except (OperationalError, ProgrammingError) as e:
                print(f"Error adding column {column_name}: {e}")
                conn.rollback()
    
    print("\nMigration complete!")


if __name__ == "__main__":
    print("Migrating jobs table for TonyPi job tracking...")
    print("-" * 50)
    migrate_jobs_table()
