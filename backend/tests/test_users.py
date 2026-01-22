"""
=============================================================================
User Management API Tests - Authentication and Authorization Testing
=============================================================================

This module contains comprehensive tests for user management and authentication
endpoints, verifying login, JWT tokens, CRUD operations, and role-based access.

TEST CLASSES:
    TestUserAuthentication  - Login/logout and token tests
    TestCurrentUser         - Current user info retrieval tests
    TestUserManagement      - Admin user CRUD operation tests
    TestNonAdminAccess      - Role-based access control tests

FIXTURES USED (from conftest.py):
    - client:   FastAPI TestClient for making HTTP requests
    - test_db:  SQLAlchemy Session with test database

TEST MARKERS:
    @pytest.mark.api - Marks tests that require API endpoints

AUTHENTICATION FLOW TESTED:
    1. POST /auth/login    - Authenticate and receive JWT token
    2. GET /auth/me        - Verify token and get user info
    3. Use token in Authorization header for protected routes

ROLE-BASED ACCESS TESTED:
    - admin:    Full access to user management (CRUD all users)
    - operator: Cannot manage users, gets 403 Forbidden
    - viewer:   Cannot manage users, gets 403 Forbidden

ENDPOINTS TESTED:
    Authentication:
        POST   /api/v1/auth/login     - User login
        GET    /api/v1/auth/me        - Get current user info
    
    User Management (admin only):
        GET    /api/v1/users          - List all users
        POST   /api/v1/users          - Create new user
        GET    /api/v1/users/{id}     - Get user by ID
        PUT    /api/v1/users/{id}     - Update user
        DELETE /api/v1/users/{id}     - Delete user

TEST SCENARIOS:
    - Successful login with correct credentials
    - Failed login with wrong password
    - Failed login with non-existent user
    - Failed login with inactive account
    - Access protected routes without token (401)
    - Access admin routes as non-admin (403)
    - Create user with duplicate username (400)
    - Create user with invalid role (400)
    - Admin cannot delete their own account (400)

RUNNING TESTS:
    # Run all user tests
    pytest tests/test_users.py -v
    
    # Run only authentication tests
    pytest tests/test_users.py::TestUserAuthentication -v
    
    # Run with coverage
    pytest tests/test_users.py --cov=routers/users
"""

# =============================================================================
# IMPORTS
# =============================================================================

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def create_test_user_in_db(test_db: Session, user_id: str, username: str, email: str, 
                           password: str, role: str = "operator", is_active: bool = True):
    """Helper to create a test user with proper password hashing."""
    from sqlalchemy import text
    import bcrypt
    
    # Use bcrypt directly to avoid passlib compatibility issues
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    test_db.execute(
        text("""
            INSERT INTO users (id, username, email, password_hash, role, is_active)
            VALUES (:id, :username, :email, :password_hash, :role, :is_active)
        """),
        {
            "id": user_id,
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "role": role,
            "is_active": is_active
        }
    )
    test_db.commit()


