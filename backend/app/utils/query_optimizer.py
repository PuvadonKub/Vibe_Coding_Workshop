"""
Query optimization utilities for improved database performance
"""
from typing import Optional, List, Dict, Any, Type, Union
from sqlalchemy import text, desc, asc, and_, or_
from sqlalchemy.orm import Session, Query, joinedload, selectinload
from sqlalchemy.sql import func
from functools import wraps
import time
import logging
from contextlib import contextmanager

from .models.product import Product
from .models.user import User  
from .models.category import Category

logger = logging.getLogger(__name__)

class QueryOptimizer:
    """Utility class for optimizing database queries"""
    
    @staticmethod
    def log_query_performance(func):
        """Decorator to log query execution time"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            if execution_time > 0.1:  # Log slow queries (>100ms)
                logger.warning(f"Slow query detected: {func.__name__} took {execution_time:.3f}s")
            else:
                logger.info(f"Query {func.__name__} executed in {execution_time:.3f}s")
                
            return result
        return wrapper
    
    @staticmethod
    @contextmanager
    def query_timer(operation_name: str):
        """Context manager for timing database operations"""
        start_time = time.time()
        try:
            yield
        finally:
            execution_time = time.time() - start_time
            logger.info(f"{operation_name} completed in {execution_time:.3f}s")

class OptimizedQueries:
    """Pre-optimized query methods for common operations"""
    
    @staticmethod
    @QueryOptimizer.log_query_performance
    def get_products_with_pagination(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        category_id: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        search: Optional[str] = None,
        status: str = "available",
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[Product], int]:
        """
        Optimized product search with filtering, sorting, and pagination
        Returns (products, total_count)
        """
        # Build base query with optimized joins
        query = db.query(Product).options(
            joinedload(Product.category),
            joinedload(Product.seller)
        )
        
        # Apply filters using indexed columns
        filters = [Product.status == status]
        
        if category_id:
            filters.append(Product.category_id == category_id)
        
        if min_price is not None:
            filters.append(Product.price >= min_price)
            
        if max_price is not None:
            filters.append(Product.price <= max_price)
            
        if search:
            # Use indexed title search
            filters.append(Product.title.ilike(f"%{search}%"))
        
        # Apply all filters at once for better query planning
        query = query.filter(and_(*filters))
        
        # Get total count before applying pagination
        total_count = query.count()
        
        # Apply sorting using indexed columns
        sort_column = getattr(Product, sort_by, Product.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Apply pagination
        products = query.offset(skip).limit(limit).all()
        
        return products, total_count
    
    @staticmethod
    @QueryOptimizer.log_query_performance
    def get_user_products_optimized(
        db: Session, 
        user_id: str, 
        status: Optional[str] = None
    ) -> List[Product]:
        """Optimized query for user's products"""
        query = db.query(Product).options(
            joinedload(Product.category)
        ).filter(Product.seller_id == user_id)
        
        if status:
            query = query.filter(Product.status == status)
            
        return query.order_by(desc(Product.created_at)).all()
    
    @staticmethod
    @QueryOptimizer.log_query_performance
    def get_categories_with_product_counts(db: Session) -> List[Dict[str, Any]]:
        """Get categories with product counts using optimized query"""
        result = db.query(
            Category.id,
            Category.name,
            Category.description,
            func.count(Product.id).label('product_count')
        ).outerjoin(
            Product, and_(
                Category.id == Product.category_id,
                Product.status == 'available'
            )
        ).group_by(
            Category.id, Category.name, Category.description
        ).order_by(Category.name).all()
        
        return [
            {
                'id': row.id,
                'name': row.name,
                'description': row.description,
                'product_count': row.product_count
            }
            for row in result
        ]
    
    @staticmethod
    @QueryOptimizer.log_query_performance
    def get_recent_products(
        db: Session, 
        limit: int = 10,
        category_id: Optional[str] = None
    ) -> List[Product]:
        """Get recent products efficiently using indexed columns"""
        query = db.query(Product).options(
            joinedload(Product.category),
            joinedload(Product.seller)
        ).filter(Product.status == "available")
        
        if category_id:
            query = query.filter(Product.category_id == category_id)
            
        return query.order_by(desc(Product.created_at)).limit(limit).all()
    
    @staticmethod
    @QueryOptimizer.log_query_performance
    def search_products_full_text(
        db: Session,
        search_term: str,
        limit: int = 50
    ) -> List[Product]:
        """
        Full-text search across product title and description
        Uses database-specific optimizations where available
        """
        # For SQLite, use simple LIKE queries on indexed columns
        # In production with PostgreSQL, this could use full-text search
        search_pattern = f"%{search_term}%"
        
        query = db.query(Product).options(
            joinedload(Product.category),
            joinedload(Product.seller)
        ).filter(
            and_(
                Product.status == "available",
                or_(
                    Product.title.ilike(search_pattern),
                    Product.description.ilike(search_pattern)
                )
            )
        )
        
        return query.order_by(desc(Product.created_at)).limit(limit).all()

class DatabaseHealthMonitor:
    """Monitor database performance and health"""
    
    @staticmethod
    def check_slow_queries(db: Session, threshold_ms: float = 100.0) -> List[Dict[str, Any]]:
        """Check for slow queries (implementation depends on database type)"""
        # This is a placeholder - actual implementation would depend on database type
        # For PostgreSQL: pg_stat_statements
        # For MySQL: slow query log
        # For SQLite: manual logging
        return []
    
    @staticmethod
    def get_table_sizes(db: Session) -> Dict[str, int]:
        """Get approximate table sizes"""
        tables = ['users', 'products', 'categories']
        sizes = {}
        
        for table in tables:
            count = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            sizes[table] = count
            
        return sizes
    
    @staticmethod
    def analyze_query_performance(db: Session) -> Dict[str, Any]:
        """Analyze overall query performance"""
        with QueryOptimizer.query_timer("Database analysis"):
            table_sizes = DatabaseHealthMonitor.get_table_sizes(db)
            
            # Check for missing indexes (simplified check)
            analysis = {
                'table_sizes': table_sizes,
                'total_records': sum(table_sizes.values()),
                'recommendations': []
            }
            
            # Add recommendations based on table sizes
            if table_sizes.get('products', 0) > 1000:
                analysis['recommendations'].append(
                    "Consider partitioning products table by date or category"
                )
            
            if table_sizes.get('users', 0) > 10000:
                analysis['recommendations'].append(
                    "Consider adding user activity tracking indexes"
                )
                
            return analysis