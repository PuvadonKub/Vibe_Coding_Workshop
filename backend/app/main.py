import os
import logging
from fastapi import FastAPI, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
try:
    from slowapi.errors import RateLimitExceeded
    SLOWAPI_AVAILABLE = True
except ImportError:
    RateLimitExceeded = None
    SLOWAPI_AVAILABLE = False

from app.routers import auth, users, products, categories, uploads
from app.utils.security import apply_security_headers, SecurityMiddleware

# Import rate limiting only if available
if SLOWAPI_AVAILABLE:
    from app.utils.rate_limiting import setup_rate_limiting, limiter, APIRateLimits

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application with enhanced security and comprehensive documentation
app = FastAPI(
    title="Student Marketplace API",
    description="""
    A comprehensive REST API for the Student Marketplace platform.
    
    This API provides endpoints for:
    - User authentication and management
    - Product listings and management
    - Category management
    - File uploads and image processing
    - Search and filtering capabilities
    
    ## Authentication
    This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
    `Authorization: Bearer <your_token_here>`
    
    ## Rate Limiting
    API endpoints are rate-limited to prevent abuse. Check response headers for limit information.
    
    ## Security
    All inputs are validated and sanitized. The API includes protection against:
    - SQL injection
    - XSS attacks
    - CSRF attacks
    - Rate limiting for DoS protection
    """,
    version="1.0.0",
    contact={
        "name": "Student Marketplace Team",
        "url": "https://github.com/PuvadonKub/Vibe_Coding_Workshop",
        "email": "support@studentmarketplace.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    terms_of_service="https://studentmarketplace.com/terms",
    docs_url="/docs" if os.getenv("ENVIRONMENT", "development") == "development" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT", "development") == "development" else None,
    openapi_tags=[
        {
            "name": "Authentication",
            "description": "User authentication endpoints including registration, login, and token management.",
        },
        {
            "name": "Users",
            "description": "User profile management and account operations.",
        },
        {
            "name": "Products",
            "description": "Product management including CRUD operations, search, and filtering.",
        },
        {
            "name": "Categories",
            "description": "Product category management and listing.",
        },
        {
            "name": "Uploads",
            "description": "File upload endpoints for images and other media.",
        },
        {
            "name": "Health",
            "description": "API health check and status endpoints.",
        },
    ],
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.example.com"]  # Configure for production
)

# Enhanced CORS configuration
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:8080", 
    "http://localhost:8081",
    "https://localhost:5173",
]

# Add production origins if configured
if production_origin := os.getenv("PRODUCTION_ORIGIN"):
    allowed_origins.append(production_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Mx-ReqToken",
        "Keep-Alive",
        "X-Requested-With",
        "If-Modified-Since",
    ],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
)

# Setup rate limiting if available
if SLOWAPI_AVAILABLE:
    try:
        setup_rate_limiting(app)
        logger.info("Rate limiting enabled")
    except Exception as e:
        logger.warning(f"Rate limiting setup failed: {e}")
else:
    logger.info("Rate limiting not available - slowapi not installed")

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    return apply_security_headers(response)

# Request size validation middleware
@app.middleware("http")
async def validate_request_size(request: Request, call_next):
    """Validate request size to prevent DoS attacks"""
    content_length = request.headers.get("content-length")
    if content_length:
        SecurityMiddleware.validate_request_size(int(content_length))
    
    response = await call_next(request)
    return response

# Rate limit exceeded handler (only if slowapi is available)
if SLOWAPI_AVAILABLE and RateLimitExceeded:
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc):
        """Custom rate limit exceeded handler"""
        logger.warning(f"Rate limit exceeded for {request.client.host}")
        
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "detail": "Too many requests. Please try again later.",
            },
            headers={"Retry-After": "60"}
        )

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(uploads.router)

@app.get("/", tags=["Health"], summary="API Root", 
         description="Get basic API information and available endpoints")
async def root():
    """
    Welcome endpoint providing basic API information.
    
    Returns:
        dict: Basic API information including version, documentation links, and available endpoints
    """
    return {
        "message": "Welcome to Student Marketplace API",
        "version": "1.0.0",
        "description": "A secure marketplace API for students to buy and sell items",
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json"
        },
        "endpoints": {
            "authentication": "/auth",
            "users": "/users", 
            "products": "/products",
            "categories": "/categories",
            "uploads": "/uploads",
            "health": "/health"
        },
        "features": [
            "JWT Authentication",
            "Rate Limiting", 
            "Input Validation",
            "Image Upload",
            "Advanced Search",
            "Security Hardening"
        ]
    }

@app.get("/health", tags=["Health"], summary="Health Check",
         description="Check API health and database connectivity")
async def health_check():
    """
    Health check endpoint to verify API and database status.
    
    Returns:
        dict: Health status information
    """
    import time
    from app.database import get_db
    
    try:
        # Check database connectivity
        db = next(get_db())
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": time.time(),
        "version": "1.0.0",
        "database": db_status,
        "environment": os.getenv("ENVIRONMENT", "development"),
        "uptime": "API is running"
    }

@app.get("/api/info", tags=["Health"], summary="API Information",
         description="Get detailed API information and statistics")  
async def api_info():
    """
    Detailed API information endpoint.
    
    Returns:
        dict: Comprehensive API information
    """
    return {
        "api": {
            "name": "Student Marketplace API",
            "version": "1.0.0", 
            "description": "A secure marketplace API for students",
            "environment": os.getenv("ENVIRONMENT", "development")
        },
        "security": {
            "authentication": "JWT Bearer Token",
            "rate_limiting": SLOWAPI_AVAILABLE,
            "input_validation": True,
            "cors_enabled": True,
            "security_headers": True
        },
        "features": {
            "user_management": True,
            "product_management": True, 
            "category_management": True,
            "file_uploads": True,
            "search_filtering": True,
            "image_optimization": True
        }
    }
