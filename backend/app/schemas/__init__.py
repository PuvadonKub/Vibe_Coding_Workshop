"""
Pydantic schemas package for the Student Marketplace API
"""

# Import all schemas for easy access
from .user import UserBase, UserCreate, UserLogin, UserResponse, UserUpdate, Token, TokenData
from .product import (
    ProductBase, ProductCreate, ProductUpdate, ProductResponse, 
    ProductWithDetails, ProductListResponse, ProductFilter
)
from .category import (
    CategoryBase, CategoryCreate, CategoryUpdate, CategoryResponse,
    CategoryWithProductCount, CategoryListResponse
)

__all__ = [
    # User schemas
    "UserBase", "UserCreate", "UserLogin", "UserResponse", "UserUpdate", 
    "Token", "TokenData",
    
    # Product schemas
    "ProductBase", "ProductCreate", "ProductUpdate", "ProductResponse",
    "ProductWithDetails", "ProductListResponse", "ProductFilter",
    
    # Category schemas
    "CategoryBase", "CategoryCreate", "CategoryUpdate", "CategoryResponse",
    "CategoryWithProductCount", "CategoryListResponse"
]