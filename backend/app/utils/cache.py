"""
Caching layer for improved performance
"""
import json
import hashlib
from typing import Any, Optional, Dict, List, Callable, Union
from functools import wraps
import time
import logging
from datetime import datetime, timedelta

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

class InMemoryCache:
    """Simple in-memory cache implementation"""
    
    def __init__(self, default_ttl: int = 300):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
    
    def _is_expired(self, entry: Dict[str, Any]) -> bool:
        """Check if cache entry is expired"""
        return datetime.now() > entry['expires_at']
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key not in self._cache:
            return None
            
        entry = self._cache[key]
        if self._is_expired(entry):
            del self._cache[key]
            return None
            
        entry['hits'] += 1
        entry['last_accessed'] = datetime.now()
        return entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache"""
        ttl = ttl or self.default_ttl
        expires_at = datetime.now() + timedelta(seconds=ttl)
        
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': datetime.now(),
            'last_accessed': datetime.now(),
            'hits': 0,
            'ttl': ttl
        }
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def clear(self) -> None:
        """Clear all cache entries"""
        self._cache.clear()
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count removed"""
        expired_keys = [
            key for key, entry in self._cache.items()
            if self._is_expired(entry)
        ]
        
        for key in expired_keys:
            del self._cache[key]
            
        return len(expired_keys)
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_entries = len(self._cache)
        total_hits = sum(entry['hits'] for entry in self._cache.values())
        
        return {
            'total_entries': total_entries,
            'total_hits': total_hits,
            'memory_usage_estimate': len(str(self._cache)),
        }

class RedisCache:
    """Redis-based cache implementation"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0", default_ttl: int = 300):
        if not REDIS_AVAILABLE:
            raise ImportError("Redis not available. Install redis package.")
            
        self.redis_client = redis.from_url(redis_url)
        self.default_ttl = default_ttl
        
        try:
            self.redis_client.ping()
            logger.info("Redis connection established")
        except redis.ConnectionError:
            logger.error("Failed to connect to Redis")
            raise
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from Redis cache"""
        try:
            value = self.redis_client.get(key)
            if value is None:
                return None
            return json.loads(value)
        except (redis.RedisError, json.JSONDecodeError) as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in Redis cache"""
        try:
            ttl = ttl or self.default_ttl
            serialized_value = json.dumps(value, default=str)
            self.redis_client.setex(key, ttl, serialized_value)
        except (redis.RedisError, json.JSONEncodeError, TypeError) as e:
            logger.error(f"Cache set error for key {key}: {e}")
    
    def delete(self, key: str) -> bool:
        """Delete key from Redis cache"""
        try:
            result = self.redis_client.delete(key)
            return result > 0
        except redis.RedisError as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def clear(self) -> None:
        """Clear all cache entries"""
        try:
            self.redis_client.flushdb()
        except redis.RedisError as e:
            logger.error(f"Cache clear error: {e}")
    
    def stats(self) -> Dict[str, Any]:
        """Get Redis cache statistics"""
        try:
            info = self.redis_client.info()
            return {
                'total_entries': info.get('db0', {}).get('keys', 0),
                'memory_usage': info.get('used_memory_human', 'Unknown'),
                'hits': info.get('keyspace_hits', 0),
                'misses': info.get('keyspace_misses', 0),
            }
        except redis.RedisError as e:
            logger.error(f"Cache stats error: {e}")
            return {}

class CacheManager:
    """Unified cache manager with fallback support"""
    
    def __init__(self, redis_url: Optional[str] = None, use_redis: bool = True):
        self.backend = None
        
        if use_redis and redis_url and REDIS_AVAILABLE:
            try:
                self.backend = RedisCache(redis_url)
                logger.info("Using Redis cache backend")
            except Exception as e:
                logger.warning(f"Redis cache initialization failed: {e}")
                
        if self.backend is None:
            self.backend = InMemoryCache()
            logger.info("Using in-memory cache backend")
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from function arguments"""
        key_parts = [str(arg) for arg in args]
        key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
        key_string = f"{prefix}:{':'.join(key_parts)}"
        
        # Hash long keys to avoid Redis key length limits
        if len(key_string) > 250:
            key_hash = hashlib.md5(key_string.encode()).hexdigest()
            return f"{prefix}:hash:{key_hash}"
        
        return key_string
    
    def get(self, key: str) -> Optional[Any]:
        return self.backend.get(key)
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        return self.backend.set(key, value, ttl)
    
    def delete(self, key: str) -> bool:
        return self.backend.delete(key)
    
    def clear(self) -> None:
        return self.backend.clear()
    
    def stats(self) -> Dict[str, Any]:
        stats = self.backend.stats()
        stats['backend_type'] = type(self.backend).__name__
        return stats

# Global cache instance
cache_manager = CacheManager()

def cached(prefix: str, ttl: int = 300, skip_cache: bool = False):
    """
    Decorator for caching function results
    
    Args:
        prefix: Cache key prefix
        ttl: Time to live in seconds
        skip_cache: Skip cache for debugging
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            if skip_cache:
                return func(*args, **kwargs)
                
            # Generate cache key
            cache_key = cache_manager._generate_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_result = cache_manager.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for key: {cache_key}")
                return cached_result
            
            # Execute function and cache result
            logger.debug(f"Cache miss for key: {cache_key}")
            result = func(*args, **kwargs)
            
            # Only cache successful results (not None/empty)
            if result is not None:
                cache_manager.set(cache_key, result, ttl)
            
            return result
        
        # Add cache management methods to function
        wrapper.cache_clear = lambda: cache_manager.clear()
        wrapper.cache_delete = lambda *args, **kwargs: cache_manager.delete(
            cache_manager._generate_key(prefix, *args, **kwargs)
        )
        
        return wrapper
    return decorator

# Predefined cache decorators for common operations
def cache_products(ttl: int = 300):
    """Cache decorator for product queries"""
    return cached("products", ttl)

def cache_categories(ttl: int = 600):
    """Cache decorator for category queries (longer TTL as they change less)"""
    return cached("categories", ttl)

def cache_users(ttl: int = 900):
    """Cache decorator for user queries"""
    return cached("users", ttl)

def invalidate_product_cache(product_id: Optional[str] = None):
    """Invalidate product-related caches"""
    if product_id:
        # Clear specific product caches
        cache_manager.delete(f"products:{product_id}")
        cache_manager.delete(f"products:details:{product_id}")
    else:
        # Clear all product caches (brute force approach)
        # In a real system, you'd want to track cache keys more intelligently
        logger.info("Clearing all product caches")

def invalidate_user_cache(user_id: str):
    """Invalidate user-related caches"""
    cache_manager.delete(f"users:{user_id}")
    cache_manager.delete(f"users:products:{user_id}")

# Cache warming functions
def warm_cache():
    """Pre-populate cache with frequently accessed data"""
    logger.info("Starting cache warming process")
    # This would typically be called on application startup
    # or via a scheduled task
    pass