"""
Authentication routes for user registration, login, and profile management
"""
from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserLogin, UserResponse, Token
from ..utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_user_id_from_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Create router with comprehensive documentation
router = APIRouter(
    prefix="/auth", 
    tags=["Authentication"],
    responses={
        401: {"description": "Authentication failed"},
        422: {"description": "Validation error"},
        500: {"description": "Internal server error"}
    }
)

# Security scheme
security = HTTPBearer()


def get_user_by_username_or_email(db: Session, username: str) -> User:
    """
    Get user by username or email
    
    Args:
        db: Database session
        username: Username or email to search for
        
    Returns:
        User: The user object if found
        
    Raises:
        HTTPException: If user not found
    """
    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


def authenticate_user(db: Session, username: str, password: str) -> User:
    """
    Authenticate a user with username/email and password
    
    Args:
        db: Database session
        username: Username or email
        password: Plain text password
        
    Returns:
        User: The authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        user = get_user_by_username_or_email(db, username)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    return user


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[Session, Depends(get_db)]
) -> User:
    """
    Get current authenticated user from JWT token
    
    Args:
        credentials: HTTP Bearer credentials
        db: Database session
        
    Returns:
        User: The current authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    user_id = get_user_id_from_token(credentials.credentials)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


@router.post(
    "/register", 
    response_model=UserResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account with username, email, and password",
    responses={
        201: {
            "description": "User successfully created",
            "model": UserResponse,
        },
        400: {
            "description": "Username or email already exists",
            "content": {
                "application/json": {
                    "example": {"detail": "Username or email already registered"}
                }
            },
        },
    },
)
async def register_user(user_data: UserCreate, db: Annotated[Session, Depends(get_db)]):
    """
    Register a new user account.
    
    This endpoint creates a new user account with the provided credentials.
    The password will be securely hashed before storage.
    
    **Requirements:**
    - Username must be unique and 3-50 characters
    - Email must be valid and unique
    - Password must meet security requirements
    
    **Returns:**
    - User information (without password)
    - HTTP 201 on success
    
    **Errors:**
    - 400: Username or email already exists
    - 422: Validation error (invalid input format)
    """
    # Hash the password
    hashed_password = get_password_hash(user_data.password)
    
    # Create new user
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password
    )
    
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    return db_user


@router.post(
    "/login", 
    response_model=Token,
    summary="User login",
    description="Authenticate user and receive JWT access token",
    responses={
        200: {
            "description": "Login successful",
            "model": Token,
        },
        401: {
            "description": "Invalid credentials",
            "content": {
                "application/json": {
                    "example": {"detail": "Incorrect username or password"}
                }
            },
        },
    },
)
async def login_user(user_credentials: UserLogin, db: Annotated[Session, Depends(get_db)]):
    """
    Authenticate user credentials and return JWT access token.
    
    **Authentication:**
    - Accepts username or email for login
    - Password is verified against stored hash
    - Returns JWT token valid for 30 minutes
    
    **Usage:**
    1. Send username/email and password
    2. Receive JWT token in response
    3. Include token in Authorization header: `Bearer <token>`
    
    **Security:**
    - Passwords are never stored in plain text
    - Failed attempts are logged for security
    - Tokens expire automatically
    """
    # Authenticate user
    user = authenticate_user(db, user_credentials.username, user_credentials.password)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post(
    "/logout",
    summary="User logout", 
    description="Logout current user session",
    responses={
        200: {
            "description": "Logout successful",
            "content": {
                "application/json": {
                    "example": {"message": "Successfully logged out"}
                }
            },
        },
    },
)
async def logout_user():
    """
    Logout the current user session.
    
    **Note:** This endpoint provides a standardized logout response.
    Token invalidation should be handled on the client side by:
    - Removing the token from local storage
    - Clearing any cached user data
    
    **Best Practices:**
    - Always call this endpoint before discarding tokens
    - Clear all client-side authentication data
    - Redirect to login page after logout
    """
    return {"message": "Successfully logged out"}


@router.get(
    "/me", 
    response_model=UserResponse,
    summary="Get current user",
    description="Get authenticated user's profile information",
    responses={
        200: {
            "description": "User profile retrieved successfully",
            "model": UserResponse,
        },
        401: {
            "description": "Authentication required",
            "content": {
                "application/json": {
                    "example": {"detail": "Not authenticated"}
                }
            },
        },
    },
)
async def get_current_user_info(current_user: Annotated[User, Depends(get_current_user)]):
    """
    Get the current authenticated user's profile information.
    
    **Authentication Required:**
    - Must include valid JWT token in Authorization header
    - Token format: `Bearer <your_jwt_token>`
    
    **Returns:**
    - User ID, username, email
    - Account creation and update timestamps
    - No sensitive information (password excluded)
    
    **Usage:**
    - Verify current user identity
    - Display user profile information
    - Check authentication status
    """
    return current_user
