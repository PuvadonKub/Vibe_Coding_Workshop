"""
Integration tests for authentication endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.models.user import User


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)


@pytest.fixture(scope="function")
def test_db():
    """Create and clean up test database for each test"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123"
    }


@pytest.fixture
def sample_user_data_2():
    """Second sample user data for testing"""
    return {
        "username": "testuser2",
        "email": "test2@example.com", 
        "password": "testpassword456"
    }


class TestUserRegistration:
    """Test user registration endpoint"""
    
    def test_successful_registration(self, test_db, sample_user_data):
        """Test successful user registration"""
        response = client.post("/auth/register", json=sample_user_data)
        
        # Should return 201 Created
        assert response.status_code == 201
        
        # Check response data
        data = response.json()
        assert "id" in data
        assert data["username"] == sample_user_data["username"]
        assert data["email"] == sample_user_data["email"]
        assert "password" not in data  # Password should not be returned
        assert "created_at" in data
        assert "updated_at" in data
    
    def test_registration_with_existing_username(self, test_db, sample_user_data):
        """Test registration with existing username"""
        # Register first user
        client.post("/auth/register", json=sample_user_data)
        
        # Try to register with same username but different email
        duplicate_user = {
            "username": sample_user_data["username"],
            "email": "different@example.com",
            "password": "differentpassword"
        }
        
        response = client.post("/auth/register", json=duplicate_user)
        
        # Should return 400 Bad Request
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_registration_with_existing_email(self, test_db, sample_user_data):
        """Test registration with existing email"""
        # Register first user
        client.post("/auth/register", json=sample_user_data)
        
        # Try to register with same email but different username
        duplicate_user = {
            "username": "differentuser",
            "email": sample_user_data["email"],
            "password": "differentpassword"
        }
        
        response = client.post("/auth/register", json=duplicate_user)
        
        # Should return 400 Bad Request
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_registration_with_invalid_email(self, test_db):
        """Test registration with invalid email format"""
        invalid_user = {
            "username": "testuser",
            "email": "invalid-email-format",
            "password": "testpassword123"
        }
        
        response = client.post("/auth/register", json=invalid_user)
        
        # Should return 422 Validation Error
        assert response.status_code == 422
    
    def test_registration_with_short_password(self, test_db):
        """Test registration with too short password"""
        invalid_user = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "123"  # Too short
        }
        
        response = client.post("/auth/register", json=invalid_user)
        
        # Should return 422 Validation Error
        assert response.status_code == 422
    
    def test_registration_with_missing_fields(self, test_db):
        """Test registration with missing required fields"""
        incomplete_users = [
            {"email": "test@example.com", "password": "testpassword123"},  # Missing username
            {"username": "testuser", "password": "testpassword123"},  # Missing email
            {"username": "testuser", "email": "test@example.com"},  # Missing password
            {}  # Missing all fields
        ]
        
        for user_data in incomplete_users:
            response = client.post("/auth/register", json=user_data)
            assert response.status_code == 422


class TestUserLogin:
    """Test user login endpoint"""
    
    def test_successful_login(self, test_db, sample_user_data):
        """Test successful user login"""
        # Register user first
        client.post("/auth/register", json=sample_user_data)
        
        # Login with correct credentials
        login_data = {
            "username": sample_user_data["username"],
            "password": sample_user_data["password"]
        }
        
        response = client.post("/auth/login", json=login_data)
        
        # Should return 200 OK
        assert response.status_code == 200
        
        # Check response data
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
    
    def test_login_with_wrong_password(self, test_db, sample_user_data):
        """Test login with incorrect password"""
        # Register user first
        client.post("/auth/register", json=sample_user_data)
        
        # Login with wrong password
        login_data = {
            "username": sample_user_data["username"],
            "password": "wrongpassword"
        }
        
        response = client.post("/auth/login", json=login_data)
        
        # Should return 401 Unauthorized
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_with_nonexistent_user(self, test_db):
        """Test login with non-existent username"""
        login_data = {
            "username": "nonexistentuser",
            "password": "somepassword"
        }
        
        response = client.post("/auth/login", json=login_data)
        
        # Should return 401 Unauthorized
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_with_email_instead_of_username(self, test_db, sample_user_data):
        """Test login using email instead of username"""
        # Register user first
        client.post("/auth/register", json=sample_user_data)
        
        # Try to login with email
        login_data = {
            "username": sample_user_data["email"],  # Using email as username
            "password": sample_user_data["password"]
        }
        
        response = client.post("/auth/login", json=login_data)
        
        # Should return 401 Unauthorized (email is not username)
        assert response.status_code == 401
    
    def test_login_with_missing_fields(self, test_db):
        """Test login with missing fields"""
        incomplete_logins = [
            {"password": "testpassword123"},  # Missing username
            {"username": "testuser"},  # Missing password
            {}  # Missing both fields
        ]
        
        for login_data in incomplete_logins:
            response = client.post("/auth/login", json=login_data)
            assert response.status_code == 422


