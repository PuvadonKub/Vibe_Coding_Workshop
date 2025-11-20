"""
Input validation and sanitization utilities for security
"""
import re
import html
import bleach
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

class SecurityConfig:
    """Security configuration settings"""
    
    # Maximum lengths for various fields
    MAX_USERNAME_LENGTH = 50
    MAX_EMAIL_LENGTH = 100
    MAX_TITLE_LENGTH = 200
    MAX_DESCRIPTION_LENGTH = 2000
    MAX_CATEGORY_NAME_LENGTH = 50
    
    # Allowed HTML tags for rich text fields
    ALLOWED_HTML_TAGS = [
        'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'
    ]
    
    # Allowed HTML attributes
    ALLOWED_HTML_ATTRIBUTES = {}
    
    # SQL injection patterns to detect
    SQL_INJECTION_PATTERNS = [
        r"(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)",
        r"(--|\/\*|\*\/|;)",
        r"(\b(or|and)\s+\d+\s*=\s*\d+)",
        r"(\')(.*)(\')",
    ]
    
    # XSS patterns to detect
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"vbscript:",
        r"onload=",
        r"onerror=",
        r"onclick=",
    ]

class InputSanitizer:
    """Utility class for sanitizing user inputs"""
    
    @staticmethod
    def sanitize_html(text: str, allowed_tags: Optional[List[str]] = None) -> str:
        """
        Sanitize HTML content to prevent XSS attacks
        """
        if not text:
            return text
            
        allowed_tags = allowed_tags or SecurityConfig.ALLOWED_HTML_TAGS
        
        # Use bleach to clean HTML
        cleaned = bleach.clean(
            text,
            tags=allowed_tags,
            attributes=SecurityConfig.ALLOWED_HTML_ATTRIBUTES,
            strip=True
        )
        
        return cleaned
    
    @staticmethod
    def sanitize_text(text: str, max_length: Optional[int] = None) -> str:
        """
        Sanitize plain text input
        """
        if not text:
            return text
            
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Escape HTML entities
        text = html.escape(text)
        
        # Truncate if needed
        if max_length and len(text) > max_length:
            text = text[:max_length].strip()
            
        return text
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitize filename to prevent directory traversal
        """
        if not filename:
            return filename
            
        # Remove path separators and special characters
        filename = re.sub(r'[<>:"/\\|?*]', '', filename)
        filename = re.sub(r'\.\.+', '.', filename)
        
        # Remove leading/trailing dots and spaces
        filename = filename.strip('. ')
        
        # Ensure it's not empty after sanitization
        if not filename:
            filename = 'file'
            
        return filename
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """
        Validate email format
        """
        email_pattern = re.compile(
            r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        )
        return bool(email_pattern.match(email))
    
    @staticmethod
    def validate_username(username: str) -> bool:
        """
        Validate username format (alphanumeric + underscores)
        """
        username_pattern = re.compile(r'^[a-zA-Z0-9_]{3,50}$')
        return bool(username_pattern.match(username))

class SecurityValidator:
    """Security validation utilities"""
    
    @staticmethod
    def detect_sql_injection(text: str) -> bool:
        """
        Detect potential SQL injection attempts
        """
        if not text:
            return False
            
        text_lower = text.lower()
        
        for pattern in SecurityConfig.SQL_INJECTION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"Potential SQL injection detected: {pattern}")
                return True
                
        return False
    
    @staticmethod
    def detect_xss(text: str) -> bool:
        """
        Detect potential XSS attempts
        """
        if not text:
            return False
            
        text_lower = text.lower()
        
        for pattern in SecurityConfig.XSS_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"Potential XSS detected: {pattern}")
                return True
                
        return False
    
    @staticmethod
    def validate_input_security(text: str, field_name: str = "input") -> None:
        """
        Comprehensive security validation for text input
        """
        if SecurityValidator.detect_sql_injection(text):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid characters detected in {field_name}"
            )
            
        if SecurityValidator.detect_xss(text):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content detected in {field_name}"
            )

# Pydantic validators for common security checks
def validate_secure_text(v: str, field_name: str = "text") -> str:
    """
    Pydantic validator for secure text input
    """
    if not v:
        return v
        
    # Security validation
    SecurityValidator.validate_input_security(v, field_name)
    
    # Sanitize the text
    sanitized = InputSanitizer.sanitize_text(v)
    
    return sanitized

def validate_secure_html(v: str, field_name: str = "html") -> str:
    """
    Pydantic validator for secure HTML input
    """
    if not v:
        return v
        
    # Security validation
    SecurityValidator.validate_input_security(v, field_name)
    
    # Sanitize HTML
    sanitized = InputSanitizer.sanitize_html(v)
    
    return sanitized

# Enhanced Pydantic models with security validation
class SecureUserCreate(BaseModel):
    """Secure user creation model with validation"""
    username: str = Field(..., min_length=3, max_length=SecurityConfig.MAX_USERNAME_LENGTH)
    email: str = Field(..., max_length=SecurityConfig.MAX_EMAIL_LENGTH)
    password: str = Field(..., min_length=8)
    
    @validator('username')
    def validate_username(cls, v):
        if not InputSanitizer.validate_username(v):
            raise ValueError('Username must contain only letters, numbers, and underscores')
        return validate_secure_text(v, "username")
    
    @validator('email')
    def validate_email(cls, v):
        if not InputSanitizer.validate_email(v):
            raise ValueError('Invalid email format')
        return validate_secure_text(v, "email")
    
    @validator('password')
    def validate_password(cls, v):
        # Password strength validation
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        
        return v

class SecureProductCreate(BaseModel):
    """Secure product creation model with validation"""
    title: str = Field(..., min_length=1, max_length=SecurityConfig.MAX_TITLE_LENGTH)
    description: Optional[str] = Field(None, max_length=SecurityConfig.MAX_DESCRIPTION_LENGTH)
    price: float = Field(..., ge=0, le=999999.99)
    category_id: str
    
    @validator('title')
    def validate_title(cls, v):
        return validate_secure_text(v, "title")
    
    @validator('description')
    def validate_description(cls, v):
        if v is None:
            return v
        return validate_secure_html(v, "description")
    
    @validator('category_id')
    def validate_category_id(cls, v):
        # Validate UUID format
        if not re.match(r'^[a-f0-9-]{36}$', v):
            raise ValueError('Invalid category ID format')
        return v

class SecurityMiddleware:
    """Security middleware for request validation"""
    
    @staticmethod
    def validate_request_size(content_length: int, max_size: int = 10 * 1024 * 1024):
        """
        Validate request size to prevent DoS attacks
        """
        if content_length > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Request too large. Maximum size: {max_size} bytes"
            )
    
    @staticmethod
    def validate_user_agent(user_agent: str) -> bool:
        """
        Basic user agent validation
        """
        if not user_agent or len(user_agent) > 512:
            return False
            
        # Block common bot patterns (basic implementation)
        blocked_patterns = ['bot', 'crawler', 'spider', 'scraper']
        user_agent_lower = user_agent.lower()
        
        return not any(pattern in user_agent_lower for pattern in blocked_patterns)

# Content Security Policy headers
CSP_HEADERS = {
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none';"
    ),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}

def apply_security_headers(response):
    """
    Apply security headers to response
    """
    for header, value in CSP_HEADERS.items():
        response.headers[header] = value
    return response