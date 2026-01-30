#!/usr/bin/env python3
"""
Test all main API endpoints and print errors if any
"""
import httpx
import asyncio

async def test_all():
    base = "http://127.0.0.1:8000"
    endpoints = [
        ("GET", "/"),
        ("GET", "/healthz"),
        ("GET", "/api/v1/users"),
        ("GET", "/api/v1/videos"),
        ("GET", "/api/v1/comments"),
        ("POST", "/api/v1/auth/login"),
        ("POST", "/api/v1/auth/register"),
    ]
    async with httpx.AsyncClient() as client:
        for method, path in endpoints:
            url = base + path
            print(f"\nTesting {method} {url}")
            try:
                if method == "GET":
                    resp = await client.get(url)
                elif method == "POST":
                    # Dummy data for login/register
                    if "login" in path:
                        data = {"username": "test@example.com", "password": "testpass123"}
                    elif "register" in path:
                        data = {"email": "test@example.com", "password": "testpass123", "first_name": "Test", "last_name": "User"}
                    else:
                        data = {}
                    resp = await client.post(url, data=data)
                else:
                    continue
                print(f"Status: {resp.status_code}")
                try:
                    print("Response:", resp.json())
                except Exception:
                    print("Response:", resp.text)
                if resp.status_code >= 400:
                    print(f"ERROR: {resp.status_code} {resp.text}")
            except Exception as e:
                print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_all())
