# Student Marketplace API Documentation

## Overview

The Student Marketplace API is a comprehensive REST API built with FastAPI that provides secure and efficient endpoints for managing a student marketplace platform. The API supports user authentication, product management, category organization, file uploads, and advanced search capabilities.

## Base URL

```
Development: http://localhost:8000
Production: https://api.studentmarketplace.com
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header for protected endpoints:

```http
Authorization: Bearer <your_jwt_token_here>
```

### Authentication Flow

1. **Register**: `POST /auth/register` - Create a new user account
2. **Login**: `POST /auth/login` - Get JWT token
3. **Use Token**: Include in Authorization header for protected endpoints
4. **Logout**: `POST /auth/logout` - Clear client-side authentication

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default**: 100 requests per minute per IP
- **Auth endpoints**: 5 requests per minute per IP
- **Upload endpoints**: 10 requests per minute per authenticated user

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when limit resets

## Response Format

All API responses follow a consistent JSON format:

### Success Response
```json
{
  "data": { ... },
  "message": "Operation completed successfully",
  "status": "success"
}
```

### Error Response
```json
{
  "detail": "Error description",
  "error_code": "SPECIFIC_ERROR_CODE",
  "status": "error"
}
```

### Pagination Response
```json
{
  "products": [...],
  "total": 150,
  "page": 1,
  "per_page": 10,
  "total_pages": 15
}
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com", 
  "password": "SecurePassword123!"
}
```

**Response (201):**
```json
{
  "id": "uuid-string",
  "username": "johndoe",
  "email": "john@example.com",
  "created_at": "2023-12-01T10:00:00Z"
}
```

#### POST /auth/login
Authenticate and receive JWT token.

**Request Body:**
```json
{
  "username": "johndoe",  // Can be username or email
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

#### GET /auth/me
Get current authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid-string",
  "username": "johndoe",
  "email": "john@example.com",
  "created_at": "2023-12-01T10:00:00Z",
  "updated_at": "2023-12-01T10:00:00Z"
}
```

### Product Endpoints

#### GET /products
List products with pagination and filtering.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 10, max: 100)
- `search` (string): Search in title and description
- `category_id` (string): Filter by category UUID
- `min_price` (float): Minimum price filter
- `max_price` (float): Maximum price filter
- `status` (string): Filter by status (available, sold, pending, all)
- `seller_id` (string): Filter by seller UUID
- `sort_by` (string): Sort field (created_at, price, title)
- `sort_order` (string): Sort order (asc, desc)

**Example Request:**
```http
GET /products?page=1&per_page=20&search=laptop&category_id=electronics&min_price=100&max_price=1000&sort_by=price&sort_order=asc
```

**Response (200):**
```json
{
  "products": [
    {
      "id": "product-uuid",
      "title": "Gaming Laptop",
      "description": "High-performance gaming laptop",
      "price": 899.99,
      "image_url": "https://example.com/image.jpg",
      "status": "available",
      "category": {
        "id": "category-uuid",
        "name": "Electronics"
      },
      "seller": {
        "id": "seller-uuid", 
        "username": "seller123"
      },
      "created_at": "2023-12-01T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "per_page": 20,
  "total_pages": 3
}
```

#### GET /products/{product_id}
Get detailed product information.

**Response (200):**
```json
{
  "id": "product-uuid",
  "title": "Gaming Laptop",
  "description": "Detailed description...",
  "price": 899.99,
  "image_url": "https://example.com/image.jpg",
  "status": "available",
  "category": {
    "id": "category-uuid",
    "name": "Electronics",
    "description": "Electronic devices"
  },
  "seller": {
    "id": "seller-uuid",
    "username": "seller123",
    "email": "seller@example.com"
  },
  "created_at": "2023-12-01T10:00:00Z",
  "updated_at": "2023-12-01T10:00:00Z"
}
```

#### POST /products
Create a new product listing.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Gaming Laptop",
  "description": "High-performance gaming laptop with RTX 4060",
  "price": 899.99,
  "category_id": "electronics-uuid",
  "image_url": "https://example.com/image.jpg",
  "status": "available"
}
```

**Response (201):**
```json
{
  "id": "new-product-uuid",
  "title": "Gaming Laptop", 
  "description": "High-performance gaming laptop with RTX 4060",
  "price": 899.99,
  "image_url": "https://example.com/image.jpg",
  "status": "available",
  "seller_id": "current-user-uuid",
  "category_id": "electronics-uuid",
  "created_at": "2023-12-01T10:00:00Z"
}
```

#### PUT /products/{product_id}
Update a product (owner only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as POST (all fields optional)

**Response (200):** Updated product data

#### DELETE /products/{product_id}
Delete a product (owner only).

**Headers:** `Authorization: Bearer <token>`

**Response (204):** No content

### Category Endpoints

#### GET /categories
List all product categories.

**Query Parameters:**
- `include_count` (bool): Include product count per category

**Response (200):**
```json
{
  "categories": [
    {
      "id": "electronics-uuid",
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "product_count": 25,  // Only if include_count=true
      "created_at": "2023-12-01T10:00:00Z"
    }
  ],
  "total": 10
}
```

#### GET /categories/{category_id}/products
Get products in a specific category.

**Query Parameters:** Same as `/products` endpoint

**Response (200):** Same format as `/products`

### File Upload Endpoints

#### POST /uploads/image
Upload an image file.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:**
```
file: <image_file>  // PNG, JPG, JPEG, WebP (max 5MB)
```

**Response (201):**
```json
{
  "url": "https://example.com/uploads/optimized-image.jpg",
  "filename": "optimized-image.jpg",
  "size": 1024000,
  "mime_type": "image/jpeg"
}
```

### Health Check Endpoints

#### GET /
API information and status.

**Response (200):**
```json
{
  "message": "Welcome to Student Marketplace API",
  "version": "1.0.0",
  "documentation": {
    "swagger_ui": "/docs",
    "redoc": "/redoc"
  },
  "endpoints": { ... },
  "features": [ ... ]
}
```

#### GET /health
Health check and database connectivity.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": 1701432000.123,
  "version": "1.0.0",
  "database": "healthy",
  "environment": "development"
}
```

## Error Codes

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Custom Error Codes
- `AUTH_001` - Invalid credentials
- `AUTH_002` - Token expired
- `AUTH_003` - Token invalid
- `PROD_001` - Product not found
- `PROD_002` - Access denied to product
- `CAT_001` - Category not found
- `FILE_001` - File too large
- `FILE_002` - Invalid file type
- `RATE_001` - Rate limit exceeded

## Security Features

### Input Validation
- All inputs are validated and sanitized
- SQL injection protection
- XSS attack prevention
- File upload security (type and size validation)

### Authentication Security
- JWT tokens with expiration
- Password hashing with bcrypt
- Secure token generation
- Protected route enforcement

### Rate Limiting
- IP-based rate limiting
- Endpoint-specific limits
- Redis-based distributed limiting
- Automatic cleanup and reset

### Security Headers
- Content Security Policy (CSP)
- X-XSS-Protection
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy

## Performance Optimizations

### Database Optimizations
- Composite indexes on frequently queried fields
- Query optimization with eager loading
- Connection pooling
- Slow query monitoring

### Caching
- Redis-based response caching
- In-memory fallback caching
- Automatic cache invalidation
- TTL-based expiration

### API Optimizations
- Pagination for large datasets
- Field filtering to reduce payload size
- Gzip compression
- CDN integration for static assets

## Development Tools

### API Documentation
- **Swagger UI**: `/docs` - Interactive API documentation
- **ReDoc**: `/redoc` - Alternative documentation interface
- **OpenAPI Schema**: `/openapi.json` - Machine-readable API specification

### Testing
- Comprehensive test suite with pytest
- Security testing for vulnerabilities
- Performance testing for optimization
- Integration testing for workflows

### Monitoring
- Request/response logging
- Performance metrics tracking
- Error monitoring and alerting
- Health check endpoints

## SDKs and Client Libraries

### JavaScript/TypeScript
```typescript
import { StudentMarketplaceAPI } from '@student-marketplace/api-client';

const api = new StudentMarketplaceAPI({
  baseURL: 'http://localhost:8000',
  apiKey: 'your-jwt-token'
});

// List products
const products = await api.products.list({
  page: 1,
  search: 'laptop',
  category: 'electronics'
});

// Create product
const newProduct = await api.products.create({
  title: 'Gaming Laptop',
  price: 899.99,
  categoryId: 'electronics-id'
});
```

### Python
```python
from student_marketplace_client import APIClient

client = APIClient(
    base_url="http://localhost:8000",
    token="your-jwt-token"
)

# List products
products = client.products.list(
    page=1,
    search="laptop",
    category_id="electronics-id"
)

# Create product
new_product = client.products.create(
    title="Gaming Laptop",
    price=899.99,
    category_id="electronics-id"
)
```

## API Versioning

The API uses semantic versioning (semver) with the following strategy:

- **Major Version** (v1, v2): Breaking changes
- **Minor Version** (v1.1, v1.2): New features, backward compatible
- **Patch Version** (v1.1.1, v1.1.2): Bug fixes

Version information is included in:
- API responses (`version` field)
- HTTP headers (`X-API-Version`)
- Documentation URLs (`/v1/docs`)

## Support and Resources

### Documentation
- **API Docs**: `/docs` (Swagger UI)
- **Alternative Docs**: `/redoc` (ReDoc)
- **GitHub**: https://github.com/PuvadonKub/Vibe_Coding_Workshop

### Support
- **Email**: support@studentmarketplace.com
- **Issues**: GitHub Issues
- **Discord**: Community Discord Server

### Legal
- **Terms of Service**: https://studentmarketplace.com/terms
- **Privacy Policy**: https://studentmarketplace.com/privacy  
- **License**: MIT License

---

*This documentation is automatically generated and kept in sync with the API implementation.*