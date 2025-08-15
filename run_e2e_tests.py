#!/usr/bin/env python3
"""
Simple E2E Test Runner for MCP Orchestrator API
Run with: python run_e2e_tests.py
"""

import asyncio
import httpx
import json
import sys
from datetime import datetime
from typing import Dict, List, Any


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


class MCPTestRunner:
    """Simple test runner for MCP Orchestrator API"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.Client(base_url=base_url, timeout=10.0)
        self.passed = 0
        self.failed = 0
        self.context7_server_id = None
    
    def print_header(self, text: str):
        """Print section header"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    
    def print_test(self, name: str, passed: bool, details: str = ""):
        """Print test result"""
        if passed:
            status = f"{Colors.GREEN}✓ PASS{Colors.RESET}"
            self.passed += 1
        else:
            status = f"{Colors.RED}✗ FAIL{Colors.RESET}"
            self.failed += 1
        
        print(f"  {status} - {name}")
        if details and not passed:
            print(f"        {Colors.YELLOW}{details}{Colors.RESET}")
    
    def test_health(self) -> bool:
        """Test health endpoint"""
        try:
            response = self.client.get("/health")
            data = response.json()
            return (response.status_code == 200 and 
                   data.get("status") == "healthy")
        except Exception as e:
            return False
    
    def test_root(self) -> bool:
        """Test root endpoint"""
        try:
            response = self.client.get("/")
            data = response.json()
            return (response.status_code == 200 and 
                   "MCP Orchestrator API" in data.get("message", ""))
        except:
            return False
    
    def test_discover(self) -> List[Dict]:
        """Test discovery endpoint"""
        try:
            response = self.client.post("/api/discover", json={
                "query": "mcp context protocol",
                "limit": 3
            })
            if response.status_code == 200:
                return response.json()
            return []
        except:
            return []
    
    def test_register_context7(self) -> str:
        """Test registering Context7 server"""
        try:
            response = self.client.post("/api/register", json={
                "name": "context7-e2e-test",
                "endpoint": "http://localhost:3700",
                "github_url": "https://github.com/upstash/context7"
            })
            if response.status_code == 200:
                server = response.json()
                return server.get("id")
            return None
        except:
            return None
    
    def test_list_servers(self) -> bool:
        """Test listing servers"""
        try:
            response = self.client.get("/api/servers")
            return response.status_code == 200 and isinstance(response.json(), list)
        except:
            return False
    
    def test_get_server(self, server_id: str) -> bool:
        """Test getting specific server"""
        try:
            response = self.client.get(f"/api/servers/{server_id}")
            return response.status_code == 200
        except:
            return False
    
    def test_deploy(self) -> bool:
        """Test deployment endpoint"""
        try:
            response = self.client.post("/api/deploy", json={
                "github_url": "https://github.com/test/fake-repo",
                "method": "auto"
            })
            return response.status_code == 200
        except:
            return False
    
    async def test_orchestrate(self, server_id: str) -> bool:
        """Test orchestration endpoint"""
        try:
            async with httpx.AsyncClient(base_url=self.base_url, timeout=15.0) as client:
                response = await client.post("/api/orchestrate", json={
                    "server_id": server_id,
                    "prompt": "Test orchestration"
                })
                return response.status_code == 200
        except:
            return False
    
    async def test_orchestrate_stream(self, server_id: str) -> bool:
        """Test streaming orchestration"""
        try:
            events = []
            async with httpx.AsyncClient(base_url=self.base_url, timeout=15.0) as client:
                async with client.stream(
                    "POST",
                    "/api/orchestrate/stream",
                    json={"server_id": server_id, "prompt": "Test streaming"},
                    headers={"Accept": "text/event-stream"}
                ) as response:
                    if response.status_code != 200:
                        return False
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            try:
                                event = json.loads(line[6:])
                                events.append(event.get("event"))
                                if event.get("event") == "complete":
                                    break
                            except:
                                pass
            
            return "start" in events and ("complete" in events or "error" in events)
        except:
            return False
    
    async def test_invoke_tool(self, server_id: str) -> bool:
        """Test tool invocation"""
        try:
            async with httpx.AsyncClient(base_url=self.base_url, timeout=10.0) as client:
                response = await client.post("/api/invoke", json={
                    "server_id": server_id,
                    "tool_name": "test-tool",
                    "args": {}
                })
                # Tool might not exist, but endpoint should respond
                return response.status_code in [200, 404]
        except:
            return False
    
    def test_docs(self) -> bool:
        """Test documentation endpoints"""
        try:
            # Test Swagger docs
            response = self.client.get("/docs")
            if response.status_code != 200:
                return False
            
            # Test OpenAPI schema
            response = self.client.get("/openapi.json")
            if response.status_code != 200:
                return False
            
            schema = response.json()
            return "paths" in schema and "/api/orchestrate" in str(schema["paths"])
        except:
            return False
    
    async def run_all_tests(self):
        """Run all tests"""
        print(f"{Colors.BOLD}🚀 MCP Orchestrator API - End-to-End Tests{Colors.RESET}")
        print(f"Testing API at: {self.base_url}")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Basic Health Tests
        self.print_header("1. Basic Health & Info Tests")
        self.print_test("Health Check", self.test_health())
        self.print_test("Root Endpoint", self.test_root())
        self.print_test("Documentation Endpoints", self.test_docs())
        
        # Discovery Tests
        self.print_header("2. Discovery Tests")
        discovered = self.test_discover()
        self.print_test("Discover MCP Servers", len(discovered) > 0, 
                       f"Found {len(discovered)} servers")
        
        # Registration Tests
        self.print_header("3. Registration Tests")
        self.context7_server_id = self.test_register_context7()
        self.print_test("Register Context7 Server", self.context7_server_id is not None,
                       f"Server ID: {self.context7_server_id}")
        
        # Server Management Tests
        self.print_header("4. Server Management Tests")
        self.print_test("List All Servers", self.test_list_servers())
        
        if self.context7_server_id:
            self.print_test("Get Specific Server", 
                          self.test_get_server(self.context7_server_id))
        
        # Deployment Tests
        self.print_header("5. Deployment Tests")
        self.print_test("Deploy Server (Background)", self.test_deploy())
        
        # Orchestration Tests
        if self.context7_server_id:
            self.print_header("6. Orchestration Tests")
            
            orch_result = await self.test_orchestrate(self.context7_server_id)
            self.print_test("Basic Orchestration", orch_result)
            
            stream_result = await self.test_orchestrate_stream(self.context7_server_id)
            self.print_test("Streaming Orchestration (SSE)", stream_result)
            
            # Tool Invocation Tests
            self.print_header("7. Tool Invocation Tests")
            invoke_result = await self.test_invoke_tool(self.context7_server_id)
            self.print_test("Invoke Tool", invoke_result)
        else:
            print(f"{Colors.YELLOW}⚠ Skipping orchestration tests (no server registered){Colors.RESET}")
        
        # Summary
        self.print_header("Test Summary")
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        
        print(f"  Total Tests: {total}")
        print(f"  {Colors.GREEN}Passed: {self.passed}{Colors.RESET}")
        print(f"  {Colors.RED}Failed: {self.failed}{Colors.RESET}")
        print(f"  Success Rate: {success_rate:.1f}%")
        
        if self.failed == 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}✅ All tests passed!{Colors.RESET}")
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}❌ Some tests failed{Colors.RESET}")
        
        return self.failed == 0


async def main():
    """Main test execution"""
    # Check if API is running
    try:
        test_client = httpx.Client(base_url="http://localhost:8000", timeout=2.0)
        test_client.get("/health")
        test_client.close()
    except:
        print(f"{Colors.RED}❌ Error: API server is not running at http://localhost:8000{Colors.RESET}")
        print(f"{Colors.YELLOW}Please start the server with: uvicorn main:app --reload{Colors.RESET}")
        sys.exit(1)
    
    # Run tests
    runner = MCPTestRunner()
    success = await runner.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())