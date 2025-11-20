"""
Pydantic schemas for product management
"""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from .user import UserResponse
    from .category import CategoryResponse


class ProductBase(BaseModel):
    """Base product schema with common fields"""
    title: str = Field(..., min_length=1, max_length=200, description="Product title")
    description: Optional[str] = Field(None, max_length=2000, description="Product description")
    price: float = Field(..., gt=0, description="Product price must be greater than 0")
    image_url: Optional[str] = Field(None, description="URL for product image")
    status: str = Field(default="available", pattern="^(available|sold|pending)$", description="Product status")


class ProductCreate(ProductBase):
    """Schema for creating a new product"""
    category_id: str = Field(..., description="Category ID for the product")


class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    price: Optional[float] = Field(None, gt=0)
    image_url: Optional[str] = Field(None)
    status: Optional[str] = Field(None, pattern="^(available|sold|pending)$")
    category_id: Optional[str] = Field(None)


class ProductResponse(ProductBase):
    """Schema for product response with all details"""
    id: str
    seller_id: str
    category_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProductWithDetails(ProductResponse):
    """Schema for product response with seller and category details"""
    seller: "UserResponse"
    category: "CategoryResponse"
    
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Schema for paginated product list response"""
    products: List[ProductResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class ProductFilter(BaseModel):
    """Schema for product filtering parameters"""
    category_id: Optional[str] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern="^(available|sold|pending)$")
    search: Optional[str] = Field(None, max_length=100, description="Search in title and description")
    seller_id: Optional[str] = None
