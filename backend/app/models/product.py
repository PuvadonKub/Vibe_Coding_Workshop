from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    status = Column(String)  # e.g., "available", "sold", "pending"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    seller = relationship("User", back_populates="products")
    category = relationship("Category", back_populates="products")

    def __repr__(self):
        return f"<Product {self.title}>"