class TestProtectedRoutes:
    """Test protected routes and authentication middleware"""
    
    def test_access_protected_route_with_valid_token(self, test_db, sample_user_data):
        """Test accessing protected route with valid token"""
        # Register and login user
        client.post("/auth/register", json=sample_user_data)
        
        login_response = client.post("/auth/login", json={
            "username": sample_user_data["username"],
            "password": sample_user_data["password"]
        })
        token = login_response.json()["access_token"]
        
        # Access protected route with valid token
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/me", headers=headers)
        
        # Should return 200 OK
        assert response.status_code == 200
        
        # Check response data
        data = response.json()
        assert data["username"] == sample_user_data["username"]
        assert data["email"] == sample_user_data["email"]
        assert "password" not in data
        assert "id" in data
    
    def test_access_protected_route_without_token(self, test_db):
        """Test accessing protected route without token"""
        response = client.get("/auth/me")
        
        # Should return 401 Unauthorized
        assert response.status_code == 401
    
    def test_access_protected_route_with_invalid_token(self, test_db):
        """Test accessing protected route with invalid token"""
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = client.get("/auth/me", headers=headers)
        
        # Should return 401 Unauthorized
        assert response.status_code == 401
    
    def test_access_protected_route_with_malformed_header(self, test_db):
        """Test accessing protected route with malformed authorization header"""
        malformed_headers = [
            {"Authorization": "invalid_format_token"},  # Missing Bearer
            {"Authorization": "Bearer"},  # Missing token
            {"Authorization": "Token abc123"},  # Wrong scheme
            {"Authorization": ""},  # Empty header
        ]
        
        for headers in malformed_headers:
            response = client.get("/auth/me", headers=headers)
            assert response.status_code == 401
    
    def test_access_protected_route_with_expired_token(self, test_db, sample_user_data):
        """Test accessing protected route with expired token"""
        # This test would require mocking time or creating an expired token
        # For now, we'll test with an obviously invalid token structure
        headers = {"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.expired.token"}
        response = client.get("/auth/me", headers=headers)
        
        # Should return 401 Unauthorized
        assert response.status_code == 401


