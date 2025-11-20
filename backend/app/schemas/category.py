"""
Pydantic schemas for category management
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    """Base category schema with common fields"""
    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    description: Optional[str] = Field(None, max_length=500, description="Category description")


class CategoryCreate(CategoryBase):
    """Schema for creating a new category"""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class CategoryResponse(CategoryBase):
    """Schema for category response"""
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CategoryWithProductCount(CategoryResponse):
    """Schema for category response with product count"""
    product_count: int = Field(..., description="Number of products in this category")


class CategoryListResponse(BaseModel):
    """Schema for category list response"""
    categories: List[CategoryResponse]
    total: int