from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, users, products, categories, uploads

# Create FastAPI application
app = FastAPI(
    title="Student Marketplace API",
    description="A marketplace API for students to buy and sell items",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080", "http://localhost:8081"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
