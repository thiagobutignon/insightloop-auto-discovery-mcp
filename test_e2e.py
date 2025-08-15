"""
End-to-End Tests for MCP Orchestrator API

This test suite covers all API endpoints and workflows using Context7 as the reference MCP server.
Run these tests with: pytest test_e2e.py -v

Prerequisites:
    - API server running on localhost:8000
    - Context7 or another MCP server available for testing
    - Environment variables configured (.env file)
"""

import asyncio
import json
import pytest
import httpx
import os
from typing import Dict, Any, List
from datetime import datetime
import time


# Test configuration
BASE_URL = "http://localhost:8000"
CONTEXT7_PORT = 3700  # Default Context7 port

# Test data
TEST_GITHUB_REPOS = [
    "https://github.com/modelcontextprotocol/context7",
    "https://github.com/GLips/Figma-Context-MCP",
    "https://github.com/microsoft/mcp-for-beginners"
]


class TestMCPOrchestratorAPI:
    """End-to-end tests for MCP Orchestrator API"""
    
    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        cls.client = httpx.Client(base_url=BASE_URL, timeout=30.0)
        cls.async_client = httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)
        cls.registered_servers = []
        cls.discovered_servers = []
    
    @classmethod
    def teardown_class(cls):
        """Cleanup after tests"""
        cls.client.close()
        asyncio.run(cls.async_client.aclose())
    
    # ============= Health & Info Tests =============
    
    def test_health_check(self):
        """Test GET /health endpoint"""
        response = self.client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        assert "servers_registered" in data
        assert isinstance(data["servers_registered"], int)
    
    def test_root_endpoint(self):
        """Test GET / endpoint"""
        response = self.client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "MCP Orchestrator API"
        assert "endpoints" in data
        
        expected_endpoints = ["discovery", "deploy", "servers", "orchestrate", "docs"]
        for endpoint in expected_endpoints:
            assert endpoint in data["endpoints"]
    
    def test_openapi_schema(self):
        """Test GET /openapi.json endpoint"""
        response = self.client.get("/openapi.json")
        assert response.status_code == 200
        
        schema = response.json()
        assert schema["info"]["title"] == "MCP Orchestrator API"
        assert "paths" in schema
        
        # Verify all endpoints are documented
        expected_paths = [
            "/health", "/", "/api/discover", "/api/register",
            "/api/deploy", "/api/servers", "/api/orchestrate"
        ]
        for path in expected_paths:
            assert any(path in p for p in schema["paths"].keys())
    
    def test_swagger_docs(self):
        """Test GET /docs endpoint"""
        response = self.client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
    
    # ============= Discovery Tests =============
    
    def test_discover_servers(self):
        """Test POST /api/discover endpoint"""
        payload = {
            "query": "mcp model context protocol",
            "limit": 5,
            "auto_deploy": False
        }
        
        response = self.client.post("/api/discover", json=payload)
        assert response.status_code == 200
        
        servers = response.json()
        assert isinstance(servers, list)
        assert len(servers) <= 5
        
        # Store for later tests
        self.__class__.discovered_servers = servers
        
        # Validate server structure
        if servers:
            server = servers[0]
            assert "id" in server
            assert "name" in server
            assert "github_url" in server
            assert "status" in server
            assert server["status"] in ["discovered", "deployed", "failed"]
    
    def test_discover_with_specific_query(self):
        """Test discovery with specific search terms"""
        payload = {
            "query": "context7",
            "limit": 3
        }
        
        response = self.client.post("/api/discover", json=payload)
        assert response.status_code == 200
        
        servers = response.json()
        assert isinstance(servers, list)
        
        # Check if any results contain context7 related repos
        has_relevant = any("context" in s.get("name", "").lower() or 
                          "context" in s.get("github_url", "").lower() 
                          for s in servers)
        assert has_relevant or len(servers) > 0
    
    # ============= Registration Tests =============
    
    def test_register_external_server(self):
        """Test POST /api/register endpoint with Context7"""
        payload = {
            "name": "context7-test",
            "endpoint": f"http://localhost:{CONTEXT7_PORT}",
            "github_url": "https://github.com/upstash/context7"
        }
        
        response = self.client.post("/api/register", json=payload)
        assert response.status_code == 200
        
        server = response.json()
        assert server["name"] == "context7-test"
        assert server["deploy_method"] == "external"
        assert server["status"] == "deployed"
        assert "capabilities" in server
        
        # Store for later tests
        self.__class__.registered_servers.append(server)
        
        return server["id"]
    
    def test_register_nonexistent_server(self):
        """Test registration with non-existent server (should still register)"""
        payload = {
            "name": "fake-server",
            "endpoint": "http://localhost:99999"
        }
        
        response = self.client.post("/api/register", json=payload)
        assert response.status_code == 200
        
        server = response.json()
        assert server["status"] == "deployed"
        # Capabilities discovery might fail but registration succeeds
        assert "capabilities" in server
    
    # ============= Deployment Tests =============
    
    def test_deploy_server(self):
        """Test POST /api/deploy endpoint"""
        payload = {
            "github_url": "https://github.com/test/mcp-test-server",
            "method": "auto",
            "port": 3001
        }
        
        response = self.client.post("/api/deploy", json=payload)
        assert response.status_code == 200
        
        server = response.json()
        assert server["deploy_method"] == "auto"
        assert server["status"] in ["discovered", "deployed", "failed"]
        
        # Note: Actual deployment happens in background
        # In real scenario, would poll /api/servers/{id} to check status
    
    def test_deploy_with_docker_method(self):
        """Test deployment with specific method"""
        payload = {
            "github_url": "https://github.com/example/docker-mcp",
            "method": "docker",
            "port": 3002
        }
        
        response = self.client.post("/api/deploy", json=payload)
        assert response.status_code == 200
        
        server = response.json()
        assert server["deploy_method"] == "docker"
    
    # ============= Server Management Tests =============
    
    def test_list_all_servers(self):
        """Test GET /api/servers endpoint"""
        response = self.client.get("/api/servers")
        assert response.status_code == 200
        
        servers = response.json()
        assert isinstance(servers, list)
        
        # Should include both registered and discovered servers
        all_server_ids = [s["id"] for s in servers]
        
        # Check if our registered servers are in the list
        for registered in self.registered_servers:
            assert registered["id"] in all_server_ids
    
    def test_list_servers_with_filters(self):
        """Test server listing with status and method filters"""
        # Filter by status
        response = self.client.get("/api/servers?status=deployed")
        assert response.status_code == 200
        deployed = response.json()
        assert all(s["status"] == "deployed" for s in deployed)
        
        # Filter by method
        response = self.client.get("/api/servers?method=external")
        assert response.status_code == 200
        external = response.json()
        assert all(s["deploy_method"] == "external" for s in external)
    
    def test_get_specific_server(self):
        """Test GET /api/servers/{id} endpoint"""
        if not self.registered_servers:
            pytest.skip("No registered servers to test")
        
        server_id = self.registered_servers[0]["id"]
        response = self.client.get(f"/api/servers/{server_id}")
        assert response.status_code == 200
        
        server = response.json()
        assert server["id"] == server_id
        assert "capabilities" in server
    
    def test_get_nonexistent_server(self):
        """Test getting non-existent server"""
        response = self.client.get("/api/servers/nonexistent123")
        assert response.status_code == 404
    
    # ============= Orchestration Tests =============
    
    @pytest.mark.asyncio
    async def test_orchestrate_task(self):
        """Test POST /api/orchestrate endpoint"""
        if not self.registered_servers:
            pytest.skip("No registered servers to test")
        
        server_id = self.registered_servers[0]["id"]
        payload = {
            "server_id": server_id,
            "prompt": "Get React documentation about hooks",
            "context": {"test": True}
        }
        
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
            response = await client.post("/api/orchestrate", json=payload)
            
            # Should return result or error (depending on server availability)
            assert response.status_code == 200
            
            result = response.json()
            assert "status" in result
            assert "prompt" in result
            assert result["prompt"] == payload["prompt"]
    
    @pytest.mark.asyncio
    async def test_orchestrate_streaming(self):
        """Test POST /api/orchestrate/stream endpoint with SSE"""
        if not self.registered_servers:
            pytest.skip("No registered servers to test")
        
        server_id = self.registered_servers[0]["id"]
        payload = {
            "server_id": server_id,
            "prompt": "Test streaming orchestration"
        }
        
        events_received = []
        
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
            async with client.stream(
                "POST",
                "/api/orchestrate/stream",
                json=payload,
                headers={"Accept": "text/event-stream"}
            ) as response:
                assert response.status_code == 200
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            event = json.loads(line[6:])
                            events_received.append(event)
                            
                            # Stop after receiving complete event
                            if event.get("event") == "complete":
                                break
                        except json.JSONDecodeError:
                            continue
        
        # Verify we received expected events
        event_types = [e.get("event") for e in events_received]
        assert "start" in event_types
        assert any(e in event_types for e in ["complete", "error"])
    
    def test_orchestrate_with_invalid_server(self):
        """Test orchestration with invalid server ID"""
        payload = {
            "server_id": "invalid_server_id",
            "prompt": "Test with invalid server"
        }
        
        response = self.client.post("/api/orchestrate", json=payload)
        assert response.status_code == 404
    
    # ============= Tool Invocation Tests =============
    
    @pytest.mark.asyncio
    async def test_invoke_tool(self):
        """Test POST /api/invoke endpoint"""
        if not self.registered_servers:
            pytest.skip("No registered servers to test")
        
        server_id = self.registered_servers[0]["id"]
        payload = {
            "server_id": server_id,
            "tool_name": "get-library-docs",
            "args": {
                "context7CompatibleLibraryID": "/facebook/react",
                "topic": "hooks"
            }
        }
        
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
            response = await client.post("/api/invoke", json=payload)
            assert response.status_code == 200
            
            result = response.json()
            # Will either have result or error depending on server state
            assert isinstance(result, dict)
    
    def test_invoke_with_invalid_server(self):
        """Test tool invocation with invalid server"""
        payload = {
            "server_id": "nonexistent",
            "tool_name": "test-tool",
            "args": {}
        }
        
        response = self.client.post("/api/invoke", json=payload)
        assert response.status_code == 404
    
    # ============= Integration Workflow Tests =============
    
    @pytest.mark.asyncio
    async def test_full_workflow(self):
        """Test complete workflow: discover -> register -> orchestrate"""
        
        # Step 1: Discover servers
        discover_response = self.client.post("/api/discover", json={
            "query": "mcp context",
            "limit": 1
        })
        assert discover_response.status_code == 200
        discovered = discover_response.json()
        
        # Step 2: Register Context7 if available
        register_payload = {
            "name": "context7-workflow-test",
            "endpoint": f"http://localhost:{CONTEXT7_PORT}"
        }
        
        register_response = self.client.post("/api/register", json=register_payload)
        assert register_response.status_code == 200
        registered = register_response.json()
        
        # Step 3: Check server in list
        servers_response = self.client.get("/api/servers")
        assert servers_response.status_code == 200
        all_servers = servers_response.json()
        assert any(s["id"] == registered["id"] for s in all_servers)
        
        # Step 4: Orchestrate task
        orchestrate_payload = {
            "server_id": registered["id"],
            "prompt": "Workflow test orchestration"
        }
        
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
            orch_response = await client.post("/api/orchestrate", json=orchestrate_payload)
            assert orch_response.status_code == 200
            
            result = orch_response.json()
            assert result["server"] == registered["id"]
    
    # ============= Error Handling Tests =============
    
    def test_malformed_requests(self):
        """Test API error handling with malformed requests"""
        
        # Missing required fields
        response = self.client.post("/api/discover", json={})
        assert response.status_code == 422  # Validation error
        
        # Invalid data types
        response = self.client.post("/api/discover", json={
            "query": 123,  # Should be string
            "limit": "five"  # Should be int
        })
        assert response.status_code == 422
    
    def test_rate_limiting_behavior(self):
        """Test API behavior under rapid requests"""
        # Note: Rate limiting might not be implemented
        # This tests API stability under load
        
        responses = []
        for _ in range(10):
            response = self.client.get("/health")
            responses.append(response.status_code)
        
        # All should succeed
        assert all(r == 200 for r in responses)


