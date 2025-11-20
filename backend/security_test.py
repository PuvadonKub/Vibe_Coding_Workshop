"""
Comprehensive security testing script for the Student Marketplace API
"""
import requests
import json
import time
import sys
from urllib.parse import urljoin
import subprocess

class SecurityTester:
    """Security testing utility for API endpoints"""
    
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": [],
            "warnings": []
        }
    
    def log_result(self, test_name, passed, message=""):
        """Log test result"""
        if passed:
            self.results["passed"] += 1
            print(f"✅ {test_name}: PASSED")
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
            print(f"❌ {test_name}: FAILED - {message}")
    
    def log_warning(self, test_name, message):
        """Log warning"""
        self.results["warnings"].append(f"{test_name}: {message}")
        print(f"⚠️  {test_name}: WARNING - {message}")
    
    def test_sql_injection(self):
        """Test SQL injection protection"""
        print("\n🔍 Testing SQL Injection Protection...")
        
        payloads = [
            "admin'; DROP TABLE users; --",
            "' OR '1'='1",
            "' UNION SELECT * FROM users --",
            "'; INSERT INTO users VALUES ('hacker', 'hack@evil.com'); --"
        ]
        
        for payload in payloads:
            try:
                response = self.session.post(
                    urljoin(self.base_url, "/auth/register"),
                    json={
                        "username": payload,
                        "email": "test@example.com",
                        "password": "SecurePass123!"
                    },
                    timeout=5
                )
                
                # Should be rejected (400 or 422)
                self.log_result(
                    f"SQL Injection - {payload[:20]}...",
                    response.status_code in [400, 422],
                    f"Status: {response.status_code}"
                )
                
            except Exception as e:
                self.log_result(
                    f"SQL Injection - {payload[:20]}...",
                    False,
                    f"Request failed: {e}"
                )
    
    def test_xss_protection(self):
        """Test XSS protection"""
        print("\n🔍 Testing XSS Protection...")
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
            "<svg onload=alert('XSS')>",
            "';alert('XSS');//"
        ]
        
        for payload in xss_payloads:
            try:
                response = self.session.post(
                    urljoin(self.base_url, "/auth/register"),
                    json={
                        "username": f"user{payload}",
                        "email": "test@example.com",
                        "password": "SecurePass123!"
                    },
                    timeout=5
                )
                
                # Should be rejected or sanitized
                passed = response.status_code in [400, 422]
                if response.status_code == 201:
                    # Check if content was sanitized
                    response_data = response.json()
                    passed = "<script>" not in str(response_data) and "javascript:" not in str(response_data)
                
                self.log_result(
                    f"XSS Protection - {payload[:20]}...",
                    passed,
                    f"Status: {response.status_code}"
                )
                
            except Exception as e:
                self.log_result(
                    f"XSS Protection - {payload[:20]}...",
                    False,
                    f"Request failed: {e}"
                )
    
    def test_authentication_bypass(self):
        """Test authentication bypass attempts"""
        print("\n🔍 Testing Authentication Bypass...")
        
        protected_endpoints = [
            ("/users/me", "GET"),
            ("/products/", "POST"),
        ]
        
        for endpoint, method in protected_endpoints:
            try:
                if method == "GET":
                    response = self.session.get(urljoin(self.base_url, endpoint), timeout=5)
                else:
                    response = self.session.post(
                        urljoin(self.base_url, endpoint),
                        json={"test": "data"},
                        timeout=5
                    )
                
                self.log_result(
                    f"Auth Required - {method} {endpoint}",
                    response.status_code == 401,
                    f"Status: {response.status_code}"
                )
                
            except Exception as e:
                self.log_result(
                    f"Auth Required - {method} {endpoint}",
                    False,
                    f"Request failed: {e}"
                )
    
    def test_rate_limiting(self):
        """Test rate limiting"""
        print("\n🔍 Testing Rate Limiting...")
        
        # Test rapid requests to login endpoint
        rate_limited = False
        
        for i in range(20):
            try:
                response = self.session.post(
                    urljoin(self.base_url, "/auth/login"),
                    data={
                        "username": "nonexistent",
                        "password": "wrongpass"
                    },
                    timeout=2
                )
                
                if response.status_code == 429:
                    rate_limited = True
                    break
                    
                time.sleep(0.1)  # Small delay
                
            except Exception as e:
                break
        
        if rate_limited:
            self.log_result("Rate Limiting", True, "Rate limit triggered successfully")
        else:
            self.log_warning("Rate Limiting", "No rate limiting detected - may not be implemented")
    
    def test_security_headers(self):
        """Test security headers"""
        print("\n🔍 Testing Security Headers...")
        
        try:
            response = self.session.get(urljoin(self.base_url, "/"), timeout=5)
            
            required_headers = {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": ["DENY", "SAMEORIGIN"],
                "X-XSS-Protection": "1; mode=block"
            }
            
            for header, expected_value in required_headers.items():
                actual_value = response.headers.get(header, "")
                
                if isinstance(expected_value, list):
                    passed = actual_value in expected_value
                else:
                    passed = actual_value == expected_value
                
                self.log_result(
                    f"Security Header - {header}",
                    passed,
                    f"Expected: {expected_value}, Got: {actual_value}"
                )
                
        except Exception as e:
            self.log_result("Security Headers", False, f"Request failed: {e}")
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        print("\n🔍 Testing CORS Configuration...")
        
        # Test preflight request
        try:
            response = self.session.options(
                urljoin(self.base_url, "/auth/login"),
                headers={
                    "Origin": "http://evil-site.com",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type",
                },
                timeout=5
            )
            
            # Should not allow arbitrary origins
            allowed_origin = response.headers.get("Access-Control-Allow-Origin", "")
            
            self.log_result(
                "CORS - Origin Validation",
                allowed_origin != "*" and "evil-site.com" not in allowed_origin,
                f"Allowed origin: {allowed_origin}"
            )
            
        except Exception as e:
            self.log_result("CORS Configuration", False, f"Request failed: {e}")
    
    def test_file_upload_security(self):
        """Test file upload security"""
        print("\n🔍 Testing File Upload Security...")
        
        # First, try to create a user and get token
        try:
            # Register user
            register_response = self.session.post(
                urljoin(self.base_url, "/auth/register"),
                json={
                    "username": "securitytest",
                    "email": "security@test.com",
                    "password": "SecurePass123!"
                },
                timeout=5
            )
            
            if register_response.status_code != 201:
                self.log_warning("File Upload Security", "Could not create test user")
                return
            
            # Login
            login_response = self.session.post(
                urljoin(self.base_url, "/auth/login"),
                data={
                    "username": "securitytest",
                    "password": "SecurePass123!"
                },
                timeout=5
            )
            
            if login_response.status_code != 200:
                self.log_warning("File Upload Security", "Could not login test user")
                return
                
            token = login_response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test malicious file upload
            malicious_files = [
                ("malware.exe", b"MZ\x90\x00\x03", "application/x-executable"),
                ("script.php", b"<?php system($_GET['cmd']); ?>", "application/x-php"),
            ]
            
            for filename, content, mime_type in malicious_files:
                try:
                    response = self.session.post(
                        urljoin(self.base_url, "/upload/image"),
                        files={"file": (filename, content, mime_type)},
                        headers=headers,
                        timeout=5
                    )
                    
                    self.log_result(
                        f"File Upload - {filename}",
                        response.status_code in [400, 415, 422],
                        f"Status: {response.status_code}"
                    )
                    
                except Exception as e:
                    self.log_result(
                        f"File Upload - {filename}",
                        False,
                        f"Request failed: {e}"
                    )
                    
        except Exception as e:
            self.log_warning("File Upload Security", f"Test setup failed: {e}")
    
    def test_password_policy(self):
        """Test password policy enforcement"""
        print("\n🔍 Testing Password Policy...")
        
        weak_passwords = [
            "password",
            "12345678",
            "Password",
            "password123",
            "PASSWORD123",
            "Pass123"  # Missing special character
        ]
        
        for weak_password in weak_passwords:
            try:
                response = self.session.post(
                    urljoin(self.base_url, "/auth/register"),
                    json={
                        "username": f"user_{hash(weak_password)}",
                        "email": f"test_{hash(weak_password)}@example.com",
                        "password": weak_password
                    },
                    timeout=5
                )
                
                self.log_result(
                    f"Password Policy - {weak_password}",
                    response.status_code in [400, 422],
                    f"Status: {response.status_code}"
                )
                
            except Exception as e:
                self.log_result(
                    f"Password Policy - {weak_password}",
                    False,
                    f"Request failed: {e}"
                )
    
    def run_all_tests(self):
        """Run all security tests"""
        print("🚨 Starting Security Test Suite for Student Marketplace API")
        print(f"Target: {self.base_url}")
        print("="*60)
        
        # Check if API is accessible
        try:
            response = self.session.get(self.base_url, timeout=5)
            if response.status_code != 200:
                print(f"❌ API not accessible at {self.base_url}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to API: {e}")
            return False
        
        print("✅ API is accessible")
        
        # Run all tests
        self.test_sql_injection()
        self.test_xss_protection()
        self.test_authentication_bypass()
        self.test_rate_limiting()
        self.test_security_headers()
        self.test_cors_configuration()
        self.test_file_upload_security()
        self.test_password_policy()
        
        # Print summary
        print("\n" + "="*60)
        print("🎯 SECURITY TEST SUMMARY")
        print("="*60)
        print(f"✅ Tests Passed: {self.results['passed']}")
        print(f"❌ Tests Failed: {self.results['failed']}")
        print(f"⚠️  Warnings: {len(self.results['warnings'])}")
        
        if self.results['errors']:
            print("\n❌ FAILURES:")
            for error in self.results['errors']:
                print(f"   - {error}")
        
        if self.results['warnings']:
            print("\n⚠️  WARNINGS:")
            for warning in self.results['warnings']:
                print(f"   - {warning}")
        
        if self.results['failed'] == 0:
            print("\n🎉 All security tests passed!")
            return True
        else:
            print(f"\n🚨 {self.results['failed']} security issues detected!")
            return False

def main():
    """Main function to run security tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Security Testing for Student Marketplace API")
    parser.add_argument("--url", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    tester = SecurityTester(args.url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()