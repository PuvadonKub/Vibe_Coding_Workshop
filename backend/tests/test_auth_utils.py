import pytest
from app.utils.auth import verify_password, get_password_hash, create_access_token, verify_token
from datetime import timedelta

def test_password_hashing():
    """Test password hashing and verification."""
    password = "testpassword123"
    hashed = get_password_hash(password)
    
    # Password should be hashed (not equal to original)
    assert hashed != password
    
    # Verification should work
    assert verify_password(password, hashed) == True
    
    # Wrong password should fail
    assert verify_password("wrongpassword", hashed) == False

def test_jwt_token_creation_and_verification():
    """Test JWT token creation and verification."""
    data = {"sub": "testuser"}
    token = create_access_token(data)
    
    # Token should be created
    assert token is not None
    assert isinstance(token, str)
    
    # Token should be verifiable
    username = verify_token(token)
    assert username == "testuser"

def test_jwt_token_with_expiration():
    """Test JWT token with custom expiration."""
    data = {"sub": "testuser"}
    expires_delta = timedelta(minutes=1)
    token = create_access_token(data, expires_delta=expires_delta)
    
    # Token should be verifiable
    username = verify_token(token)
    assert username == "testuser"

def test_invalid_token():
    """Test invalid token verification."""
    invalid_token = "invalid.token.here"
    username = verify_token(invalid_token)
    assert username is None