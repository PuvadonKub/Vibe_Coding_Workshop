#!/usr/bin/env python3
"""
Test authentication endpoints
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    try:
        # Test root endpoint
        print("🧪 Testing root endpoint...")
        response = requests.get(f"{BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        print()
        
        # Test user registration
        print("🧪 Testing user registration...")
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        print()
        
        # Test user login
        print("🧪 Testing user login...")
        login_data = {
            "username": "testuser",
            "password": "testpassword123"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Status Code: {response.status_code}")
        login_response = response.json()
        print(f"Response: {login_response}")
        
        if response.status_code == 200:
            token = login_response.get("access_token")
            if token:
                print("✅ Successfully obtained JWT token!")
                
                # Test protected endpoint
                print("🧪 Testing protected endpoint...")
                headers = {"Authorization": f"Bearer {token}"}
                response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
                print(f"Status Code: {response.status_code}")
                print(f"Response: {response.json()}")
                
        print("✅ All authentication tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the server. Make sure it's running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api()