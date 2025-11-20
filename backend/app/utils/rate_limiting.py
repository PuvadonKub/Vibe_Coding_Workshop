"""
Rate limiting middleware for API endpoints
"""
import time
from typing import Dict, Optional, Callable, List
from fastapi import Request, HTTPException, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import logging
import redis
from functools import wraps

logger = logging.getLogger(__name__)

# Redis connection for distributed rate limiting
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=1, decode_responses=True)
    redis_client.ping()  # Test connection
    REDIS_AVAILABLE = True
    logger.info("Redis available for distributed rate limiting")
except (redis.ConnectionError, redis.RedisError):
    redis_client = None
    REDIS_AVAILABLE = False
    logger.info("Redis not available, using in-memory rate limiting")

class InMemoryRateLimiter:
    """In-memory rate limiter for single instance deployments"""
    
    def __init__(self):
        self._requests: Dict[str, List[float]] = {}
        self._cleanup_interval = 60  # Cleanup old entries every 60 seconds
        self._last_cleanup = time.time()
    
    def _cleanup_old_entries(self, window_seconds: int = 3600):
        """Remove old entries to prevent memory leaks"""
        current_time = time.time()
        
        if current_time - self._last_cleanup > self._cleanup_interval:
            cutoff_time = current_time - window_seconds
            
            for key in list(self._requests.keys()):
                self._requests[key] = [
                    timestamp for timestamp in self._requests[key]
                    if timestamp > cutoff_time
                ]
                
                # Remove empty entries
                if not self._requests[key]:
                    del self._requests[key]
            
            self._last_cleanup = current_time
    
    def is_allowed(self, key: str, limit: int, window_seconds: int = 60) -> bool:
        """Check if request is allowed based on rate limit"""
        current_time = time.time()
        self._cleanup_old_entries(window_seconds * 2)  # Cleanup with larger window
        
        if key not in self._requests:
            self._requests[key] = []
        
        # Remove old requests outside the window
        cutoff_time = current_time - window_seconds
        self._requests[key] = [
            timestamp for timestamp in self._requests[key]
            if timestamp > cutoff_time
        ]
        
        # Check if under limit
        if len(self._requests[key]) >= limit:
            return False
        
        # Add current request
        self._requests[key].append(current_time)
        return True
    
    def get_remaining_requests(self, key: str, limit: int, window_seconds: int = 60) -> int:
        """Get remaining requests in current window"""
        current_time = time.time()
        
        if key not in self._requests:
            return limit
        
        # Count requests in current window
        cutoff_time = current_time - window_seconds
        current_requests = len([
            timestamp for timestamp in self._requests[key]
            if timestamp > cutoff_time
        ])
        
        return max(0, limit - current_requests)

class DistributedRateLimiter:
    """Redis-based distributed rate limiter"""
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def is_allowed(self, key: str, limit: int, window_seconds: int = 60) -> bool:
        """Check if request is allowed using Redis sliding window"""
        try:
            current_time = time.time()
            cutoff_time = current_time - window_seconds
            
            # Use Redis pipeline for atomic operations
            pipe = self.redis.pipeline()
            
            # Remove old entries
            pipe.zremrangebyscore(key, 0, cutoff_time)
            
            # Count current entries
            pipe.zcard(key)
            
            # Add current request
            pipe.zadd(key, {str(current_time): current_time})
            
            # Set expiry
            pipe.expire(key, window_seconds * 2)
            
            results = pipe.execute()
            current_count = results[1]  # Count after cleanup
            
            return current_count < limit
            
        except redis.RedisError as e:
            logger.error(f"Redis rate limiting error: {e}")
            # Fall back to allowing request if Redis fails
            return True
    
    def get_remaining_requests(self, key: str, limit: int, window_seconds: int = 60) -> int:
        """Get remaining requests in current window"""
        try:
            current_time = time.time()
            cutoff_time = current_time - window_seconds
            
            # Clean up old entries and count current ones
            pipe = self.redis.pipeline()
            pipe.zremrangebyscore(key, 0, cutoff_time)
            pipe.zcard(key)
            results = pipe.execute()
            
            current_count = results[1]
            return max(0, limit - current_count)
            
        except redis.RedisError as e:
            logger.error(f"Redis rate limiting error: {e}")
            return limit  # Return full limit if Redis fails

