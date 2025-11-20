"""
User management API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..database import get_db
from ..models.user import User
from ..schemas.user import UserResponse, UserUpdate
from ..dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Get current user's profile information
    """
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Update current user's profile information
    """
    # Check if username is being updated and if it's already taken
    if user_update.username and user_update.username != current_user.username:
        existing_user = db.query(User).filter(
            User.username == user_update.username,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken"
            )
    
    # Check if email is being updated and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        existing_user = db.query(User).filter(
            User.email == user_update.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already taken"
            )
    
    # Update user fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    try:
        db.commit()
        db.refresh(current_user)
        return UserResponse.model_validate(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )


@router.delete("/profile")
async def delete_user_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete current user's account and all associated data
    
    WARNING: This action is irreversible and will delete:
    - User account
    - All products created by the user
    - All associated data
    """
    try:
        # The cascade="all, delete-orphan" in the User model will automatically
        # delete all associated products when the user is deleted
        db.delete(current_user)
        db.commit()
        
        return {
            "message": "User account successfully deleted",
            "deleted_user_id": current_user.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user account"
        )


@router.get("/profile/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get current user's statistics (product counts, etc.)
    """
    from ..models.product import Product
    
    # Count products by status
    total_products = db.query(Product).filter(Product.seller_id == current_user.id).count()
    available_products = db.query(Product).filter(
        Product.seller_id == current_user.id,
        Product.status == "available"
    ).count()
    sold_products = db.query(Product).filter(
        Product.seller_id == current_user.id,
        Product.status == "sold"
    ).count()
    pending_products = db.query(Product).filter(
        Product.seller_id == current_user.id,
        Product.status == "pending"
    ).count()
    
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "member_since": current_user.created_at,
        "total_products": total_products,
        "available_products": available_products,
        "sold_products": sold_products,
        "pending_products": pending_products,
        "profile_completion": 100 if current_user.email and current_user.username else 75
    }