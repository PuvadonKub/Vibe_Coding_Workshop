"""
Category management API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..database import get_db
from ..models.user import User
from ..models.category import Category
from ..models.product import Product
from ..schemas.category import (
    CategoryCreate, CategoryUpdate, CategoryResponse, 
    CategoryWithProductCount, CategoryListResponse
)
from ..schemas.product import ProductListResponse, ProductResponse
from ..dependencies import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=CategoryListResponse)
async def get_categories(
    include_count: bool = Query(False, description="Include product count for each category"),
    db: Session = Depends(get_db)
) -> CategoryListResponse:
    """
    Get list of all categories
    """
    if include_count:
        # Query categories with product count
        categories_with_count = (
            db.query(
                Category,
                func.count(Product.id).label("product_count")
            )
            .outerjoin(Product)
            .group_by(Category.id)
            .all()
        )
        
        categories = []
        for category, count in categories_with_count:
            category_dict = CategoryResponse.model_validate(category).model_dump()
            category_dict["product_count"] = count
            categories.append(CategoryWithProductCount(**category_dict))
        
        return CategoryListResponse(
            categories=categories,
            total=len(categories)
        )
    else:
        # Query categories without count
        categories = db.query(Category).order_by(Category.name).all()
        return CategoryListResponse(
            categories=[CategoryResponse.model_validate(c) for c in categories],
            total=len(categories)
        )


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db)
) -> CategoryResponse:
    """
    Get detailed information about a specific category
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return CategoryResponse.model_validate(category)


@router.get("/{category_id}/products", response_model=ProductListResponse)
async def get_products_by_category(
    category_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query("available", pattern="^(available|sold|pending|all)$", description="Filter by status"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    db: Session = Depends(get_db)
) -> ProductListResponse:
    """
    Get products in a specific category with pagination and filtering
    """
    # Verify category exists
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Build query
    query = db.query(Product).filter(Product.category_id == category_id)
    
    # Apply filters
    if status and status != "all":
        query = query.filter(Product.status == status)
    
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    total_pages = (total + per_page - 1) // per_page
    offset = (page - 1) * per_page
    
    # Apply pagination and ordering
    products = query.order_by(Product.created_at.desc()).offset(offset).limit(per_page).all()
    
    return ProductListResponse(
        products=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> CategoryResponse:
    """
    Create a new category (admin only - for now, any authenticated user can create)
    
    Note: In a production environment, you would want to restrict this to admin users only
    """
    # Check if category name already exists
    existing_category = db.query(Category).filter(Category.name == category_data.name).first()
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category with this name already exists"
        )
    
    # Create category
    category = Category(**category_data.model_dump())
    
    try:
        db.add(category)
        db.commit()
        db.refresh(category)
        return CategoryResponse.model_validate(category)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create category"
        )


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category_update: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> CategoryResponse:
    """
    Update a category (admin only - for now, any authenticated user can update)
    
    Note: In a production environment, you would want to restrict this to admin users only
    """
    # Get category
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if new name already exists (if name is being updated)
    if category_update.name and category_update.name != category.name:
        existing_category = db.query(Category).filter(
            Category.name == category_update.name,
            Category.id != category_id
        ).first()
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category with this name already exists"
            )
    
    # Update category
    update_data = category_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    try:
        db.commit()
        db.refresh(category)
        return CategoryResponse.model_validate(category)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update category"
        )


@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a category (admin only - for now, any authenticated user can delete)
    
    Note: This will also delete all products in this category due to cascade settings
    Warning: This action is irreversible!
    """
    # Get category
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Count products in category
    product_count = db.query(Product).filter(Product.category_id == category_id).count()
    
    try:
        db.delete(category)
        db.commit()
        return {
            "message": "Category deleted successfully",
            "category_id": category_id,
            "deleted_products_count": product_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete category"
        )


@router.get("/{category_id}/stats")
async def get_category_stats(
    category_id: str,
    db: Session = Depends(get_db)
):
    """
    Get statistics for a specific category
    """
    # Verify category exists
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Get product statistics
    total_products = db.query(Product).filter(Product.category_id == category_id).count()
    available_products = db.query(Product).filter(
        Product.category_id == category_id,
        Product.status == "available"
    ).count()
    sold_products = db.query(Product).filter(
        Product.category_id == category_id,
        Product.status == "sold"
    ).count()
    
    # Get price statistics (only for available products)
    price_stats = db.query(
        func.min(Product.price).label("min_price"),
        func.max(Product.price).label("max_price"),
        func.avg(Product.price).label("avg_price")
    ).filter(
        Product.category_id == category_id,
        Product.status == "available"
    ).first()
    
    return {
        "category_id": category_id,
        "category_name": category.name,
        "total_products": total_products,
        "available_products": available_products,
        "sold_products": sold_products,
        "price_stats": {
            "min_price": float(price_stats.min_price) if price_stats.min_price else 0,
            "max_price": float(price_stats.max_price) if price_stats.max_price else 0,
            "avg_price": float(price_stats.avg_price) if price_stats.avg_price else 0
        }
    }