"""
API Workflow Tests

Tests for specific API workflows and edge cases that complement the integration tests.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import tempfile
import json
from datetime import datetime, timedelta

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_workflows.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db


class TestAPIWorkflows:
    """Test specific API workflows and business logic"""
    
    @pytest.fixture(scope="function")
    def client(self):
        """Create test client with fresh database"""
        Base.metadata.create_all(bind=engine)
        with TestClient(app) as c:
            yield c
        Base.metadata.drop_all(bind=engine)
    
    @pytest.fixture
    def authenticated_user(self, client):
        """Create and authenticate a test user"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com", 
            "password": "testpassword123"
        }
        
        # Register user
        client.post("/auth/register", json=user_data)
        
        # Login and get token
        login_response = client.post("/auth/login", json={
            "username": user_data["username"],
            "password": user_data["password"]
        })
        
        token = login_response.json()["access_token"]
        user_info = login_response.json()["user"]
        
        return {
            "token": token,
            "headers": {"Authorization": f"Bearer {token}"},
            "user": user_info
        }
    
    @pytest.fixture
    def test_category(self, client, authenticated_user):
        """Create a test category"""
        category_data = {
            "name": "Test Category",
            "description": "Test category for workflows"
        }
        
        response = client.post("/categories/", json=category_data, headers=authenticated_user["headers"])
        return response.json()

    def test_marketplace_pagination_workflow(self, client, authenticated_user, test_category):
        """Test marketplace pagination with large dataset"""
        
        # Create 25 test products
        products = []
        for i in range(25):
            product_data = {
                "title": f"Product {i:02d}",
                "description": f"Description for product {i}",
                "price": 10.0 + (i * 5.0),
                "category_id": test_category["id"]
            }
            
            response = client.post("/products/", json=product_data, headers=authenticated_user["headers"])
            assert response.status_code == 201
            products.append(response.json())
        
        # Test first page (default page size should be 12)
        response = client.get("/products/")
        assert response.status_code == 200
        page1_data = response.json()
        assert len(page1_data["products"]) == 12
        assert page1_data["total"] == 25
        assert page1_data["page"] == 1
        assert page1_data["total_pages"] == 3
        
        # Test second page
        response = client.get("/products/?page=2")
        assert response.status_code == 200
        page2_data = response.json()
        assert len(page2_data["products"]) == 12
        assert page2_data["page"] == 2
        
        # Test last page
        response = client.get("/products/?page=3")
        assert response.status_code == 200
        page3_data = response.json()
        assert len(page3_data["products"]) == 1  # Only one product on last page
        assert page3_data["page"] == 3
        
        # Test custom page size
        response = client.get("/products/?per_page=5")
        assert response.status_code == 200
        custom_page_data = response.json()
        assert len(custom_page_data["products"]) == 5
        assert custom_page_data["total_pages"] == 5
        
        # Test pagination with filters
        response = client.get(f"/products/?category_id={test_category['id']}&page=2&per_page=10")
        assert response.status_code == 200
        filtered_page_data = response.json()
        assert len(filtered_page_data["products"]) == 10
        assert filtered_page_data["page"] == 2

    def test_advanced_search_workflow(self, client, authenticated_user):
        """Test advanced search functionality with multiple criteria"""
        
        # Create categories
        electronics = client.post("/categories/", json={
            "name": "Electronics", "description": "Electronic devices"
        }, headers=authenticated_user["headers"]).json()
        
        books = client.post("/categories/", json={
            "name": "Books", "description": "Textbooks and novels"  
        }, headers=authenticated_user["headers"]).json()
        
        # Create diverse products
        products_data = [
            {"title": "MacBook Pro 16", "description": "Apple laptop computer", "price": 2499.99, "category_id": electronics["id"]},
            {"title": "Dell XPS 13", "description": "Windows laptop", "price": 1299.99, "category_id": electronics["id"]},
            {"title": "iPhone 14", "description": "Apple smartphone", "price": 999.99, "category_id": electronics["id"]},
            {"title": "Python Programming", "description": "Learn Python programming", "price": 49.99, "category_id": books["id"]},
            {"title": "Data Structures", "description": "Computer science textbook", "price": 89.99, "category_id": books["id"]},
            {"title": "Calculus Textbook", "description": "Mathematics textbook", "price": 159.99, "category_id": books["id"]},
        ]
        
        for product_data in products_data:
            client.post("/products/", json=product_data, headers=authenticated_user["headers"])
        
        # Test search by title keyword
        response = client.get("/products/?search=laptop")
        results = response.json()
        assert len(results["products"]) == 2  # MacBook Pro and Dell XPS
        
        # Test search by description
        response = client.get("/products/?search=Apple")
        results = response.json()
        assert len(results["products"]) == 2  # MacBook Pro and iPhone
        
        # Test case-insensitive search
        response = client.get("/products/?search=PYTHON")
        results = response.json()
        assert len(results["products"]) == 1
        assert results["products"][0]["title"] == "Python Programming"
        
        # Test partial word search
        response = client.get("/products/?search=text")
        results = response.json()
        assert len(results["products"]) == 2  # Data Structures and Calculus textbooks
        
        # Test search with category filter
        response = client.get(f"/products/?search=textbook&category_id={books['id']}")
        results = response.json()
        assert len(results["products"]) == 2
        
        # Test search with price range
        response = client.get("/products/?search=laptop&min_price=1000&max_price=2000")
        results = response.json()
        assert len(results["products"]) == 1  # Only Dell XPS (MacBook is > 2000)
        
        # Test empty search results
        response = client.get("/products/?search=nonexistentproduct")
        results = response.json()
        assert len(results["products"]) == 0
        assert results["total"] == 0

    def test_product_status_workflow(self, client, authenticated_user, test_category):
        """Test product status changes and filtering"""
        
        # Create product
        product_data = {
            "title": "Status Test Product",
            "description": "Testing status changes",
            "price": 99.99,
            "category_id": test_category["id"],
            "status": "available"
        }
        
        response = client.post("/products/", json=product_data, headers=authenticated_user["headers"])
        product = response.json()
        product_id = product["id"]
        
        # Verify initial status
        response = client.get(f"/products/{product_id}")
        assert response.json()["status"] == "available"
        
        # Change status to pending
        response = client.put(f"/products/{product_id}", json={"status": "pending"}, headers=authenticated_user["headers"])
        assert response.status_code == 200
        assert response.json()["status"] == "pending"
        
        # Change status to sold
        response = client.put(f"/products/{product_id}", json={"status": "sold"}, headers=authenticated_user["headers"])
        assert response.status_code == 200
        assert response.json()["status"] == "sold"
        
        # Test filtering by status
        response = client.get("/products/?status=sold")
        results = response.json()
        assert len(results["products"]) == 1
        assert results["products"][0]["status"] == "sold"
        
        # Test filtering by available status (should be empty)
        response = client.get("/products/?status=available")
        results = response.json()
        assert len(results["products"]) == 0
        
        # Test invalid status update
        response = client.put(f"/products/{product_id}", json={"status": "invalid_status"}, headers=authenticated_user["headers"])
        assert response.status_code == 422

    def test_user_profile_workflow(self, client, authenticated_user):
        """Test user profile management workflow"""
        
        # Get current profile
        response = client.get("/users/profile", headers=authenticated_user["headers"])
        assert response.status_code == 200
        profile = response.json()
        original_username = profile["username"]
        original_email = profile["email"]
        
        # Update username
        update_data = {"username": "updated_username"}
        response = client.put("/users/profile", json=update_data, headers=authenticated_user["headers"])
        assert response.status_code == 200
        updated_profile = response.json()
        assert updated_profile["username"] == "updated_username"
        assert updated_profile["email"] == original_email  # Should remain unchanged
        
        # Update email
        update_data = {"email": "updated@example.com"}
        response = client.put("/users/profile", json=update_data, headers=authenticated_user["headers"])
        assert response.status_code == 200
        updated_profile = response.json()
        assert updated_profile["email"] == "updated@example.com"
        assert updated_profile["username"] == "updated_username"  # Should remain changed
        
        # Update both username and email
        update_data = {"username": "final_username", "email": "final@example.com"}
        response = client.put("/users/profile", json=update_data, headers=authenticated_user["headers"])
        assert response.status_code == 200
        updated_profile = response.json()
        assert updated_profile["username"] == "final_username"
        assert updated_profile["email"] == "final@example.com"
        
        # Test invalid email format
        update_data = {"email": "invalid-email"}
        response = client.put("/users/profile", json=update_data, headers=authenticated_user["headers"])
        assert response.status_code == 422
        
        # Test empty username
        update_data = {"username": ""}
        response = client.put("/users/profile", json=update_data, headers=authenticated_user["headers"])
        assert response.status_code == 422

    def test_category_products_workflow(self, client, authenticated_user):
        """Test category-specific product listings"""
        
        # Create multiple categories
        electronics = client.post("/categories/", json={
            "name": "Electronics", "description": "Electronic devices"
        }, headers=authenticated_user["headers"]).json()
        
        furniture = client.post("/categories/", json={
            "name": "Furniture", "description": "Home furniture"
        }, headers=authenticated_user["headers"]).json()
        
        # Create products in different categories
        electronics_products = [
            {"title": "Laptop", "price": 999.99, "category_id": electronics["id"]},
            {"title": "Phone", "price": 599.99, "category_id": electronics["id"]},
            {"title": "Tablet", "price": 399.99, "category_id": electronics["id"]},
        ]
        
        furniture_products = [
            {"title": "Desk Chair", "price": 199.99, "category_id": furniture["id"]},
            {"title": "Standing Desk", "price": 299.99, "category_id": furniture["id"]},
        ]
        
        for product_data in electronics_products:
            client.post("/products/", json=product_data, headers=authenticated_user["headers"])
        
        for product_data in furniture_products:
            client.post("/products/", json=product_data, headers=authenticated_user["headers"])
        
        # Test category-specific listing
        response = client.get(f"/categories/{electronics['id']}/products")
        assert response.status_code == 200
        electronics_results = response.json()
        assert len(electronics_results["products"]) == 3
        
        response = client.get(f"/categories/{furniture['id']}/products")
        assert response.status_code == 200
        furniture_results = response.json()
        assert len(furniture_results["products"]) == 2
        
        # Test category listing with pagination
        response = client.get(f"/categories/{electronics['id']}/products?per_page=2")
        assert response.status_code == 200
        paginated_results = response.json()
        assert len(paginated_results["products"]) == 2
        assert paginated_results["total"] == 3
        assert paginated_results["total_pages"] == 2
        
        # Test category listing with price filter
        response = client.get(f"/categories/{electronics['id']}/products?min_price=500")
        assert response.status_code == 200
        filtered_results = response.json()
        assert len(filtered_results["products"]) == 2  # Laptop and Phone
        
        # Test non-existent category
        response = client.get("/categories/nonexistent-id/products")
        assert response.status_code == 404

    def test_concurrent_user_operations_workflow(self, client):
        """Test scenarios with multiple users operating simultaneously"""
        
        # Create two users
        users = []
        for i in range(2):
            user_data = {
                "username": f"user{i}",
                "email": f"user{i}@example.com",
                "password": "password123"
            }
            
            client.post("/auth/register", json=user_data)
            login_response = client.post("/auth/login", json={
                "username": user_data["username"],
                "password": user_data["password"]
            })
            
            token = login_response.json()["access_token"]
            users.append({
                "data": user_data,
                "token": token,
                "headers": {"Authorization": f"Bearer {token}"}
            })
        
        # User 0 creates a category
        category_response = client.post("/categories/", json={
            "name": "Shared Category", "description": "Category for multiple users"
        }, headers=users[0]["headers"])
        category_id = category_response.json()["id"]
        
        # Both users create products in the same category
        user0_product = client.post("/products/", json={
            "title": "User 0 Product",
            "price": 100.0,
            "category_id": category_id
        }, headers=users[0]["headers"]).json()
        
        user1_product = client.post("/products/", json={
            "title": "User 1 Product", 
            "price": 200.0,
            "category_id": category_id
        }, headers=users[1]["headers"]).json()
        
        # Both products should appear in category listing
        response = client.get(f"/categories/{category_id}/products")
        assert response.status_code == 200
        category_products = response.json()
        assert len(category_products["products"]) == 2
        
        # User 0 should not be able to edit User 1's product
        response = client.put(f"/products/{user1_product['id']}", json={
            "title": "Hijacked Product"
        }, headers=users[0]["headers"])
        assert response.status_code == 403
        
        # User 1 should not be able to delete User 0's product
        response = client.delete(f"/products/{user0_product['id']}", headers=users[1]["headers"])
        assert response.status_code == 403
        
        # Each user can manage their own products
        response = client.put(f"/products/{user0_product['id']}", json={
            "title": "Updated by Owner"
        }, headers=users[0]["headers"])
        assert response.status_code == 200
        
        response = client.delete(f"/products/{user1_product['id']}", headers=users[1]["headers"])
        assert response.status_code == 200

    def test_data_validation_workflow(self, client, authenticated_user, test_category):
        """Test comprehensive data validation scenarios"""
        
        # Test product creation with various invalid inputs
        invalid_products = [
            # Empty title
            {"title": "", "price": 100.0, "category_id": test_category["id"]},
            # Negative price
            {"title": "Valid Title", "price": -10.0, "category_id": test_category["id"]},
            # Zero price
            {"title": "Valid Title", "price": 0.0, "category_id": test_category["id"]},
            # Missing category
            {"title": "Valid Title", "price": 100.0, "category_id": ""},
            # Invalid category ID
            {"title": "Valid Title", "price": 100.0, "category_id": "nonexistent"},
            # Title too long (over 200 chars)
            {"title": "x" * 201, "price": 100.0, "category_id": test_category["id"]},
            # Description too long (over 2000 chars) 
            {"title": "Valid", "description": "x" * 2001, "price": 100.0, "category_id": test_category["id"]},
        ]
        
        for invalid_product in invalid_products:
            response = client.post("/products/", json=invalid_product, headers=authenticated_user["headers"])
            assert response.status_code in [400, 404, 422], f"Failed for product: {invalid_product}"
        
        # Test valid edge cases
        valid_products = [
            # Minimum valid title length
            {"title": "abc", "price": 0.01, "category_id": test_category["id"]},
            # Maximum valid title length
            {"title": "x" * 200, "price": 999999.99, "category_id": test_category["id"]},
            # Maximum valid description length
            {"title": "Valid", "description": "x" * 2000, "price": 100.0, "category_id": test_category["id"]},
        ]
        
        for valid_product in valid_products:
            response = client.post("/products/", json=valid_product, headers=authenticated_user["headers"])
            assert response.status_code == 201, f"Failed for product: {valid_product}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])