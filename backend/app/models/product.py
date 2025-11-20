from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    seller_id = Column(String, ForeignKey("users.id"), nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    status = Column(String, default="available", nullable=False)  # "available", "sold", "pending"
    image_url = Column(String)  # URL for product image
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    seller = relationship("User", back_populates="products")
    category = relationship("Category", back_populates="products")

    def __repr__(self):
        return f"<Product {self.title}>"
