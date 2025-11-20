#!/usr/bin/env python3
"""
Launch the Student Marketplace API server
"""
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def start_server():
    """Start the FastAPI server"""
    try:
        logger.info("Starting Student Marketplace API server...")
        
        # Import and validate the app
        from app.main import app
        logger.info("✅ FastAPI app loaded successfully")
        
        # Start the server
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
            log_level="debug"
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    start_server()