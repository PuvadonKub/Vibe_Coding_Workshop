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

# Create FastAPI application with enhanced security
app = FastAPI(
    title="Student Marketplace API",
    description="A secure marketplace API for students to buy and sell items",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT", "development") == "development" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT", "development") == "development" else None,
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

@app.get("/")
async def root():
    return {
        "message": "Welcome to Student Marketplace API",
        "version": "1.0.0",
        "docs": "/docs"
    }
