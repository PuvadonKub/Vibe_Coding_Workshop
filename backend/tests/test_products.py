"""
Unit and integration tests for product management API
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.utils.auth import get_password_hash, create_access_token

# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_products.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def test_db():
    """Create and clean up test database for each test"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123"
    }

@pytest.fixture
def sample_category_data():
    """Sample category data for testing"""
    return {
        "name": "Electronics",
        "description": "Electronic devices and accessories"
    }

@pytest.fixture
def sample_product_data():
    """Sample product data for testing"""
    return {
        "title": "iPhone 13",
        "description": "Barely used iPhone 13 in excellent condition",
        "price": 599.99,
        "status": "available",
        "image_url": "https://example.com/iphone13.jpg"
    }

@pytest.fixture
def authenticated_user(test_db, sample_user_data):
    """Create an authenticated user and return user data with token"""
    db = TestingSessionLocal()
    
    # Create user
    user = User(
        username=sample_user_data["username"],
        email=sample_user_data["email"],
        password_hash=get_password_hash(sample_user_data["password"])
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    token = create_access_token(data={"sub": user.id})
    
    db.close()
    return {
        "user": user,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }

@pytest.fixture
def sample_category(test_db, sample_category_data):
    """Create a sample category in the test database"""
    db = TestingSessionLocal()
    
    category = Category(**sample_category_data)
    db.add(category)
    db.commit()
    db.refresh(category)
    
    db.close()
    return category


class TestProductCreation:
    """Test product creation endpoints"""
    
    def test_create_product_success(self, test_db, authenticated_user, sample_category, sample_product_data):
        """Test successful product creation"""
        product_data = {**sample_product_data, "category_id": sample_category.id}
        
        response = client.post(
            "/products/",
            json=product_data,
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == sample_product_data["title"]
        assert data["price"] == sample_product_data["price"]
        assert data["seller_id"] == authenticated_user["user"].id
        assert data["category_id"] == sample_category.id
        assert "id" in data
        assert "created_at" in data
    
    def test_create_product_without_auth(self, test_db, sample_category, sample_product_data):
        """Test product creation without authentication"""
        product_data = {**sample_product_data, "category_id": sample_category.id}
        
        response = client.post("/products/", json=product_data)
        
        assert response.status_code == 403
    
    def test_create_product_invalid_category(self, test_db, authenticated_user, sample_product_data):
        """Test product creation with invalid category"""
        product_data = {**sample_product_data, "category_id": "invalid-category-id"}
        
        response = client.post(
            "/products/",
            json=product_data,
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 404
        assert "Category not found" in response.json()["detail"]
    
    def test_create_product_invalid_price(self, test_db, authenticated_user, sample_category):
        """Test product creation with invalid price"""
        product_data = {
            "title": "Test Product",
            "price": -10.0,  # Invalid negative price
            "category_id": sample_category.id
        }
        
        response = client.post(
            "/products/",
            json=product_data,
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_create_product_missing_required_fields(self, test_db, authenticated_user, sample_category):
        """Test product creation with missing required fields"""
        product_data = {
            "description": "Missing title and price",
            "category_id": sample_category.id
        }
        
        response = client.post(
            "/products/",
            json=product_data,
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 422  # Validation error


class TestProductRetrieval:
    """Test product retrieval endpoints"""
    
    def test_get_products_empty_list(self, test_db):
        """Test getting products when none exist"""
        response = client.get("/products/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["products"] == []
        assert data["total"] == 0
        assert data["page"] == 1
    
    def test_get_products_with_data(self, test_db, authenticated_user, sample_category, sample_product_data):
        """Test getting products with data"""
        # Create a product first
        product_data = {**sample_product_data, "category_id": sample_category.id}
        create_response = client.post(
            "/products/",
            json=product_data,
            headers=authenticated_user["headers"]
        )
        assert create_response.status_code == 201
        
        # Get products
        response = client.get("/products/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 1
        assert data["total"] == 1
        assert data["products"][0]["title"] == sample_product_data["title"]
    
    def test_get_products_pagination(self, test_db, authenticated_user, sample_category):
        """Test product pagination"""
        # Create multiple products
        for i in range(15):
            product_data = {
                "title": f"Product {i}",
                "price": 10.0 + i,
                "category_id": sample_category.id
            }
            client.post(
                "/products/",
                json=product_data,
                headers=authenticated_user["headers"]
            )
        
        # Test first page
        response = client.get("/products/?page=1&per_page=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 10
        assert data["total"] == 15
        assert data["total_pages"] == 2
        
        # Test second page
        response = client.get("/products/?page=2&per_page=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 5
    
    def test_get_products_filter_by_category(self, test_db, authenticated_user, sample_category):
        """Test filtering products by category"""
        # Create another category
        db = TestingSessionLocal()
        other_category = Category(name="Books", description="Educational books")
        db.add(other_category)
        db.commit()
        db.refresh(other_category)
        db.close()
        
        # Create products in both categories
        client.post(
            "/products/",
            json={"title": "Electronics Product", "price": 100, "category_id": sample_category.id},
            headers=authenticated_user["headers"]
        )
        client.post(
            "/products/",
            json={"title": "Book Product", "price": 20, "category_id": other_category.id},
            headers=authenticated_user["headers"]
        )
        
        # Filter by electronics category
        response = client.get(f"/products/?category_id={sample_category.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["products"][0]["title"] == "Electronics Product"
    
    def test_get_products_filter_by_price_range(self, test_db, authenticated_user, sample_category):
        """Test filtering products by price range"""
        # Create products with different prices
        for i, price in enumerate([10.0, 50.0, 100.0, 200.0]):
            client.post(
                "/products/",
                json={"title": f"Product {i}", "price": price, "category_id": sample_category.id},
                headers=authenticated_user["headers"]
            )
        
        # Filter by price range
        response = client.get("/products/?min_price=25&max_price=150")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2  # Products with prices 50 and 100
    
    def test_get_products_search(self, test_db, authenticated_user, sample_category):
        """Test product search functionality"""
        # Create products with different titles
        products = [
            {"title": "iPhone 13 Pro", "price": 999, "description": "Latest Apple phone"},
            {"title": "Samsung Galaxy", "price": 800, "description": "Android smartphone"},
            {"title": "iPad Air", "price": 599, "description": "Apple tablet device"}
        ]
        
        for product in products:
            client.post(
                "/products/",
                json={**product, "category_id": sample_category.id},
                headers=authenticated_user["headers"]
            )
        
        # Search for "iPhone"
        response = client.get("/products/?search=iPhone")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert "iPhone" in data["products"][0]["title"]
        
        # Search for "Apple" (should find iPhone and iPad)
        response = client.get("/products/?search=Apple")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
    
    def test_get_product_by_id(self, test_db, authenticated_user, sample_category, sample_product_data):
        """Test getting specific product by ID"""
        # Create a product
        product_data = {**sample_product_data, "category_id": sample_category.id}
        create_response = client.post(
            "/products/",
            json=product_data,
            headers=authenticated_user["headers"]
        )
        product_id = create_response.json()["id"]
        
        # Get product by ID
        response = client.get(f"/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == product_id
        assert data["title"] == sample_product_data["title"]
        assert "seller" in data  # Should include seller details
        assert "category" in data  # Should include category details
    
    def test_get_product_not_found(self, test_db):
        """Test getting non-existent product"""
        response = client.get("/products/non-existent-id")
        assert response.status_code == 404
        assert "Product not found" in response.json()["detail"]


class TestProductUpdate:
    """Test product update endpoints"""
    
    def test_update_product_success(self, test_db, authenticated_user, sample_category, sample_product_data):
        """Test successful product update"""
        # Create a product
        product_data = {**sample_product_data, "category_id": sample_category.id}
        create_response = client.post(
            "/products/",
            json=product_data,
            headers=authenticated_user["headers"]
        )
        product_id = create_response.json()["id"]
        
        # Update product
        update_data = {
            "title": "Updated iPhone 13",
            "price": 549.99,
            "status": "sold"
        }
        
        response = client.put(
            f"/products/{product_id}",
            json=update_data,
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated iPhone 13"
        assert data["price"] == 549.99
        assert data["status"] == "sold"
    
    def test_update_product_not_owner(self, test_db, authenticated_user, sample_category, sample_product_data):
        """Test updating product by non-owner"""
        # Create product with first user
        product_data = {**sample_product_data, "category_id": sample_category.id}
        create_response = client.post(
            "/products/",
            json=product_data,
            headers=authenticated_user["headers"]
        )
        product_id = create_response.json()["id"]
        
        # Create second user
        db = TestingSessionLocal()
        user2 = User(
            username="user2",
            email="user2@example.com",
            password_hash=get_password_hash("password123")
        )
        db.add(user2)
        db.commit()
        db.refresh(user2)
        
        token2 = create_access_token(data={"sub": user2.id})
        headers2 = {"Authorization": f"Bearer {token2}"}
        db.close()
        
        # Try to update with second user
        response = client.put(
            f"/products/{product_id}",
            json={"title": "Hacked Product"},
            headers=headers2
        )
        
        assert response.status_code == 403
        assert "You can only update your own products" in response.json()["detail"]
    
    def test_update_product_not_found(self, test_db, authenticated_user):
        """Test updating non-existent product"""
        response = client.put(
            "/products/non-existent-id",
            json={"title": "Updated Title"},
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 404
        assert "Product not found" in response.json()["detail"]


class TestProductDeletion:
    """Test product deletion endpoints"""
    
    def test_delete_product_success(self, test_db, authenticated_user, sample_category, sample_product_data):
        """Test successful product deletion"""
        # Create a product
        product_data = {**sample_product_data, "category_id": sample_category.id}
        create_response = client.post(
            "/products/",
            json=product_data,
            headers=authenticated_user["headers"]
        )
        product_id = create_response.json()["id"]
        
        # Delete product
        response = client.delete(
            f"/products/{product_id}",
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "deleted successfully" in data["message"]
        assert data["product_id"] == product_id
        
        # Verify product is deleted
        get_response = client.get(f"/products/{product_id}")
        assert get_response.status_code == 404
    
    def test_delete_product_not_owner(self, test_db, authenticated_user, sample_category, sample_product_data):
        """Test deleting product by non-owner"""
        # Create product with first user
        product_data = {**sample_product_data, "category_id": sample_category.id}
        create_response = client.post(
            "/products/",
            json=product_data,
            headers=authenticated_user["headers"]
        )
        product_id = create_response.json()["id"]
        
        # Create second user
        db = TestingSessionLocal()
        user2 = User(
            username="user2",
            email="user2@example.com",
            password_hash=get_password_hash("password123")
        )
        db.add(user2)
        db.commit()
        db.refresh(user2)
        
        token2 = create_access_token(data={"sub": user2.id})
        headers2 = {"Authorization": f"Bearer {token2}"}
        db.close()
        
        # Try to delete with second user
        response = client.delete(
            f"/products/{product_id}",
            headers=headers2
        )
        
        assert response.status_code == 403
        assert "You can only delete your own products" in response.json()["detail"]


class TestSellerProducts:
    """Test seller-specific product endpoints"""
    
    def test_get_seller_products(self, test_db, authenticated_user, sample_category):
        """Test getting products by seller"""
        # Create multiple products
        for i in range(3):
            product_data = {
                "title": f"Product {i}",
                "price": 10.0 + i,
                "category_id": sample_category.id
            }
            client.post(
                "/products/",
                json=product_data,
                headers=authenticated_user["headers"]
            )
        
        # Get seller products
        response = client.get(f"/products/seller/{authenticated_user['user'].id}")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["products"]) == 3
    
    def test_get_seller_products_not_found(self, test_db):
        """Test getting products for non-existent seller"""
        response = client.get("/products/seller/non-existent-seller")
        assert response.status_code == 404
        assert "Seller not found" in response.json()["detail"]


class TestProductAuthorization:
    """Test product authorization and security"""
    
    def test_create_product_invalid_token(self, test_db, sample_category, sample_product_data):
        """Test product creation with invalid token"""
        product_data = {**sample_product_data, "category_id": sample_category.id}
        headers = {"Authorization": "Bearer invalid-token"}
        
        response = client.post("/products/", json=product_data, headers=headers)
        assert response.status_code == 401
    
    def test_update_product_invalid_token(self, test_db):
        """Test product update with invalid token"""
        headers = {"Authorization": "Bearer invalid-token"}
        
        response = client.put(
            "/products/some-id",
            json={"title": "Updated"},
            headers=headers
        )
        assert response.status_code == 401
    
    def test_delete_product_invalid_token(self, test_db):
        """Test product deletion with invalid token"""
        headers = {"Authorization": "Bearer invalid-token"}
        
        response = client.delete("/products/some-id", headers=headers)
        assert response.status_code == 401


class TestProductValidation:
    """Test product data validation"""
    
    def test_product_price_validation(self, test_db, authenticated_user, sample_category):
        """Test product price validation"""
        # Test zero price
        response = client.post(
            "/products/",
            json={
                "title": "Free Product",
                "price": 0,
                "category_id": sample_category.id
            },
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 422
        
        # Test negative price
        response = client.post(
            "/products/",
            json={
                "title": "Negative Price Product",
                "price": -50,
                "category_id": sample_category.id
            },
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 422
    
    def test_product_status_validation(self, test_db, authenticated_user, sample_category):
        """Test product status validation"""
        # Create product first
        create_response = client.post(
            "/products/",
            json={
                "title": "Test Product",
                "price": 100,
                "category_id": sample_category.id
            },
            headers=authenticated_user["headers"]
        )
        product_id = create_response.json()["id"]
        
        # Test invalid status
        response = client.put(
            f"/products/{product_id}",
            json={"status": "invalid-status"},
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 422
        
        # Test valid status
        response = client.put(
            f"/products/{product_id}",
            json={"status": "sold"},
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 200
        assert response.json()["status"] == "sold"