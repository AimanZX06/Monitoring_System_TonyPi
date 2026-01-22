"""
=============================================================================
User Initialization Script - Create Default User Accounts
=============================================================================

This script creates the default user accounts for the TonyPi Monitoring System.
Users are created with predefined roles for different access levels.

DEFAULT USERS CREATED:
    ┌──────────┬──────────────┬──────────────────────────────────────────┐
    │ Username │ Password     │ Role & Permissions                       │
    ├──────────┼──────────────┼──────────────────────────────────────────┤
    │ admin    │ admin123     │ admin - Full system access               │
    │ operator │ operator123  │ operator - Robot control, no user mgmt   │
    │ viewer   │ viewer123    │ viewer - Read-only access                │
    └──────────┴──────────────┴──────────────────────────────────────────┘

ROLE PERMISSIONS:
    admin:    Full access - users, robots, alerts, reports, system config
    operator: Robot control, view alerts, generate reports
    viewer:   View-only access to dashboards and reports

USAGE:
    # Run from backend directory
    python scripts/init_users.py
    
    # Or via Docker
    docker-compose exec backend python scripts/init_users.py

SECURITY WARNING:
    These are default development credentials!
    For production deployments:
    1. Change all passwords immediately after first login
    2. Use strong, unique passwords
    3. Consider disabling the operator and viewer accounts
    4. Set up proper authentication (OAuth, LDAP, etc.)

NOTE: Script is idempotent - running multiple times won't duplicate users.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal, engine
from sqlalchemy import text
from utils.auth import get_password_hash
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_default_users():
    """Initialize default users"""
    db = SessionLocal()
    try:
        # Default users to create
        default_users = [
            {
                "username": "admin",
                "email": "admin@tonypi.local",
                "password": "admin123",
                "role": "admin"
            },
            {
                "username": "operator",
                "email": "operator@tonypi.local",
                "password": "operator123",
                "role": "operator"
            },
            {
                "username": "viewer",
                "email": "viewer@tonypi.local",
                "password": "viewer123",
                "role": "viewer"
            }
        ]
        
        for user_data in default_users:
            # Check if user already exists
            result = db.execute(
                text("SELECT id FROM users WHERE username = :username"),
                {"username": user_data["username"]}
            )
            existing = result.fetchone()
            
            if existing:
                logger.info(f"User '{user_data['username']}' already exists, skipping...")
                continue
            
            # Create user
            user_id = str(uuid.uuid4())
            password_hash = get_password_hash(user_data["password"])
            
            db.execute(
                text("""
                    INSERT INTO users (id, username, email, password_hash, role, is_active)
                    VALUES (:id, :username, :email, :password_hash, :role, true)
                """),
                {
                    "id": user_id,
                    "username": user_data["username"],
                    "email": user_data["email"],
                    "password_hash": password_hash,
                    "role": user_data["role"]
                }
            )
            logger.info(f"✅ Created user: {user_data['username']} ({user_data['role']})")
        
        db.commit()
        logger.info("✅ Default users initialized successfully!")
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error initializing users: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing default users...")
    init_default_users()
    print("\n🚀 Default users are ready!")
    print("\nDefault credentials:")
    print("  Admin:    admin / admin123")
    print("  Operator: operator / operator123")
    print("  Viewer:   viewer / viewer123")
    print("\n⚠️  Please change these passwords in production!")
