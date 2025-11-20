from sqlalchemy import Column, String, DateTime, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    products = relationship("Product", back_populates="seller", cascade="all, delete-orphan")
    
    # Composite indexes for better query performance
    __table_args__ = (
        Index('idx_user_email_created', 'email', 'created_at'),
        Index('idx_user_username_created', 'username', 'created_at'),
    )

    def __repr__(self):
        return f"<User {self.username}>"