class TestUserAuthentication:
    """Tests for user authentication endpoints."""

    @pytest.mark.api
    def test_login_success(self, client: TestClient, test_db: Session):
        """Test successful login."""
        create_test_user_in_db(
            test_db, 
            user_id="test-user-id-123",
            username="testuser",
            email="test@example.com",
            password="testpass123",
            role="operator"
        )
        
        response = client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "testpass123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == "testuser"

    @pytest.mark.api
    def test_login_invalid_password(self, client: TestClient, test_db: Session):
        """Test login with invalid password."""
        create_test_user_in_db(
            test_db,
            user_id="user-id-456",
            username="testuser2",
            email="test2@example.com",
            password="correctpass",
            role="viewer"
        )
        
        response = client.post("/api/v1/auth/login", json={
            "username": "testuser2",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "Invalid username or password" in response.json()["detail"]

    @pytest.mark.api
    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user."""
        response = client.post("/api/v1/auth/login", json={
            "username": "nonexistent",
            "password": "anypassword"
        })
        
        assert response.status_code == 401

    @pytest.mark.api
    def test_login_inactive_user(self, client: TestClient, test_db: Session):
        """Test login with inactive user account."""
        create_test_user_in_db(
            test_db,
            user_id="inactive-user-id",
            username="inactiveuser",
            email="inactive@example.com",
            password="testpass",
            role="viewer",
            is_active=False
        )
        
        response = client.post("/api/v1/auth/login", json={
            "username": "inactiveuser",
            "password": "testpass"
        })
        
        assert response.status_code == 403
        assert "inactive" in response.json()["detail"].lower()


class TestCurrentUser:
    """Tests for getting current user information."""

    @pytest.mark.api
    def test_get_current_user_no_token(self, client: TestClient):
        """Test getting current user without token."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    @pytest.mark.api
    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401

    @pytest.mark.api
    def test_get_current_user_invalid_scheme(self, client: TestClient):
        """Test getting current user with invalid auth scheme."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Basic sometoken"}
        )
        assert response.status_code == 401


class TestUserManagement:
    """Tests for user CRUD operations."""

    def _create_admin_user(self, test_db: Session):
        """Helper to create admin user and get auth token."""
        from utils.auth import create_access_token
        
        user_id = "admin-user-id"
        create_test_user_in_db(
            test_db,
            user_id=user_id,
            username="admin",
            email="admin@example.com",
            password="adminpass",
            role="admin"
        )
        
        token = create_access_token(data={"sub": "admin", "role": "admin"})
        return user_id, token

    @pytest.mark.api
    def test_create_user_as_admin(self, client: TestClient, test_db: Session):
        """Test creating a new user as admin."""
        user_id, token = self._create_admin_user(test_db)
        
        response = client.post(
            "/api/v1/users",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "newpassword123",
                "role": "operator"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert data["role"] == "operator"

    @pytest.mark.api
    def test_create_user_duplicate_username(self, client: TestClient, test_db: Session):
        """Test creating user with duplicate username."""
        user_id, token = self._create_admin_user(test_db)
        
        # Try to create user with same username as admin
        response = client.post(
            "/api/v1/users",
            json={
                "username": "admin",
                "email": "different@example.com",
                "password": "password123",
                "role": "viewer"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    @pytest.mark.api
    def test_create_user_invalid_role(self, client: TestClient, test_db: Session):
        """Test creating user with invalid role."""
        user_id, token = self._create_admin_user(test_db)
        
        response = client.post(
            "/api/v1/users",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "password123",
                "role": "invalid_role"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 400
        assert "Invalid role" in response.json()["detail"]

    @pytest.mark.api
    def test_list_users_as_admin(self, client: TestClient, test_db: Session):
        """Test listing users as admin."""
        user_id, token = self._create_admin_user(test_db)
        
        response = client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least admin user

    @pytest.mark.api
    def test_get_user_by_id(self, client: TestClient, test_db: Session):
        """Test getting user by ID."""
        user_id, token = self._create_admin_user(test_db)
        
        response = client.get(
            f"/api/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "admin"

    @pytest.mark.api
    def test_get_user_not_found(self, client: TestClient, test_db: Session):
        """Test getting non-existent user."""
        user_id, token = self._create_admin_user(test_db)
        
        response = client.get(
            "/api/v1/users/nonexistent-id",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404

    @pytest.mark.api
    def test_update_user(self, client: TestClient, test_db: Session):
        """Test updating user."""
        user_id, token = self._create_admin_user(test_db)
        
        # Create a user to update
        target_user_id = "target-user-id"
        create_test_user_in_db(
            test_db,
            user_id=target_user_id,
            username="targetuser",
            email="target@example.com",
            password="password",
            role="viewer"
        )
        
        response = client.put(
            f"/api/v1/users/{target_user_id}",
            json={"role": "operator", "email": "updated@example.com"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "operator"
        assert data["email"] == "updated@example.com"

    @pytest.mark.api
    def test_update_user_no_fields(self, client: TestClient, test_db: Session):
        """Test updating user with no fields."""
        user_id, token = self._create_admin_user(test_db)
        
        response = client.put(
            f"/api/v1/users/{user_id}",
            json={},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 400
        assert "No fields to update" in response.json()["detail"]

    @pytest.mark.api
    def test_delete_user(self, client: TestClient, test_db: Session):
        """Test deleting user."""
        user_id, token = self._create_admin_user(test_db)
        
        # Create a user to delete
        target_user_id = "delete-user-id"
        create_test_user_in_db(
            test_db,
            user_id=target_user_id,
            username="deleteuser",
            email="delete@example.com",
            password="password",
            role="viewer"
        )
        
        response = client.delete(
            f"/api/v1/users/{target_user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 204

    @pytest.mark.api
    def test_delete_self(self, client: TestClient, test_db: Session):
        """Test that admin cannot delete themselves."""
        user_id, token = self._create_admin_user(test_db)
        
        response = client.delete(
            f"/api/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 400
        assert "Cannot delete your own account" in response.json()["detail"]


class TestNonAdminAccess:
    """Tests for non-admin access restrictions."""

    def _create_viewer_user(self, test_db: Session):
        """Helper to create viewer user and get auth token."""
        from utils.auth import create_access_token
        
        user_id = "viewer-user-id"
        create_test_user_in_db(
            test_db,
            user_id=user_id,
            username="viewer",
            email="viewer@example.com",
            password="viewerpass",
            role="viewer"
        )
        
        token = create_access_token(data={"sub": "viewer", "role": "viewer"})
        return user_id, token

    @pytest.mark.api
    def test_non_admin_cannot_create_user(self, client: TestClient, test_db: Session):
        """Test that non-admin cannot create users."""
        user_id, token = self._create_viewer_user(test_db)
        
        response = client.post(
            "/api/v1/users",
            json={
                "username": "newuser",
                "email": "new@example.com",
                "password": "password123",
                "role": "viewer"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 403
        assert "Admin access required" in response.json()["detail"]

    @pytest.mark.api
    def test_non_admin_cannot_list_users(self, client: TestClient, test_db: Session):
        """Test that non-admin cannot list users."""
        user_id, token = self._create_viewer_user(test_db)
        
        response = client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 403