class TestUserLogout:
    """Test user logout endpoint"""
    
    def test_successful_logout(self, test_db, sample_user_data):
        """Test successful user logout"""
        # Register and login user
        client.post("/auth/register", json=sample_user_data)
        
        login_response = client.post("/auth/login", json={
            "username": sample_user_data["username"],
            "password": sample_user_data["password"]
        })
        token = login_response.json()["access_token"]
        
        # Logout with valid token
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/auth/logout", headers=headers)
        
        # Should return 200 OK
        assert response.status_code == 200
        assert "successfully" in response.json()["message"].lower()
    
    def test_logout_without_token(self, test_db):
        """Test logout without token"""
        response = client.post("/auth/logout")
        
        # Should return 401 Unauthorized
        assert response.status_code == 401
    
    def test_logout_with_invalid_token(self, test_db):
        """Test logout with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.post("/auth/logout", headers=headers)
        
        # Should return 401 Unauthorized
        assert response.status_code == 401


class TestAuthenticationFlow:
    """Test complete authentication flows"""
    
    def test_complete_registration_login_profile_flow(self, test_db, sample_user_data):
        """Test complete flow: register -> login -> access profile"""
        # Step 1: Register user
        register_response = client.post("/auth/register", json=sample_user_data)
        assert register_response.status_code == 201
        user_id = register_response.json()["id"]
        
        # Step 2: Login user
        login_response = client.post("/auth/login", json={
            "username": sample_user_data["username"],
            "password": sample_user_data["password"]
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Step 3: Access profile with token
        headers = {"Authorization": f"Bearer {token}"}
        profile_response = client.get("/auth/me", headers=headers)
        assert profile_response.status_code == 200
        
        profile_data = profile_response.json()
        assert profile_data["id"] == user_id
        assert profile_data["username"] == sample_user_data["username"]
        assert profile_data["email"] == sample_user_data["email"]
    
    def test_multiple_user_registration_and_login(self, test_db, sample_user_data, sample_user_data_2):
        """Test multiple users can register and login independently"""
        # Register first user
        response1 = client.post("/auth/register", json=sample_user_data)
        assert response1.status_code == 201
        
        # Register second user
        response2 = client.post("/auth/register", json=sample_user_data_2)
        assert response2.status_code == 201
        
        # Both users should be able to login
        login1 = client.post("/auth/login", json={
            "username": sample_user_data["username"],
            "password": sample_user_data["password"]
        })
        assert login1.status_code == 200
        
        login2 = client.post("/auth/login", json={
            "username": sample_user_data_2["username"],
            "password": sample_user_data_2["password"]
        })
        assert login2.status_code == 200
        
        # Tokens should be different
        token1 = login1.json()["access_token"]
        token2 = login2.json()["access_token"]
        assert token1 != token2
        
        # Each user should access their own profile
        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        profile1 = client.get("/auth/me", headers=headers1)
        profile2 = client.get("/auth/me", headers=headers2)
        
        assert profile1.status_code == 200
        assert profile2.status_code == 200
        
        assert profile1.json()["username"] == sample_user_data["username"]
        assert profile2.json()["username"] == sample_user_data_2["username"]
    
    def test_token_invalidation_after_logout(self, test_db, sample_user_data):
        """Test that token cannot be used after logout (if implemented)"""
        # Register and login user
        client.post("/auth/register", json=sample_user_data)
        
        login_response = client.post("/auth/login", json={
            "username": sample_user_data["username"],
            "password": sample_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Verify token works before logout
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 200
        
        # Logout
        logout_response = client.post("/auth/logout", headers=headers)
        assert logout_response.status_code == 200
        
        # Note: Token invalidation after logout requires additional implementation
        # For now, we just test that logout endpoint works
        # In a real implementation, you might maintain a blacklist of invalidated tokens


class TestEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_registration_with_unicode_characters(self, test_db):
        """Test registration with unicode characters in username"""
        unicode_user = {
            "username": "тестユーザー",
            "email": "unicode@example.com",
            "password": "пароль123"
        }
        
        response = client.post("/auth/register", json=unicode_user)
        
        # Should handle unicode characters
        assert response.status_code == 201
        assert response.json()["username"] == unicode_user["username"]
    
    def test_very_long_username_and_email(self, test_db):
        """Test registration with very long username and email"""
        long_user = {
            "username": "a" * 100,  # Very long username
            "email": f"{'very' * 20}@example.com",  # Long email
            "password": "testpassword123"
        }
        
        response = client.post("/auth/register", json=long_user)
        
        # Should handle long inputs (up to model limits)
        if response.status_code == 201:
            assert response.json()["username"] == long_user["username"]
        elif response.status_code == 422:
            # Validation error for too long fields is also acceptable
            assert "too long" in str(response.json()).lower() or "length" in str(response.json()).lower()
    
    def test_case_sensitivity_in_usernames(self, test_db):
        """Test case sensitivity in usernames"""
        user1 = {"username": "TestUser", "email": "test1@example.com", "password": "password123"}
        user2 = {"username": "testuser", "email": "test2@example.com", "password": "password123"}
        
        # Register both users
        response1 = client.post("/auth/register", json=user1)
        response2 = client.post("/auth/register", json=user2)
        
        # Both should succeed if usernames are case-sensitive
        # Or second should fail if usernames are case-insensitive
        assert response1.status_code == 201
        # Response2 result depends on implementation choice
    
    def test_whitespace_in_credentials(self, test_db):
        """Test handling of whitespace in usernames and passwords"""
        user_with_spaces = {
            "username": "  spaced_user  ",
            "email": "spaces@example.com",
            "password": "  password123  "
        }
        
        response = client.post("/auth/register", json=user_with_spaces)
        
        # Implementation should decide whether to trim or reject
        # Test assumes trimming is implemented
        if response.status_code == 201:
            # Login should work with original (spaced) or trimmed credentials
            login_attempts = [
                {"username": "  spaced_user  ", "password": "  password123  "},
                {"username": "spaced_user", "password": "password123"}
            ]
            
            success_found = False
            for login_data in login_attempts:
                login_response = client.post("/auth/login", json=login_data)
                if login_response.status_code == 200:
                    success_found = True
                    break
            
            assert success_found, "Login should work with either spaced or trimmed credentials"


class TestAPIDocumentation:
    """Test API endpoint documentation and responses"""
    
    def test_root_endpoint(self, test_db):
        """Test root endpoint returns proper information"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    def test_openapi_docs_accessible(self, test_db):
        """Test that OpenAPI documentation is accessible"""
        response = client.get("/openapi.json")
        
        assert response.status_code == 200
        openapi_spec = response.json()
        assert "openapi" in openapi_spec
        assert "paths" in openapi_spec
        
        # Check that auth endpoints are documented
        paths = openapi_spec["paths"]
        assert "/auth/register" in paths
        assert "/auth/login" in paths
        assert "/auth/logout" in paths
        assert "/auth/me" in paths
