from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False, index=True)
    seller_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False, index=True)
    status = Column(String, default="available", nullable=False, index=True)  # "available", "sold", "pending"
    image_url = Column(String)  # URL for product image (legacy)
    images = Column(JSON)  # Array of image filenames
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    seller = relationship("User", back_populates="products")
    category = relationship("Category", back_populates="products")
    
    # Composite indexes for complex queries
    __table_args__ = (
        # Search and filtering indexes
        Index('idx_product_status_created', 'status', 'created_at'),
        Index('idx_product_category_status', 'category_id', 'status'),
        Index('idx_product_seller_status', 'seller_id', 'status'),
        Index('idx_product_price_status', 'price', 'status'),
        Index('idx_product_category_price', 'category_id', 'price'),
        # Full-text search optimization (title + status)
        Index('idx_product_title_status', 'title', 'status'),
        # Recent products query optimization
        Index('idx_product_status_created_desc', 'status', 'created_at'),
    )

    def __repr__(self):
        return f"<Product {self.title}>"
