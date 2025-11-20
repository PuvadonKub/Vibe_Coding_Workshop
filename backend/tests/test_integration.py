"""
Integration Tests for Student Marketplace API

These tests cover complete API workflows and database transactions,
testing the interaction between different components of the system.
"""

import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import tempfile
import os
from pathlib import Path
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
import io
import json

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.utils.auth import get_password_hash, create_access_token


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_integration.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

class TestIntegrationWorkflows:
    """Integration tests for complete user workflows"""
    
    @pytest.fixture(scope="function")
    def client(self):
        """Create test client with fresh database"""
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as c:
            yield c
        Base.metadata.drop_all(bind=engine)
    
    @pytest.fixture
    def db_session(self):
        """Create database session for direct DB operations"""
        Base.metadata.create_all(bind=engine)
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
            Base.metadata.drop_all(bind=engine)
    
    @pytest.fixture
    def test_user_data(self):
        """Test user registration data"""
        return {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123"
        }
    
    @pytest.fixture
    def test_category_data(self):
        """Test category data"""
        return {
            "name": "Electronics",
            "description": "Electronic devices and gadgets"
        }
    
    @pytest.fixture
    def test_product_data(self):
        """Test product data"""
        return {
            "title": "Test Laptop",
            "description": "A great laptop for testing",
            "price": 999.99,
            "category_id": "",  # Will be set in tests
            "status": "available"
        }

    def test_complete_user_registration_and_authentication_flow(self, client, test_user_data):
        """Test complete user registration → login → access protected resource flow"""
        
        # 1. Register new user
        response = client.post("/auth/register", json=test_user_data)
        assert response.status_code == 201
        user_data = response.json()
        assert user_data["username"] == test_user_data["username"]
        assert user_data["email"] == test_user_data["email"]
        assert "id" in user_data
        user_id = user_data["id"]
        
        # 2. Login with registered user
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        auth_data = response.json()
        assert "access_token" in auth_data
        assert "user" in auth_data
        token = auth_data["access_token"]
        
        # 3. Access protected route with token
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 200
        me_data = response.json()
        assert me_data["id"] == user_id
        assert me_data["username"] == test_user_data["username"]
        
        # 4. Try to access protected route without token (should fail)
        response = client.get("/auth/me")
        assert response.status_code == 401
        
        # 5. Try to access with invalid token (should fail)
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/auth/me", headers=invalid_headers)
        assert response.status_code == 401

    def test_complete_product_management_workflow(self, client, test_user_data, test_category_data, test_product_data):
        """Test complete product CRUD workflow with authentication"""
        
        # Setup: Register user and get token
        client.post("/auth/register", json=test_user_data)
        login_response = client.post("/auth/login", json={
            "username": test_user_data["username"], 
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Setup: Create category
        category_response = client.post("/categories/", json=test_category_data, headers=headers)
        category_id = category_response.json()["id"]
        test_product_data["category_id"] = category_id
        
        # 1. Create product
        response = client.post("/products/", json=test_product_data, headers=headers)
        assert response.status_code == 201
        product_data = response.json()
        assert product_data["title"] == test_product_data["title"]
        assert product_data["price"] == test_product_data["price"]
        product_id = product_data["id"]
        
        # 2. Read product
        response = client.get(f"/products/{product_id}")
        assert response.status_code == 200
        retrieved_product = response.json()
        assert retrieved_product["id"] == product_id
        assert retrieved_product["title"] == test_product_data["title"]
        
        # 3. Update product
        update_data = {"title": "Updated Laptop", "price": 1199.99}
        response = client.put(f"/products/{product_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        updated_product = response.json()
        assert updated_product["title"] == "Updated Laptop"
        assert updated_product["price"] == 1199.99
        
        # 4. List products (should include our product)
        response = client.get("/products/")
        assert response.status_code == 200
        products_data = response.json()
        assert products_data["total"] >= 1
        assert any(p["id"] == product_id for p in products_data["products"])
        
        # 5. Delete product
        response = client.delete(f"/products/{product_id}", headers=headers)
        assert response.status_code == 200
        
        # 6. Verify product is deleted
        response = client.get(f"/products/{product_id}")
        assert response.status_code == 404

    def test_product_search_and_filtering_workflow(self, client, test_user_data, test_category_data, db_session):
        """Test complete search and filtering functionality"""
        
        # Setup: Create user and categories
        client.post("/auth/register", json=test_user_data)
        login_response = client.post("/auth/login", json={
            "username": test_user_data["username"], 
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create multiple categories
        electronics_response = client.post("/categories/", json={
            "name": "Electronics", "description": "Electronic devices"
        }, headers=headers)
        books_response = client.post("/categories/", json={
            "name": "Books", "description": "Textbooks and novels"
        }, headers=headers)
        
        electronics_id = electronics_response.json()["id"]
        books_id = books_response.json()["id"]
        
        # Create test products
        products = [
            {"title": "MacBook Pro", "description": "Apple laptop", "price": 1999.99, "category_id": electronics_id},
            {"title": "Dell Laptop", "description": "Windows laptop", "price": 899.99, "category_id": electronics_id},
            {"title": "Python Programming Book", "description": "Learn Python", "price": 49.99, "category_id": books_id},
            {"title": "Math Textbook", "description": "Calculus textbook", "price": 129.99, "category_id": books_id},
        ]
        
        created_products = []
        for product_data in products:
            response = client.post("/products/", json=product_data, headers=headers)
            created_products.append(response.json())
        
        # 1. Test search by title
        response = client.get("/products/?search=laptop")
        assert response.status_code == 200
        search_results = response.json()
        assert len(search_results["products"]) == 2  # MacBook Pro and Dell Laptop
        
        # 2. Test search by description
        response = client.get("/products/?search=Apple")
        assert response.status_code == 200
        search_results = response.json()
        assert len(search_results["products"]) == 1
        assert search_results["products"][0]["title"] == "MacBook Pro"
        
        # 3. Test category filtering
        response = client.get(f"/products/?category_id={electronics_id}")
        assert response.status_code == 200
        category_results = response.json()
        assert len(category_results["products"]) == 2
        
        # 4. Test price filtering
        response = client.get("/products/?min_price=100&max_price=1000")
        assert response.status_code == 200
        price_results = response.json()
        # Should include Dell Laptop and Math Textbook
        assert len(price_results["products"]) == 2
        
        # 5. Test combined filtering
        response = client.get(f"/products/?category_id={electronics_id}&min_price=1000")
        assert response.status_code == 200
        combined_results = response.json()
        assert len(combined_results["products"]) == 1  # Only MacBook Pro
        assert combined_results["products"][0]["title"] == "MacBook Pro"
        
        # 6. Test pagination
        response = client.get("/products/?page=1&per_page=2")
        assert response.status_code == 200
        page_results = response.json()
        assert len(page_results["products"]) == 2
        assert page_results["total"] == 4
        assert page_results["total_pages"] == 2

    def test_image_upload_integration_workflow(self, client, test_user_data, test_product_data, test_category_data):
        """Test complete image upload and product creation workflow"""
        
        # Setup: Register user and get token
        client.post("/auth/register", json=test_user_data)
        login_response = client.post("/auth/login", json={
            "username": test_user_data["username"], 
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Setup: Create category
        category_response = client.post("/categories/", json=test_category_data, headers=headers)
        category_id = category_response.json()["id"]
        
        # Create a test image (skip if PIL not available)
        if not PIL_AVAILABLE:
            pytest.skip("PIL/Pillow not available for image tests")
        
        img = Image.new('RGB', (800, 600), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # 1. Upload image
        files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
        response = client.post("/upload/image", files=files, headers=headers)
        assert response.status_code == 200
        upload_result = response.json()
        assert "filename" in upload_result
        filename = upload_result["filename"]
        
        # 2. Create product with uploaded image
        test_product_data["category_id"] = category_id
        test_product_data["images"] = [filename]
        
        response = client.post("/products/", json=test_product_data, headers=headers)
        assert response.status_code == 201
        product_data = response.json()
        assert product_data["images"] == [filename]
        product_id = product_data["id"]
        
        # 3. Verify image can be served
        response = client.get(f"/upload/images/{filename}")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("image/")
        
        # 4. Test different image sizes
        for size in ["thumbnail", "medium", "large"]:
            response = client.get(f"/upload/images/{filename}?size={size}")
            assert response.status_code == 200
        
        # 5. Delete product (should also clean up images)
        response = client.delete(f"/products/{product_id}", headers=headers)
        assert response.status_code == 200
        
        # 6. Clean up uploaded image
        response = client.delete(f"/upload/images/{filename}", headers=headers)
        assert response.status_code == 200

    def test_user_permissions_and_authorization_workflow(self, client):
        """Test user permissions and authorization across different resources"""
        
        # Create two test users
        user1_data = {"username": "user1", "email": "user1@example.com", "password": "password123"}
        user2_data = {"username": "user2", "email": "user2@example.com", "password": "password123"}
        
        # Register both users
        client.post("/auth/register", json=user1_data)
        client.post("/auth/register", json=user2_data)
        
        # Login both users
        login1_response = client.post("/auth/login", json={
            "username": user1_data["username"], "password": user1_data["password"]
        })
        login2_response = client.post("/auth/login", json={
            "username": user2_data["username"], "password": user2_data["password"]
        })
        
        user1_token = login1_response.json()["access_token"]
        user2_token = login2_response.json()["access_token"]
        
        headers1 = {"Authorization": f"Bearer {user1_token}"}
        headers2 = {"Authorization": f"Bearer {user2_token}"}
        
        # Create category (using user1)
        category_response = client.post("/categories/", json={
            "name": "Test Category", "description": "Test"
        }, headers=headers1)
        category_id = category_response.json()["id"]
        
        # User1 creates a product
        product_data = {
            "title": "User1's Product",
            "description": "Product owned by user1",
            "price": 99.99,
            "category_id": category_id
        }
        
        product_response = client.post("/products/", json=product_data, headers=headers1)
        assert product_response.status_code == 201
        product_id = product_response.json()["id"]
        
        # User2 should be able to read the product
        response = client.get(f"/products/{product_id}", headers=headers2)
        assert response.status_code == 200
        
        # User2 should NOT be able to update user1's product
        update_data = {"title": "Hacked Product"}
        response = client.put(f"/products/{product_id}", json=update_data, headers=headers2)
        assert response.status_code == 403
        
        # User2 should NOT be able to delete user1's product
        response = client.delete(f"/products/{product_id}", headers=headers2)
        assert response.status_code == 403
        
        # User1 should be able to update their own product
        response = client.put(f"/products/{product_id}", json=update_data, headers=headers1)
        assert response.status_code == 200
        
        # User1 should be able to delete their own product
        response = client.delete(f"/products/{product_id}", headers=headers1)
        assert response.status_code == 200

    def test_database_transaction_integrity(self, client, test_user_data, db_session):
        """Test database transaction integrity and rollback scenarios"""
        
        # Register user
        client.post("/auth/register", json=test_user_data)
        login_response = client.post("/auth/login", json={
            "username": test_user_data["username"], 
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create category
        category_response = client.post("/categories/", json={
            "name": "Test Category", "description": "Test"
        }, headers=headers)
        category_id = category_response.json()["id"]
        
        # Test creating product with invalid data (should not affect database)
        invalid_product = {
            "title": "",  # Invalid: empty title
            "price": -10,  # Invalid: negative price
            "category_id": category_id
        }
        
        # Count products before invalid creation
        initial_count = db_session.query(Product).count()
        
        response = client.post("/products/", json=invalid_product, headers=headers)
        assert response.status_code == 422  # Validation error
        
        # Verify no product was created
        final_count = db_session.query(Product).count()
        assert final_count == initial_count
        
        # Test successful product creation
        valid_product = {
            "title": "Valid Product",
            "description": "Valid description",
            "price": 99.99,
            "category_id": category_id
        }
        
        response = client.post("/products/", json=valid_product, headers=headers)
        assert response.status_code == 201
        
        # Verify product was created
        final_count = db_session.query(Product).count()
        assert final_count == initial_count + 1

    def test_api_error_handling_and_responses(self, client, test_user_data):
        """Test API error handling and consistent response formats"""
        
        # Test 404 errors
        response = client.get("/products/nonexistent-id")
        assert response.status_code == 404
        error_data = response.json()
        assert "detail" in error_data
        
        # Test validation errors
        invalid_user = {"username": "", "email": "invalid-email", "password": "123"}
        response = client.post("/auth/register", json=invalid_user)
        assert response.status_code == 422
        error_data = response.json()
        assert "detail" in error_data
        
        # Test authentication errors
        response = client.get("/auth/me")
        assert response.status_code == 401
        
        # Test authorization errors
        client.post("/auth/register", json=test_user_data)
        login_response = client.post("/auth/login", json={
            "username": test_user_data["username"], 
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to update non-existent product
        response = client.put("/products/nonexistent-id", json={"title": "Test"}, headers=headers)
        assert response.status_code == 404
        
        # Test server error handling (simulate by sending malformed data)
        response = client.post("/products/", data="invalid json", headers=headers)
        assert response.status_code in [400, 422]


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])