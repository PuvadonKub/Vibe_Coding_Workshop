"""
Unit tests for authentication utilities
"""
import pytest
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException

from app.utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_user_id_from_token,
    verify_token,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)


class TestPasswordHashing:
    """Test password hashing and verification"""
    
    def test_password_hashing(self):
        """Test that passwords are properly hashed"""
        password = "test_password_123"
        hashed = get_password_hash(password)
        
        # Hashed password should be different from original
        assert hashed != password
        # Hashed password should not be empty
        assert len(hashed) > 0
        # Should start with bcrypt identifier
        assert hashed.startswith("$2b$")
    
    def test_password_verification_success(self):
        """Test successful password verification"""
        password = "test_password_123"
        hashed = get_password_hash(password)
        
        # Verification should succeed with correct password
        assert verify_password(password, hashed) is True
    
    def test_password_verification_failure(self):
        """Test failed password verification with wrong password"""
        password = "test_password_123"
        wrong_password = "wrong_password_456"
        hashed = get_password_hash(password)
        
        # Verification should fail with wrong password
        assert verify_password(wrong_password, hashed) is False
    
    def test_different_passwords_different_hashes(self):
        """Test that different passwords produce different hashes"""
        password1 = "password_one"
        password2 = "password_two"
        
        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)
        
        # Different passwords should produce different hashes
        assert hash1 != hash2
    
    def test_same_password_different_hashes(self):
        """Test that same password produces different hashes (salt)"""
        password = "same_password"
        
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Same password should produce different hashes due to salt
        assert hash1 != hash2
        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestJWTTokens:
    """Test JWT token creation and validation"""
    
    def test_create_access_token_with_user_id(self):
        """Test JWT token creation with user ID"""
        user_id = "test_user_123"
        token_data = {"sub": user_id}
        token = create_access_token(token_data)
        
        # Token should not be empty
        assert token is not None
        assert len(token) > 0
        
        # Token should be decodable
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == user_id
        assert "exp" in payload
    
    def test_create_access_token_with_custom_expiry(self):
        """Test JWT token creation with custom expiry time"""
        user_id = "test_user_123"
        token_data = {"sub": user_id}
        expires_delta = timedelta(minutes=15)
        token = create_access_token(token_data, expires_delta)
        
        # Decode and check expiry
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp_timestamp = payload["exp"]
        
        # Should expire in approximately 15 minutes
        expected_exp = datetime.utcnow() + expires_delta
        actual_exp = datetime.utcfromtimestamp(exp_timestamp)
        
        # Allow 10 seconds tolerance for test execution time
        time_diff = abs((expected_exp - actual_exp).total_seconds())
        assert time_diff < 10
    
    def test_create_access_token_default_expiry(self):
        """Test JWT token creation with default expiry time"""
        user_id = "test_user_123"
        token_data = {"sub": user_id}
        token = create_access_token(token_data)
        
        # Decode and check expiry
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp_timestamp = payload["exp"]
        
        # Should expire in default time (30 minutes)
        expected_exp = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        actual_exp = datetime.utcfromtimestamp(exp_timestamp)
        
        # Allow 10 seconds tolerance for test execution time
        time_diff = abs((expected_exp - actual_exp).total_seconds())
        assert time_diff < 10
    
    def test_get_user_id_from_valid_token(self):
        """Test extracting user ID from valid token"""
        user_id = "test_user_456"
        token_data = {"sub": user_id}
        token = create_access_token(token_data)
        
        # Should successfully extract user ID
        extracted_user_id = get_user_id_from_token(token)
        assert extracted_user_id == user_id
    
    def test_get_user_id_from_invalid_token(self):
        """Test handling of invalid token"""
        invalid_token = "invalid.jwt.token"
        
        # Should raise HTTPException for invalid token
        with pytest.raises(HTTPException) as exc_info:
            get_user_id_from_token(invalid_token)
        assert exc_info.value.status_code == 401
    
    def test_get_user_id_from_expired_token(self):
        """Test handling of expired token"""
        user_id = "test_user_789"
        token_data = {"sub": user_id}
        # Create token that expires immediately
        expires_delta = timedelta(seconds=-1)  # Already expired
        token = create_access_token(token_data, expires_delta)
        
        # Should raise HTTPException for expired token
        with pytest.raises(HTTPException) as exc_info:
            get_user_id_from_token(token)
        assert exc_info.value.status_code == 401
    
    def test_get_user_id_from_malformed_token(self):
        """Test handling of malformed token"""
        malformed_tokens = [
            "",  # Empty string
            "not.a.jwt",  # Not enough parts
            "header.payload",  # Missing signature
            "a.b.c.d",  # Too many parts
        ]
        
        for token in malformed_tokens:
            with pytest.raises(HTTPException) as exc_info:
                get_user_id_from_token(token)
            assert exc_info.value.status_code == 401
    
    def test_token_with_wrong_secret(self):
        """Test token validation with wrong secret key"""
        user_id = "test_user_secret"
        
        # Create token with wrong secret
        wrong_secret = "wrong_secret_key"
        token = jwt.encode(
            {"sub": user_id, "exp": datetime.utcnow() + timedelta(minutes=30)},
            wrong_secret,
            algorithm=ALGORITHM
        )
        
        # Should raise HTTPException when validating with correct secret
        with pytest.raises(HTTPException) as exc_info:
            get_user_id_from_token(token)
        assert exc_info.value.status_code == 401


