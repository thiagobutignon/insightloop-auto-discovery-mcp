"""
Test script for MCP Orchestrator API
"""

import asyncio
import httpx
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

async def test_health():
    """Test health endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"Health Check: {response.json()}")
        return response.status_code == 200

async def test_discover():
    """Test discovery endpoint"""
    async with httpx.AsyncClient() as client:
        payload = {
            "query": "mcp context7",
            "limit": 5,
            "auto_deploy": False
        }
        response = await client.post(f"{BASE_URL}/api/discover", json=payload)
        print(f"\nDiscovered Servers: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200

async def test_deploy():
    """Test deploy endpoint"""
    async with httpx.AsyncClient() as client:
        payload = {
            "github_url": "https://github.com/upstash/context7",
            "method": "npx",
            "port": 3001
        }
        response = await client.post(f"{BASE_URL}/api/deploy", json=payload)
        print(f"\nDeploy Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200

async def test_list_servers():
    """Test list servers endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/servers")
        print(f"\nAll Servers: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200

async def test_orchestrate():
    """Test orchestration endpoint"""
    async with httpx.AsyncClient() as client:
        # First, get a server ID from the list
        servers_response = await client.get(f"{BASE_URL}/api/servers")
        servers = servers_response.json()
        
        if servers:
            server_id = servers[0]["id"]
            payload = {
                "server_id": server_id,
                "prompt": "List available documentation topics",
                "context": {}
            }
            response = await client.post(f"{BASE_URL}/api/orchestrate", json=payload)
            print(f"\nOrchestration Result: {json.dumps(response.json(), indent=2)}")
            return response.status_code == 200
        else:
            print("\nNo servers available for orchestration test")
            return False

async def run_tests():
    """Run all tests"""
    print("Starting MCP Orchestrator API Tests")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health),
        ("Discover Servers", test_discover),
        ("Deploy Server", test_deploy),
        ("List Servers", test_list_servers),
        ("Orchestrate Task", test_orchestrate),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            print(f"\nRunning: {name}")
            result = await test_func()
            results.append((name, "✅ PASSED" if result else "❌ FAILED"))
        except Exception as e:
            print(f"Error in {name}: {e}")
            results.append((name, f"❌ ERROR: {str(e)}"))
    
    print("\n" + "=" * 50)
    print("Test Results:")
    for name, result in results:
        print(f"  {name}: {result}")

if __name__ == "__main__":
    print("\nMake sure the API is running on http://localhost:8000")
    print("You can start it with: uvicorn main:app --reload\n")
    
    try:
        asyncio.run(run_tests())
    except KeyboardInterrupt:
        print("\nTests interrupted by user")
    except Exception as e:
        print(f"\nTest suite error: {e}")