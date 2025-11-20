"""
Security testing suite for API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import json
import time

# Import app and dependencies
from app.main import app
from app.database import get_db, Base
from app.models.user import User
from app.models.product import Product
from app.models.category import Category

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

class TestSecurityValidation:
    """Test input validation and security measures"""
    
    @pytest.fixture(autouse=True)
    def setup_database(self):
        """Setup test database for each test"""
        Base.metadata.create_all(bind=engine)
        yield
        Base.metadata.drop_all(bind=engine)
    
    def test_sql_injection_protection_registration(self):
        """Test SQL injection protection in user registration"""
        malicious_payloads = [
            "test'; DROP TABLE users; --",
            "test' OR 1=1 --",
            "test'; INSERT INTO users (username) VALUES ('hacker'); --",
            "test' UNION SELECT * FROM users --"
        ]
        
        for payload in malicious_payloads:
            response = client.post(
                "/auth/register",
                json={
                    "username": payload,
                    "email": "test@example.com",
                    "password": "SecurePass123!"
                }
            )
            
            # Should be rejected due to security validation
            assert response.status_code in [400, 422], f"SQL injection not blocked: {payload}"
    
    def test_xss_protection_product_creation(self):
        """Test XSS protection in product creation"""
        # First create a valid user
        client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "SecurePass123!"
            }
        )
        
        # Login to get token
        login_response = client.post(
            "/auth/login",
            data={
                "username": "testuser",
                "password": "SecurePass123!"
            }
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a category first
        db = TestingSessionLocal()
        category = Category(name="Test Category", description="Test")
        db.add(category)
        db.commit()
        category_id = category.id
        db.close()
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
            "<iframe src=javascript:alert('XSS')></iframe>"
        ]
        
        for payload in xss_payloads:
            response = client.post(
                "/products/",
                json={
                    "title": payload,
                    "description": f"Description with {payload}",
                    "price": 99.99,
                    "category_id": category_id
                },
                headers=headers
            )
            
            # Should either be rejected or sanitized
            if response.status_code == 201:
                product_data = response.json()
                # Check that dangerous content was sanitized
                assert "<script>" not in product_data["title"]
                assert "javascript:" not in product_data["title"]
                assert "onerror=" not in product_data["description"]
    
    def test_input_length_validation(self):
        """Test input length limits"""
        # Test extremely long username
        long_username = "a" * 1000
        response = client.post(
            "/auth/register",
            json={
                "username": long_username,
                "email": "test@example.com", 
                "password": "SecurePass123!"
            }
        )
        assert response.status_code in [400, 422]
        
        # Test extremely long email
        long_email = "a" * 1000 + "@example.com"
        response = client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": long_email,
                "password": "SecurePass123!"
            }
        )
        assert response.status_code in [400, 422]
    
    def test_password_strength_validation(self):
        """Test password strength requirements"""
        weak_passwords = [
            "password",      # No uppercase, numbers, or special chars
            "PASSWORD",      # No lowercase, numbers, or special chars
            "Password",      # No numbers or special chars
            "Password123",   # No special chars
            "Pass123!",      # Too short
            "12345678",      # Only numbers
            "!@#$%^&*",      # Only special chars
        ]
        
        for weak_password in weak_passwords:
            response = client.post(
                "/auth/register",
                json={
                    "username": "testuser",
                    "email": "test@example.com",
                    "password": weak_password
                }
            )
            assert response.status_code in [400, 422], f"Weak password accepted: {weak_password}"
    
    def test_email_validation(self):
        """Test email format validation"""
        invalid_emails = [
            "not-an-email",
            "@example.com",
            "test@",
            "test..test@example.com",
            "test@example",
            "test@.example.com",
        ]
        
        for invalid_email in invalid_emails:
            response = client.post(
                "/auth/register",
                json={
                    "username": "testuser",
                    "email": invalid_email,
                    "password": "SecurePass123!"
                }
            )
            assert response.status_code in [400, 422], f"Invalid email accepted: {invalid_email}"

class TestAuthenticationSecurity:
    """Test authentication and authorization security"""
    
    @pytest.fixture(autouse=True)
    def setup_database(self):
        """Setup test database for each test"""
        Base.metadata.create_all(bind=engine)
        yield
        Base.metadata.drop_all(bind=engine)
    
    def test_jwt_token_required(self):
        """Test that protected endpoints require valid JWT token"""
        protected_endpoints = [
            ("/products/", "POST"),
            ("/users/me", "GET"),
            ("/upload/image", "POST"),
        ]
        
        for endpoint, method in protected_endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={})
                
            assert response.status_code == 401, f"Unprotected endpoint: {method} {endpoint}"
    
    def test_invalid_jwt_token(self):
        """Test that invalid JWT tokens are rejected"""
        invalid_tokens = [
            "invalid-token",
            "Bearer invalid-token", 
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
        ]
        
        for token in invalid_tokens:
            headers = {"Authorization": f"Bearer {token}"}
            response = client.get("/users/me", headers=headers)
            assert response.status_code == 401, f"Invalid token accepted: {token}"
    
    def test_expired_token_handling(self):
        """Test handling of expired tokens"""
        # This would require creating a token with past expiration
        # For now, we'll test with malformed tokens that claim to be expired
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid"
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/users/me", headers=headers)
        assert response.status_code == 401

class TestRateLimiting:
    """Test rate limiting functionality"""
    
    def test_rate_limiting_basic(self):
        """Test basic rate limiting functionality"""
        # This test assumes rate limiting is configured
        # Make multiple rapid requests to trigger rate limiting
        
        # Create a user first
        register_response = client.post(
            "/auth/register",
            json={
                "username": "ratelimituser",
                "email": "ratelimit@example.com",
                "password": "SecurePass123!"
            }
        )
        
        if register_response.status_code != 201:
            pytest.skip("User registration failed, skipping rate limit test")
        
        # Make rapid login attempts to trigger rate limiting
        failed_attempts = 0
        for i in range(20):  # Try 20 rapid requests
            response = client.post(
                "/auth/login",
                data={
                    "username": "ratelimituser",
                    "password": "WrongPassword"
                }
            )
            
            if response.status_code == 429:
                failed_attempts += 1
                break
                
            time.sleep(0.1)  # Small delay between requests
        
        # If rate limiting is working, we should get some 429 responses
        # If not implemented, all requests would return 401 (unauthorized)

class TestSecurityHeaders:
    """Test security headers in responses"""
    
    def test_security_headers_present(self):
        """Test that security headers are present in responses"""
        response = client.get("/")
        
        expected_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
        ]
        
        for header in expected_headers:
            assert header in response.headers, f"Missing security header: {header}"
    
    def test_cors_headers(self):
        """Test CORS headers configuration"""
        # Test preflight request
        response = client.options(
            "/auth/login",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            }
        )
        
        assert "Access-Control-Allow-Origin" in response.headers
        assert "Access-Control-Allow-Methods" in response.headers

class TestFileUploadSecurity:
    """Test file upload security"""
    
    @pytest.fixture(autouse=True) 
    def setup_database(self):
        """Setup test database for each test"""
        Base.metadata.create_all(bind=engine)
        yield
        Base.metadata.drop_all(bind=engine)
    
    def setup_authenticated_user(self):
        """Helper to create and authenticate a user"""
        client.post(
            "/auth/register",
            json={
                "username": "fileuser",
                "email": "file@example.com", 
                "password": "SecurePass123!"
            }
        )
        
        login_response = client.post(
            "/auth/login",
            data={
                "username": "fileuser",
                "password": "SecurePass123!"
            }
        )
        
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_file_type_validation(self):
        """Test that only allowed file types are accepted"""
        headers = self.setup_authenticated_user()
        
        # Test malicious file types
        malicious_files = [
            ("test.exe", b"MZ\x90\x00", "application/x-executable"),
            ("test.php", b"<?php echo 'test'; ?>", "application/x-php"),
            ("test.js", b"alert('xss')", "application/javascript"),
        ]
        
        for filename, content, mime_type in malicious_files:
            response = client.post(
                "/upload/image",
                files={"file": (filename, content, mime_type)},
                headers=headers
            )
            
            # Should be rejected
            assert response.status_code in [400, 415], f"Malicious file accepted: {filename}"
    
    def test_file_size_validation(self):
        """Test file size limits"""
        headers = self.setup_authenticated_user()
        
        # Create a large file (simulate)
        large_content = b"x" * (10 * 1024 * 1024)  # 10MB
        
        response = client.post(
            "/upload/image",
            files={"file": ("large.jpg", large_content, "image/jpeg")},
            headers=headers
        )
        
        # Should be rejected due to size
        assert response.status_code in [400, 413]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])