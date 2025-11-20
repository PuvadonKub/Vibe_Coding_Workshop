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

# Create router
router = APIRouter(prefix="/auth", tags=["authentication"])

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


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Annotated[Session, Depends(get_db)]):
    """
    Register a new user
    
    Args:
        user_data: User registration data
        db: Database session
        
    Returns:
        UserResponse: The created user information
        
    Raises:
        HTTPException: If username or email already exists
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


@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin, db: Annotated[Session, Depends(get_db)]):
    """
    Authenticate user and return access token
    
    Args:
        user_credentials: User login credentials
        db: Database session
        
    Returns:
        Token: JWT access token
        
    Raises:
        HTTPException: If authentication fails
    """
    # Authenticate user
    user = authenticate_user(db, user_credentials.username, user_credentials.password)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout_user():
    """
    Logout user (token invalidation should be handled client-side)
    
    Returns:
        dict: Success message
    """
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: Annotated[User, Depends(get_current_user)]):
    """
    Get current authenticated user information
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        UserResponse: Current user information
    """
    return current_user
