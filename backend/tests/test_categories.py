"""
Unit and integration tests for category management API
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
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_categories.db"

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
def sample_categories(test_db):
    """Create multiple sample categories in the test database"""
    db = TestingSessionLocal()
    
    categories = [
        Category(name="Electronics", description="Electronic devices and accessories"),
        Category(name="Books", description="Educational and recreational books"),
        Category(name="Clothing", description="Apparel and fashion items"),
        Category(name="Furniture", description="Home and office furniture")
    ]
    
    for category in categories:
        db.add(category)
    
    db.commit()
    
    for category in categories:
        db.refresh(category)
    
    db.close()
    return categories


class TestCategoryListing:
    """Test category listing endpoints"""
    
    def test_get_categories_empty_list(self, test_db):
        """Test getting categories when none exist"""
        response = client.get("/categories/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["categories"] == []
        assert data["total"] == 0
    
    def test_get_categories_with_data(self, test_db, sample_categories):
        """Test getting categories with data"""
        response = client.get("/categories/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["categories"]) == 4
        assert data["total"] == 4
        
        # Check categories are sorted by name
        category_names = [cat["name"] for cat in data["categories"]]
        assert category_names == sorted(category_names)
    
    def test_get_categories_with_product_count(self, test_db, sample_categories, authenticated_user):
        """Test getting categories with product count"""
        db = TestingSessionLocal()
        
        # Create products in different categories
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        books_cat = next(cat for cat in sample_categories if cat.name == "Books")
        
        # Create 3 electronics products
        for i in range(3):
            product = Product(
                title=f"Electronic Device {i}",
                price=100.0 + i,
                seller_id=authenticated_user["user"].id,
                category_id=electronics_cat.id
            )
            db.add(product)
        
        # Create 1 book product
        product = Product(
            title="Programming Book",
            price=50.0,
            seller_id=authenticated_user["user"].id,
            category_id=books_cat.id
        )
        db.add(product)
        
        db.commit()
        db.close()
        
        # Get categories with count
        response = client.get("/categories/?include_count=true")
        
        assert response.status_code == 200
        data = response.json()
        
        # Find electronics category and check count
        electronics = next(cat for cat in data["categories"] if cat["name"] == "Electronics")
        assert electronics["product_count"] == 3
        
        # Find books category and check count
        books = next(cat for cat in data["categories"] if cat["name"] == "Books")
        assert books["product_count"] == 1
        
        # Categories with no products should have count 0
        furniture = next(cat for cat in data["categories"] if cat["name"] == "Furniture")
        assert furniture["product_count"] == 0
    
    def test_get_category_by_id(self, test_db, sample_categories):
        """Test getting specific category by ID"""
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        
        response = client.get(f"/categories/{electronics_cat.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == electronics_cat.id
        assert data["name"] == "Electronics"
        assert data["description"] == "Electronic devices and accessories"
        assert "created_at" in data
    
    def test_get_category_not_found(self, test_db):
        """Test getting non-existent category"""
        response = client.get("/categories/non-existent-id")
        
        assert response.status_code == 404
        assert "Category not found" in response.json()["detail"]


class TestCategoryCreation:
    """Test category creation endpoints"""
    
    def test_create_category_success(self, test_db, authenticated_user, sample_category_data):
        """Test successful category creation"""
        response = client.post(
            "/categories/",
            json=sample_category_data,
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_category_data["name"]
        assert data["description"] == sample_category_data["description"]
        assert "id" in data
        assert "created_at" in data
    
    def test_create_category_without_auth(self, test_db, sample_category_data):
        """Test category creation without authentication"""
        response = client.post("/categories/", json=sample_category_data)
        
        assert response.status_code == 403
    
    def test_create_category_duplicate_name(self, test_db, authenticated_user, sample_category_data):
        """Test creating category with duplicate name"""
        # Create first category
        response1 = client.post(
            "/categories/",
            json=sample_category_data,
            headers=authenticated_user["headers"]
        )
        assert response1.status_code == 201
        
        # Try to create second category with same name
        response2 = client.post(
            "/categories/",
            json=sample_category_data,
            headers=authenticated_user["headers"]
        )
        
        assert response2.status_code == 409
        assert "already exists" in response2.json()["detail"]
    
    def test_create_category_invalid_data(self, test_db, authenticated_user):
        """Test creating category with invalid data"""
        # Test empty name
        response = client.post(
            "/categories/",
            json={"name": "", "description": "Valid description"},
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 422
        
        # Test missing name
        response = client.post(
            "/categories/",
            json={"description": "Valid description"},
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 422
    
    def test_create_category_name_only(self, test_db, authenticated_user):
        """Test creating category with name only (description is optional)"""
        response = client.post(
            "/categories/",
            json={"name": "Test Category"},
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Category"
        assert data["description"] is None


class TestCategoryUpdate:
    """Test category update endpoints"""
    
    def test_update_category_success(self, test_db, authenticated_user, sample_categories):
        """Test successful category update"""
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        
        update_data = {
            "name": "Updated Electronics",
            "description": "Updated description for electronics"
        }
        
        response = client.put(
            f"/categories/{electronics_cat.id}",
            json=update_data,
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Electronics"
        assert data["description"] == "Updated description for electronics"
    
    def test_update_category_partial(self, test_db, authenticated_user, sample_categories):
        """Test partial category update"""
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        
        # Update only name
        response = client.put(
            f"/categories/{electronics_cat.id}",
            json={"name": "Partial Update Electronics"},
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Partial Update Electronics"
        assert data["description"] == electronics_cat.description  # Should remain unchanged
    
    def test_update_category_not_found(self, test_db, authenticated_user):
        """Test updating non-existent category"""
        response = client.put(
            "/categories/non-existent-id",
            json={"name": "New Name"},
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 404
        assert "Category not found" in response.json()["detail"]
    
    def test_update_category_duplicate_name(self, test_db, authenticated_user, sample_categories):
        """Test updating category with duplicate name"""
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        books_cat = next(cat for cat in sample_categories if cat.name == "Books")
        
        # Try to update electronics to have the same name as books
        response = client.put(
            f"/categories/{electronics_cat.id}",
            json={"name": "Books"},
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]
    
    def test_update_category_without_auth(self, test_db, sample_categories):
        """Test category update without authentication"""
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        
        response = client.put(
            f"/categories/{electronics_cat.id}",
            json={"name": "New Name"}
        )
        
        assert response.status_code == 403


class TestCategoryDeletion:
    """Test category deletion endpoints"""
    
    def test_delete_category_success(self, test_db, authenticated_user, sample_categories):
        """Test successful category deletion"""
        # Use a category without products
        furniture_cat = next(cat for cat in sample_categories if cat.name == "Furniture")
        
        response = client.delete(
            f"/categories/{furniture_cat.id}",
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "deleted successfully" in data["message"]
        assert data["category_id"] == furniture_cat.id
        assert data["deleted_products_count"] == 0
        
        # Verify category is deleted
        get_response = client.get(f"/categories/{furniture_cat.id}")
        assert get_response.status_code == 404
    
    def test_delete_category_with_products(self, test_db, authenticated_user, sample_categories):
        """Test deleting category that has products (should delete products too)"""
        db = TestingSessionLocal()
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        
        # Create products in this category
        for i in range(3):
            product = Product(
                title=f"Product {i}",
                price=100.0 + i,
                seller_id=authenticated_user["user"].id,
                category_id=electronics_cat.id
            )
            db.add(product)
        
        db.commit()
        db.close()
        
        # Delete category
        response = client.delete(
            f"/categories/{electronics_cat.id}",
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["deleted_products_count"] == 3
        
        # Verify category and products are deleted
        get_response = client.get(f"/categories/{electronics_cat.id}")
        assert get_response.status_code == 404
        
        # Check that products are also deleted
        products_response = client.get(f"/categories/{electronics_cat.id}/products")
        assert products_response.status_code == 404
    
    def test_delete_category_not_found(self, test_db, authenticated_user):
        """Test deleting non-existent category"""
        response = client.delete(
            "/categories/non-existent-id",
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 404
        assert "Category not found" in response.json()["detail"]
    
    def test_delete_category_without_auth(self, test_db, sample_categories):
        """Test category deletion without authentication"""
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        
        response = client.delete(f"/categories/{electronics_cat.id}")
        
        assert response.status_code == 403


class TestCategoryProducts:
    """Test category product listing endpoints"""
    
    def test_get_category_products_empty(self, test_db, sample_categories):
        """Test getting products from category with no products"""
        furniture_cat = next(cat for cat in sample_categories if cat.name == "Furniture")
        
        response = client.get(f"/categories/{furniture_cat.id}/products")
        
        assert response.status_code == 200
        data = response.json()
        assert data["products"] == []
        assert data["total"] == 0
    
    def test_get_category_products_with_data(self, test_db, sample_categories, authenticated_user):
        """Test getting products from category with products"""
        db = TestingSessionLocal()
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        
        # Create products in this category
        product_titles = ["iPhone 13", "iPad Air", "MacBook Pro"]
        for title in product_titles:
            product = Product(
                title=title,
                price=999.99,
                seller_id=authenticated_user["user"].id,
                category_id=electronics_cat.id,
                status="available"
            )
            db.add(product)
        
        db.commit()
        db.close()
        
        # Get products from category
        response = client.get(f"/categories/{electronics_cat.id}/products")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["products"]) == 3
        
        # Verify all products belong to this category
        for product in data["products"]:
            assert product["category_id"] == electronics_cat.id
    
    def test_get_category_products_pagination(self, test_db, sample_categories, authenticated_user):
        """Test pagination for category products"""
        db = TestingSessionLocal()
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        
        # Create 15 products
        for i in range(15):
            product = Product(
                title=f"Product {i}",
                price=100.0 + i,
                seller_id=authenticated_user["user"].id,
                category_id=electronics_cat.id
            )
            db.add(product)
        
        db.commit()
        db.close()
        
        # Test first page
        response = client.get(f"/categories/{electronics_cat.id}/products?page=1&per_page=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 10
        assert data["total"] == 15
        assert data["total_pages"] == 2
        
        # Test second page
        response = client.get(f"/categories/{electronics_cat.id}/products?page=2&per_page=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 5
    
    def test_get_category_products_filter_by_status(self, test_db, sample_categories, authenticated_user):
        """Test filtering category products by status"""
        db = TestingSessionLocal()
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        
        # Create products with different statuses
        statuses = ["available", "sold", "pending"]
        for i, status in enumerate(statuses * 2):  # 6 products total, 2 of each status
            product = Product(
                title=f"Product {i}",
                price=100.0,
                seller_id=authenticated_user["user"].id,
                category_id=electronics_cat.id,
                status=status
            )
            db.add(product)
        
        db.commit()
        db.close()
        
        # Filter by available status
        response = client.get(f"/categories/{electronics_cat.id}/products?status=available")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        for product in data["products"]:
            assert product["status"] == "available"
        
        # Filter by sold status
        response = client.get(f"/categories/{electronics_cat.id}/products?status=sold")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        
        # Get all statuses
        response = client.get(f"/categories/{electronics_cat.id}/products?status=all")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 6
    
    def test_get_category_products_filter_by_price(self, test_db, sample_categories, authenticated_user):
        """Test filtering category products by price range"""
        db = TestingSessionLocal()
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        
        # Create products with different prices
        prices = [50.0, 100.0, 200.0, 300.0, 500.0]
        for i, price in enumerate(prices):
            product = Product(
                title=f"Product {i}",
                price=price,
                seller_id=authenticated_user["user"].id,
                category_id=electronics_cat.id
            )
            db.add(product)
        
        db.commit()
        db.close()
        
        # Filter by price range
        response = client.get(f"/categories/{electronics_cat.id}/products?min_price=100&max_price=300")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3  # Products with prices 100, 200, 300
        
        for product in data["products"]:
            assert 100.0 <= product["price"] <= 300.0
    
    def test_get_category_products_not_found(self, test_db):
        """Test getting products from non-existent category"""
        response = client.get("/categories/non-existent-id/products")
        
        assert response.status_code == 404
        assert "Category not found" in response.json()["detail"]


class TestCategoryStats:
    """Test category statistics endpoints"""
    
    def test_get_category_stats_empty(self, test_db, sample_categories):
        """Test getting stats for category with no products"""
        furniture_cat = next(cat for cat in sample_categories if cat.name == "Furniture")
        
        response = client.get(f"/categories/{furniture_cat.id}/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert data["category_id"] == furniture_cat.id
        assert data["category_name"] == "Furniture"
        assert data["total_products"] == 0
        assert data["available_products"] == 0
        assert data["sold_products"] == 0
        assert data["price_stats"]["min_price"] == 0
        assert data["price_stats"]["max_price"] == 0
        assert data["price_stats"]["avg_price"] == 0
    
    def test_get_category_stats_with_data(self, test_db, sample_categories, authenticated_user):
        """Test getting stats for category with products"""
        db = TestingSessionLocal()
        electronics_cat = next(cat for cat in sample_categories if cat.name == "Electronics")
        
        # Create products with different statuses and prices
        products_data = [
            {"title": "Product 1", "price": 100.0, "status": "available"},
            {"title": "Product 2", "price": 200.0, "status": "available"},
            {"title": "Product 3", "price": 300.0, "status": "available"},
            {"title": "Product 4", "price": 150.0, "status": "sold"},
            {"title": "Product 5", "price": 250.0, "status": "pending"},
        ]
        
        for product_data in products_data:
            product = Product(
                title=product_data["title"],
                price=product_data["price"],
                seller_id=authenticated_user["user"].id,
                category_id=electronics_cat.id,
                status=product_data["status"]
            )
            db.add(product)
        
        db.commit()
        db.close()
        
        # Get stats
        response = client.get(f"/categories/{electronics_cat.id}/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_products"] == 5
        assert data["available_products"] == 3
        assert data["sold_products"] == 1
        
        # Price stats should be calculated only for available products
        assert data["price_stats"]["min_price"] == 100.0
        assert data["price_stats"]["max_price"] == 300.0
        assert data["price_stats"]["avg_price"] == 200.0  # (100 + 200 + 300) / 3
    
    def test_get_category_stats_not_found(self, test_db):
        """Test getting stats for non-existent category"""
        response = client.get("/categories/non-existent-id/stats")
        
        assert response.status_code == 404
        assert "Category not found" in response.json()["detail"]


class TestCategoryAuthorization:
    """Test category authorization and security"""
    
    def test_create_category_invalid_token(self, test_db, sample_category_data):
        """Test category creation with invalid token"""
        headers = {"Authorization": "Bearer invalid-token"}
        
        response = client.post("/categories/", json=sample_category_data, headers=headers)
        assert response.status_code == 401
    
    def test_update_category_invalid_token(self, test_db):
        """Test category update with invalid token"""
        headers = {"Authorization": "Bearer invalid-token"}
        
        response = client.put(
            "/categories/some-id",
            json={"name": "Updated"},
            headers=headers
        )
        assert response.status_code == 401
    
    def test_delete_category_invalid_token(self, test_db):
        """Test category deletion with invalid token"""
        headers = {"Authorization": "Bearer invalid-token"}
        
        response = client.delete("/categories/some-id", headers=headers)
        assert response.status_code == 401


class TestCategoryValidation:
    """Test category data validation"""
    
    def test_category_name_length_validation(self, test_db, authenticated_user):
        """Test category name length validation"""
        # Test name too long (over 100 characters)
        long_name = "x" * 101
        response = client.post(
            "/categories/",
            json={"name": long_name},
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 422
    
    def test_category_description_length_validation(self, test_db, authenticated_user):
        """Test category description length validation"""
        # Test description too long (over 500 characters)
        long_description = "x" * 501
        response = client.post(
            "/categories/",
            json={"name": "Valid Name", "description": long_description},
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 422
    
    def test_category_name_case_sensitivity(self, test_db, authenticated_user):
        """Test category name case sensitivity"""
        # Create category with lowercase name
        response1 = client.post(
            "/categories/",
            json={"name": "electronics"},
            headers=authenticated_user["headers"]
        )
        assert response1.status_code == 201
        
        # Try to create category with different case - should be allowed
        response2 = client.post(
            "/categories/",
            json={"name": "Electronics"},
            headers=authenticated_user["headers"]
        )
        assert response2.status_code == 201  # Different case should be allowed
        
        # Try exact same name - should fail
        response3 = client.post(
            "/categories/",
            json={"name": "electronics"},
            headers=authenticated_user["headers"]
        )
        assert response3.status_code == 409  # Exact duplicate should fail