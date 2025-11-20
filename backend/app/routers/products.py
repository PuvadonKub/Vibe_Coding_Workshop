"""
Product management API routes with performance optimizations
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
import logging

from ..database import get_db
from ..models.user import User
from ..models.product import Product
from ..models.category import Category
from ..schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductWithDetails,
    ProductListResponse, ProductFilter
)
from ..dependencies import get_current_user
from ..utils.query_optimizer import OptimizedQueries, QueryOptimizer
from ..utils.cache import cache_products, cache_categories, invalidate_product_cache

router = APIRouter(prefix="/products", tags=["products"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=ProductListResponse)
@cache_products(ttl=300)  # Cache for 5 minutes
async def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    status: Optional[str] = Query("available", pattern="^(available|sold|pending|all)$", description="Filter by status"),
    search: Optional[str] = Query(None, max_length=100, description="Search in title and description"),
    seller_id: Optional[str] = Query(None, description="Filter by seller ID"),
    sort_by: str = Query("created_at", description="Sort by field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db)
) -> ProductListResponse:
    """
    Get paginated list of products with optional filtering using optimized queries
    """
    # Calculate offset
    skip = (page - 1) * per_page
    
    # Use optimized query method
    products, total_count = OptimizedQueries.get_products_with_pagination(
        db=db,
        skip=skip,
        limit=per_page,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        search=search,
        status=status if status != "all" else "available",
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Calculate pagination info
    total_pages = (total_count + per_page - 1) // per_page
    
    return ProductListResponse(
        products=[ProductResponse.model_validate(p) for p in products],
        total=total_count,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.get("/{product_id}", response_model=ProductWithDetails)
async def get_product(
    product_id: str,
    db: Session = Depends(get_db)
) -> ProductWithDetails:
    """
    Get detailed information about a specific product
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return ProductWithDetails.model_validate(product)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ProductResponse:
    """
    Create a new product (authenticated users only)
    """
    # Verify category exists
    category = db.query(Category).filter(Category.id == product_data.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Create product
    product = Product(
        **product_data.model_dump(),
        seller_id=current_user.id
    )
    
    try:
        db.add(product)
        db.commit()
        db.refresh(product)
        
        # Invalidate relevant caches
        invalidate_product_cache()
        
        return ProductResponse.model_validate(product)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create product"
        )


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ProductResponse:
    """
    Update a product (owner only)
    """
    # Get product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check ownership
    if product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own products"
        )
    
    # Verify category if being updated
    if product_update.category_id and product_update.category_id != product.category_id:
        category = db.query(Category).filter(Category.id == product_update.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    # Update product
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    try:
        db.commit()
        db.refresh(product)
        
        # Invalidate relevant caches
        invalidate_product_cache(product.id)
        
        return ProductResponse.model_validate(product)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update product"
        )


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a product (owner only)
    """
    # Get product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check ownership
    if product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own products"
        )
    
    try:
        db.delete(product)
        db.commit()
        return {"message": "Product deleted successfully", "product_id": product_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete product"
        )


@router.get("/seller/{seller_id}", response_model=ProductListResponse)
async def get_seller_products(
    seller_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query("available", pattern="^(available|sold|pending|all)$"),
    db: Session = Depends(get_db)
) -> ProductListResponse:
    """
    Get products by a specific seller
    """
    # Verify seller exists
    seller = db.query(User).filter(User.id == seller_id).first()
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )
    
    # Build query
    query = db.query(Product).filter(Product.seller_id == seller_id)
    
    if status and status != "all":
        query = query.filter(Product.status == status)
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    total_pages = (total + per_page - 1) // per_page
    offset = (page - 1) * per_page
    
    # Apply pagination
    products = query.order_by(Product.created_at.desc()).offset(offset).limit(per_page).all()
    
    return ProductListResponse(
        products=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )