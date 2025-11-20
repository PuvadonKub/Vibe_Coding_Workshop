#!/usr/bin/env python3
"""
Debug authentication imports
"""
import sys
import traceback

def test_imports():
    try:
        print("Testing imports step by step...")
        
        print("1. Testing database imports...")
        from app.database import get_db, engine, Base
        print("✅ Database imports successful")
        
        print("2. Testing model imports...")
        from app.models.user import User
        from app.models.product import Product
        from app.models.category import Category
        print("✅ Model imports successful")
        
        print("3. Testing schema imports...")
        from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
        print("✅ Schema imports successful")
        
        print("4. Testing utils imports...")
        from app.utils.auth import (
            verify_password,
            get_password_hash,
            create_access_token,
            get_user_id_from_token,
            ACCESS_TOKEN_EXPIRE_MINUTES
        )
        print("✅ Utils imports successful")
        
        print("5. Testing router imports...")
        from app.routers.auth import router
        print("✅ Router imports successful")
        
        print("6. Testing main app import...")
        from app.main import app
        print("✅ Main app imports successful")
        
        print("✅ All imports successful! The issue is elsewhere.")
        
    except Exception as e:
        print(f"❌ Import error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_imports()