# ============= Performance Tests =============

class TestPerformance:
    """Performance and load tests"""
    
    def test_response_times(self):
        """Test that endpoints respond within acceptable time"""
        client = httpx.Client(base_url=BASE_URL, timeout=5.0)
        
        # Health check should be fast
        start = time.time()
        response = client.get("/health")
        elapsed = time.time() - start
        assert response.status_code == 200
        assert elapsed < 1.0  # Should respond within 1 second
        
        # Discovery might take longer but should be reasonable
        start = time.time()
        response = client.post("/api/discover", json={
            "query": "mcp",
            "limit": 1
        })
        elapsed = time.time() - start
        assert response.status_code == 200
        assert elapsed < 5.0  # Should respond within 5 seconds
        
        client.close()
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self):
        """Test API handles concurrent requests properly"""
        async def make_request(client, endpoint):
            response = await client.get(endpoint)
            return response.status_code
        
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
            # Make 5 concurrent requests
            tasks = [
                make_request(client, "/health"),
                make_request(client, "/"),
                make_request(client, "/api/servers"),
                make_request(client, "/health"),
                make_request(client, "/")
            ]
            
            results = await asyncio.gather(*tasks)
            
            # All should succeed
            assert all(r == 200 for r in results)


# ============= Context7 Specific Tests =============

