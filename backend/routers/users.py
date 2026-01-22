"""
=============================================================================
Users Router - User Management and Authentication API
=============================================================================

This router provides REST API endpoints for user authentication, authorization,
and account management in the TonyPi Monitoring System.

AUTHENTICATION FLOW:
    1. User submits credentials to POST /auth/login
    2. Server validates credentials against password hash
    3. Server returns JWT access token
    4. Client includes token in Authorization header for protected routes
    5. Server validates token on each request

JWT TOKEN:
    - Algorithm: HS256
    - Payload: { "sub": username, "role": user_role, "exp": expiry }
    - Expiry: Configurable (default 24 hours)
    - Header format: "Authorization: Bearer <token>"

USER ROLES:
    ┌──────────┬─────────────────────────────────────────────────────────┐
    │ Role     │ Permissions                                             │
    ├──────────┼─────────────────────────────────────────────────────────┤
    │ admin    │ Full access - CRUD users, all system functions          │
    │ operator │ Robot control, alerts, reports - no user management     │
    │ viewer   │ Read-only access to dashboards and reports              │
    └──────────┴─────────────────────────────────────────────────────────┘

API ENDPOINTS:
    Authentication:
        POST   /auth/login     - Authenticate and get access token
        GET    /auth/me        - Get current user info
    
    User Management (admin only):
        GET    /users          - List all users
        POST   /users          - Create new user
        GET    /users/{id}     - Get user by ID
        PUT    /users/{id}     - Update user
        DELETE /users/{id}     - Delete user

PASSWORD SECURITY:
    - Passwords are hashed using bcrypt with salt
    - Plain passwords are never stored or logged
    - Minimum validation can be added in UserCreate model

DEPENDENCIES:
    - get_current_user: Extracts and validates JWT from Authorization header
    - require_admin: Ensures current user has admin role
"""

# =============================================================================
# IMPORTS
# =============================================================================

from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from database.database import get_db
from utils.auth import verify_password, get_password_hash, create_access_token, decode_access_token
import uuid
from datetime import datetime

# =============================================================================
# ROUTER SETUP
# =============================================================================

router = APIRouter()


def format_datetime(dt) -> Optional[str]:
    """Format datetime to ISO string, handling both datetime objects and strings."""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    if hasattr(dt, 'isoformat'):
        return dt.isoformat()
    return str(dt)


# Request/Response models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "viewer"  # admin, operator, viewer


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


# Dependency to get current user from token
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> dict:
    """Get current user from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Get user from database
    result = db.execute(
        text("SELECT id, username, email, role, is_active FROM users WHERE username = :username"),
        {"username": username}
    )
    user = result.fetchone()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active
    }


# Dependency to check if user is admin
async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.post("/auth/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    # Get user from database
    result = db.execute(
        text("SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = :username"),
        {"username": credentials.username}
    )
    user = result.fetchone()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    
    return LoginResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active
        )
    )


@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user information"""
    return UserResponse(**current_user)


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Create a new user (admin only)"""
    # Check if username already exists
    result = db.execute(
        text("SELECT id FROM users WHERE username = :username OR email = :email"),
        {"username": user_data.username, "email": user_data.email}
    )
    existing = result.fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    # Validate role
    if user_data.role not in ["admin", "operator", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be admin, operator, or viewer")
    
    # Create user
    user_id = str(uuid.uuid4())
    password_hash = get_password_hash(user_data.password)
    
    db.execute(
        text("""
            INSERT INTO users (id, username, email, password_hash, role, is_active)
            VALUES (:id, :username, :email, :password_hash, :role, true)
        """),
        {
            "id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "password_hash": password_hash,
            "role": user_data.role
        }
    )
    db.commit()
    
    # Fetch created user
    result = db.execute(
        text("SELECT id, username, email, role, is_active, created_at FROM users WHERE id = :id"),
        {"id": user_id}
    )
    user = result.fetchone()
    
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=format_datetime(user.created_at)
    )


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """List all users (admin only)"""
    result = db.execute(
        text("SELECT id, username, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC")
    )
    users = result.fetchall()
    
    return [
        UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=format_datetime(user.created_at),
            updated_at=format_datetime(user.updated_at)
        )
        for user in users
    ]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Get user by ID (admin only)"""
    result = db.execute(
        text("SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = :id"),
        {"id": user_id}
    )
    user = result.fetchone()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=format_datetime(user.created_at),
        updated_at=format_datetime(user.updated_at)
    )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Update user (admin only)"""
    # Check if user exists
    result = db.execute(
        text("SELECT id FROM users WHERE id = :id"),
        {"id": user_id}
    )
    user = result.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build update query dynamically
    updates = []
    params = {"id": user_id}
    
    if user_data.email is not None:
        # Check if email is already taken by another user
        check_result = db.execute(
            text("SELECT id FROM users WHERE email = :email AND id != :id"),
            {"email": user_data.email, "id": user_id}
        )
        if check_result.fetchone():
            raise HTTPException(status_code=400, detail="Email already in use")
        updates.append("email = :email")
        params["email"] = user_data.email
    
    if user_data.password is not None:
        updates.append("password_hash = :password_hash")
        params["password_hash"] = get_password_hash(user_data.password)
    
    if user_data.role is not None:
        if user_data.role not in ["admin", "operator", "viewer"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        updates.append("role = :role")
        params["role"] = user_data.role
    
    if user_data.is_active is not None:
        updates.append("is_active = :is_active")
        params["is_active"] = user_data.is_active
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    
    db.execute(
        text(f"UPDATE users SET {', '.join(updates)} WHERE id = :id"),
        params
    )
    db.commit()
    
    # Fetch updated user
    result = db.execute(
        text("SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = :id"),
        {"id": user_id}
    )
    updated_user = result.fetchone()
    
    return UserResponse(
        id=str(updated_user.id),
        username=updated_user.username,
        email=updated_user.email,
        role=updated_user.role,
        is_active=updated_user.is_active,
        created_at=format_datetime(updated_user.created_at),
        updated_at=format_datetime(updated_user.updated_at)
    )


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Delete user (admin only)"""
    # Prevent deleting yourself
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = db.execute(
        text("DELETE FROM users WHERE id = :id RETURNING id"),
        {"id": user_id}
    )
    deleted = result.fetchone()
    
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.commit()
    return None