# Global rate limiter instance
if REDIS_AVAILABLE:
    rate_limiter = DistributedRateLimiter(redis_client)
else:
    rate_limiter = InMemoryRateLimiter()

# SlowAPI limiter for FastAPI integration
def get_client_ip(request: Request) -> str:
    """Get client IP address for rate limiting"""
    # Check for real IP behind proxy
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        # Take the first IP in case of multiple proxies
        return forwarded_for.split(',')[0].strip()
    
    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip
    
    # Fallback to direct connection
    return get_remote_address(request)

limiter = Limiter(key_func=get_client_ip)

# Rate limiting decorators
def rate_limit(calls: int, period: int = 60, per: str = "minute"):
    """
    Rate limiting decorator
    
    Args:
        calls: Number of calls allowed
        period: Time period in seconds (default: 60 for per minute)
        per: Description of period (for error messages)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            client_ip = get_client_ip(request)
            key = f"rate_limit:{func.__name__}:{client_ip}"
            
            if not rate_limiter.is_allowed(key, calls, period):
                remaining = rate_limiter.get_remaining_requests(key, calls, period)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. {calls} requests per {per} allowed. "
                           f"Remaining: {remaining}",
                    headers={"Retry-After": str(period)}
                )
            
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator

# Specific rate limiters for different endpoints
class APIRateLimits:
    """Predefined rate limits for different API endpoints"""
    
    # Authentication endpoints (stricter limits)
    AUTH_REGISTER = "5/minute"  # 5 registrations per minute
    AUTH_LOGIN = "10/minute"    # 10 login attempts per minute
    
    # Product endpoints
    PRODUCT_CREATE = "20/hour"   # 20 product creations per hour
    PRODUCT_UPDATE = "50/hour"   # 50 product updates per hour
    PRODUCT_LIST = "100/minute"  # 100 product list requests per minute
    
    # Search endpoints
    SEARCH = "60/minute"         # 60 searches per minute
    
    # Upload endpoints
    FILE_UPLOAD = "10/hour"      # 10 file uploads per hour
    
    # General API
    GENERAL = "1000/hour"        # 1000 requests per hour for general endpoints

# Security rate limiting for suspicious activity
class SecurityRateLimiter:
    """Enhanced rate limiting for security-sensitive operations"""
    
    @staticmethod
    def check_suspicious_activity(request: Request, endpoint: str) -> bool:
        """Check for suspicious patterns that might indicate abuse"""
        client_ip = get_client_ip(request)
        user_agent = request.headers.get('User-Agent', '')
        
        # Check for missing or suspicious user agent
        if not user_agent or len(user_agent) < 10:
            logger.warning(f"Suspicious request from {client_ip}: Missing/short user agent")
            return True
        
        # Check for automated tools
        suspicious_agents = ['curl', 'wget', 'python-requests', 'bot', 'spider']
        if any(agent.lower() in user_agent.lower() for agent in suspicious_agents):
            logger.warning(f"Suspicious request from {client_ip}: Automated tool detected")
            return True
        
        return False
    
    @staticmethod
    def apply_security_rate_limit(request: Request, endpoint: str, limit: str):
        """Apply stricter rate limiting for suspicious requests"""
        client_ip = get_client_ip(request)
        
        if SecurityRateLimiter.check_suspicious_activity(request, endpoint):
            # Apply much stricter limits for suspicious activity
            key = f"security_limit:{endpoint}:{client_ip}"
            
            # Parse limit (e.g., "5/minute" -> 5 calls per 60 seconds)
            calls, period_str = limit.split('/')
            calls = int(calls)
            
            # Reduce allowed calls by 80% for suspicious requests
            security_calls = max(1, calls // 5)
            
            period_map = {"minute": 60, "hour": 3600, "day": 86400}
            period_seconds = period_map.get(period_str, 60)
            
            if not rate_limiter.is_allowed(key, security_calls, period_seconds):
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Security rate limit exceeded. Suspicious activity detected.",
                    headers={"Retry-After": str(period_seconds)}
                )

# Middleware setup function
def setup_rate_limiting(app):
    """Set up rate limiting middleware for FastAPI app"""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    
    logger.info("Rate limiting middleware configured")
    return app