class TestContext7Integration:
    """Tests specific to Context7 MCP server integration"""
    
    @pytest.fixture
    def context7_server_id(self):
        """Register Context7 and return its ID"""
        client = httpx.Client(base_url=BASE_URL, timeout=30.0)
        
        response = client.post("/api/register", json={
            "name": "context7-integration",
            "endpoint": f"http://localhost:{CONTEXT7_PORT}",
            "github_url": "https://github.com/upstash/context7"
        })
        
        if response.status_code == 200:
            return response.json()["id"]
        return None
    
    @pytest.mark.asyncio
    async def test_context7_tools_discovery(self, context7_server_id):
        """Test that Context7 tools are properly discovered"""
        if not context7_server_id:
            pytest.skip("Context7 not available")
        
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
            response = await client.get(f"/api/servers/{context7_server_id}")
            assert response.status_code == 200
            
            server = response.json()
            capabilities = server.get("capabilities", {})
            
            # Context7 should expose documentation tools
            tools = capabilities.get("tools", [])
            if tools:
                tool_names = [t.get("name") for t in tools]
                # Check for expected Context7 tools
                assert any("resolve" in name.lower() or "docs" in name.lower() 
                          for name in tool_names if name)
    
    @pytest.mark.asyncio
    async def test_context7_documentation_workflow(self, context7_server_id):
        """Test complete documentation retrieval workflow with Context7"""
        if not context7_server_id:
            pytest.skip("Context7 not available")
        
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
            # Orchestrate documentation request
            response = await client.post("/api/orchestrate", json={
                "server_id": context7_server_id,
                "prompt": "Get React documentation about hooks and state management"
            })
            
            assert response.status_code == 200
            result = response.json()
            
            # Should have attempted to fetch documentation
            assert "status" in result
            if result["status"] == "completed":
                assert "plan" in result or "result" in result


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])