class TestTokenSecurity:
    """Test token security features"""
    
    def test_token_contains_required_claims(self):
        """Test that tokens contain required claims"""
        user_id = "security_test_user"
        token_data = {"sub": user_id}
        token = create_access_token(token_data)
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Required claims should be present
        assert "sub" in payload  # Subject (user ID)
        assert "exp" in payload  # Expiration time
        
        # Claims should have correct values
        assert payload["sub"] == user_id
        assert isinstance(payload["exp"], int)
    
    def test_token_expiration_logic(self):
        """Test token expiration validation"""
        user_id = "expiration_test_user"
        token_data = {"sub": user_id}
        
        # Create token that expires in 1 second
        short_expiry = timedelta(seconds=1)
        token = create_access_token(token_data, short_expiry)
        
        # Should be valid immediately
        extracted_user_id = get_user_id_from_token(token)
        assert extracted_user_id == user_id
        
        # Wait for expiration (in real test, we'd mock time)
        import time
        time.sleep(2)
        
        # Should raise HTTPException after expiration
        with pytest.raises(HTTPException) as exc_info:
            get_user_id_from_token(token)
        assert exc_info.value.status_code == 401
    
    def test_algorithm_validation(self):
        """Test that only expected algorithm is accepted"""
        user_id = "algorithm_test_user"
        
        # Create token with different algorithm
        payload = {
            "sub": user_id,
            "exp": datetime.utcnow() + timedelta(minutes=30)
        }
        
        # Token with HS512 instead of HS256
        wrong_alg_token = jwt.encode(payload, SECRET_KEY, algorithm="HS512")
        
        # Should raise HTTPException due to algorithm mismatch
        with pytest.raises(HTTPException) as exc_info:
            get_user_id_from_token(wrong_alg_token)
        assert exc_info.value.status_code == 401


# Test data and fixtures
@pytest.fixture
def sample_passwords():
    """Sample passwords for testing"""
    return [
        "simple123",
        "ComplexP@ssw0rd!",
        "very_long_password_with_special_characters_12345",
        "短密码",  # Unicode characters
        "password with spaces",
        "123456789"
    ]

@pytest.fixture
def sample_user_ids():
    """Sample user IDs for testing"""
    return [
        "user_123",
        "test-user-456",
        "user@example.com",
        "very_long_user_identifier_with_underscores_and_numbers_12345",
        "1",  # Numeric string
    ]


class TestEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_simple_password_hashing(self):
        """Test hashing simple password"""
        password = "simple123"
        hashed = get_password_hash(password)
        
        # Should create a hash
        assert hashed is not None
        assert len(hashed) > 0
        
        # Should verify correctly
        assert verify_password(password, hashed) is True
    
    def test_token_with_empty_user_id(self):
        """Test creating token with empty user ID"""
        empty_user_id = ""
        token_data = {"sub": empty_user_id}
        token = create_access_token(token_data)
        
        # Should create token even with empty user ID
        assert token is not None
        
        # Should extract empty user ID correctly
        extracted_user_id = get_user_id_from_token(token)
        assert extracted_user_id == empty_user_id
    
    def test_none_inputs(self):
        """Test handling None inputs"""
        # Password hashing with None should raise exception
        with pytest.raises(TypeError):
            get_password_hash(None)
        
        # Password verification with None should return False
        valid_hash = get_password_hash("test")
        assert verify_password(None, valid_hash) is False
        assert verify_password("test", None) is False
        
        # Token creation with None should raise exception
        with pytest.raises(AttributeError):
            create_access_token(None)
        
        # Token validation with None should raise HTTPException
        with pytest.raises(HTTPException):
            get_user_id_from_token(None)
