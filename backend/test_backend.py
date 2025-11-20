#!/usr/bin/env python3
"""
Test script to verify the backend setup and database connection
"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_database_connection():
    """Test database connection and models"""
    try:
        from app.database import engine, get_db, Base
        from app.models.user import User
        from app.models.product import Product
        from app.models.category import Category
        
        print("✅ All imports successful")
        
        # Test database connection
        with engine.connect() as connection:
            print("✅ Database connection successful")
        
        # Test session creation
        db = next(get_db())
        print("✅ Database session creation successful")
        db.close()
        
        print("✅ All backend components are working!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_fastapi_app():
    """Test FastAPI app creation"""
    try:
        from app.main import app
        print("✅ FastAPI app import successful")
        print(f"✅ App title: {app.title}")
        return True
    except Exception as e:
        print(f"❌ FastAPI app error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Testing backend setup...")
    print("="*50)
    
    db_success = test_database_connection()
    print()
    app_success = test_fastapi_app()
    
    print()
    print("="*50)
    if db_success and app_success:
        print("✅ All tests passed! Backend is ready.")
    else:
        print("❌ Some tests failed. Check the errors above.")