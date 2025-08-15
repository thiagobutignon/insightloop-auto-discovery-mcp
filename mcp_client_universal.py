"""
Universal MCP Client with Multiple Protocol Support
Supports: JSON-RPC, SSE, WebSocket, stdio, and various endpoint patterns
"""

import asyncio
import aiohttp
import json
import logging
import subprocess
import websockets
from typing import Dict, Any, Optional, List, Union, Tuple
from datetime import datetime
import uuid
from enum import Enum

logger = logging.getLogger("mcp_universal")


class MCPProtocol(Enum):
    """Supported MCP protocols"""
    HTTP_JSONRPC = "http_jsonrpc"
    SSE = "sse"
    WEBSOCKET = "websocket"
    STDIO = "stdio"
    UNKNOWN = "unknown"


class MCPEndpointDetector:
    """Detects and validates MCP endpoints"""
    
    # Common MCP endpoint patterns
    ENDPOINT_PATTERNS = [
        "/mcp",           # Standard MCP endpoint
        "/sse",           # SSE endpoint
        "/api",           # Generic API endpoint
        "/jsonrpc",       # JSON-RPC endpoint
        "/rpc",           # RPC endpoint
        "/.well-known/mcp",  # Well-known MCP
        "/v1/mcp",        # Versioned endpoint
        "/mcp/v1",        # Alternative versioned
        "",               # Root endpoint
    ]
    
    # Common MCP methods to try
    TEST_METHODS = [
        "initialize",
        "ping",
        "capabilities",
        "tools/list",
        "resources/list",
    ]
    
    @classmethod
    async def detect_protocol(cls, base_url: str) -> Tuple[MCPProtocol, str]:
        """
        Detect the protocol and endpoint for a given base URL
        Returns: (protocol, working_endpoint)
        """
        
        # Handle special cases first
        if base_url.startswith("stdio://"):
            return MCPProtocol.STDIO, base_url
        elif base_url.startswith("ws://") or base_url.startswith("wss://"):
            return MCPProtocol.WEBSOCKET, base_url
        
        # For HTTP-based protocols, try different endpoints
        if base_url.startswith("http://") or base_url.startswith("https://"):
            # Try each endpoint pattern
            async with aiohttp.ClientSession() as session:
                for endpoint in cls.ENDPOINT_PATTERNS:
                    full_url = f"{base_url.rstrip('/')}{endpoint}"
                    
                    # Try JSON-RPC first
                    protocol, url = await cls._try_jsonrpc(session, full_url)
                    if protocol != MCPProtocol.UNKNOWN:
                        return protocol, url
                    
                    # Try SSE
                    protocol, url = await cls._try_sse(session, full_url)
                    if protocol != MCPProtocol.UNKNOWN:
                        return protocol, url
        
        return MCPProtocol.UNKNOWN, base_url
    
    @classmethod
    async def _try_jsonrpc(cls, session: aiohttp.ClientSession, url: str) -> Tuple[MCPProtocol, str]:
        """Try JSON-RPC protocol"""
        for method in cls.TEST_METHODS:
            try:
                request = {
                    "jsonrpc": "2.0",
                    "method": method,
                    "params": {} if method != "initialize" else {
                        "protocolVersion": "0.1.0",
                        "capabilities": {}
                    },
                    "id": 1
                }
                
                headers = {"Content-Type": "application/json"}
                async with session.post(url, json=request, headers=headers, timeout=3) as response:
                    if response.status in [200, 201]:
                        try:
                            data = await response.json()
                            if "jsonrpc" in data or "result" in data or "error" in data:
                                logger.info(f"Detected JSON-RPC at {url} with method {method}")
                                return MCPProtocol.HTTP_JSONRPC, url
                        except:
                            pass
            except:
                continue
        
        return MCPProtocol.UNKNOWN, url
    
    @classmethod
    async def _try_sse(cls, session: aiohttp.ClientSession, url: str) -> Tuple[MCPProtocol, str]:
        """Try SSE protocol"""
        try:
            headers = {"Accept": "text/event-stream"}
            async with session.get(url, headers=headers, timeout=3) as response:
                if response.status == 200:
                    content_type = response.headers.get("Content-Type", "")
                    if "event-stream" in content_type:
                        logger.info(f"Detected SSE at {url}")
                        return MCPProtocol.SSE, url
        except:
            pass
        
        return MCPProtocol.UNKNOWN, url


class UniversalMCPClient:
    """Universal MCP client that supports multiple protocols"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.protocol = MCPProtocol.UNKNOWN
        self.endpoint = base_url
        self.session: Optional[aiohttp.ClientSession] = None
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.process: Optional[subprocess.Popen] = None
        self.initialized = False
        self.server_info = {}
        self.tools = []
        self.resources = []
        
    async def connect(self) -> bool:
        """Auto-detect protocol and connect to MCP server"""
        try:
            # Detect protocol and endpoint
            self.protocol, self.endpoint = await MCPEndpointDetector.detect_protocol(self.base_url)
            
            if self.protocol == MCPProtocol.UNKNOWN:
                logger.warning(f"Could not detect MCP protocol for {self.base_url}, trying fallback")
                # Try with default assumptions
                if "context7" in self.base_url.lower():
                    self.protocol = MCPProtocol.SSE
                    self.endpoint = f"{self.base_url}/sse"
                else:
                    self.protocol = MCPProtocol.HTTP_JSONRPC
                    self.endpoint = f"{self.base_url}/mcp"
            
            logger.info(f"Using protocol {self.protocol.value} with endpoint {self.endpoint}")
            
            # Connect based on protocol
            if self.protocol in [MCPProtocol.HTTP_JSONRPC, MCPProtocol.SSE]:
                if self.session:
                    await self.session.close()
                self.session = aiohttp.ClientSession()
            elif self.protocol == MCPProtocol.WEBSOCKET:
                self.ws = await websockets.connect(self.endpoint)
            elif self.protocol == MCPProtocol.STDIO:
                # Parse stdio URL to get process info
                # Format: stdio://process/PID or stdio://command/path
                return True  # Stdio handled differently
            
            # Initialize connection
            return await self.initialize()
            
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            return False
    
    async def initialize(self) -> bool:
        """Initialize MCP connection"""
        try:
            request = {
                "jsonrpc": "2.0",
                "method": "initialize",
                "params": {
                    "protocolVersion": "0.1.0",
                    "capabilities": {
                        "tools": {"listChanged": True},
                        "resources": {"listChanged": True},
                        "prompts": {"listChanged": True}
                    },
                    "clientInfo": {
                        "name": "Universal MCP Client",
                        "version": "1.0.0"
                    }
                },
                "id": str(uuid.uuid4())
            }
            
            response = await self._send_request(request)
            
            if response and "result" in response:
                self.server_info = response["result"]
                self.initialized = True
                
                # Get server capabilities
                if "capabilities" in self.server_info:
                    caps = self.server_info["capabilities"]
                    if "tools" in caps:
                        await self._list_tools()
                    if "resources" in caps:
                        await self._list_resources()
                
                return True
            
            # Fallback for servers that don't require initialization
            if self.protocol == MCPProtocol.SSE:
                # Some SSE servers work without initialization
                self.initialized = True
                await self._list_tools()
                return True
                
        except Exception as e:
            logger.error(f"Initialization failed: {e}")
        
        return False
    
    async def _send_request(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Send request based on protocol"""
        
        if self.protocol == MCPProtocol.HTTP_JSONRPC:
            return await self._send_jsonrpc(request)
        elif self.protocol == MCPProtocol.SSE:
            return await self._send_sse(request)
        elif self.protocol == MCPProtocol.WEBSOCKET:
            return await self._send_websocket(request)
        elif self.protocol == MCPProtocol.STDIO:
            return await self._send_stdio(request)
        
        return None
    
    async def _send_jsonrpc(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Send JSON-RPC request"""
        try:
            headers = {"Content-Type": "application/json"}
            async with self.session.post(self.endpoint, json=request, headers=headers, timeout=10) as response:
                if response.status in [200, 201]:
                    return await response.json()
                else:
                    logger.error(f"JSON-RPC request failed with status {response.status}")
        except Exception as e:
            logger.error(f"JSON-RPC request failed: {e}")
        return None
    
    async def _send_sse(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Send SSE request and handle streaming response"""
        try:
            # Try JSON endpoint first (some SSE servers also support JSON)
            json_endpoint = self.endpoint.replace("/sse", "/mcp")
            headers = {"Content-Type": "application/json"}
            
            try:
                async with self.session.post(json_endpoint, json=request, headers=headers, timeout=5) as response:
                    if response.status == 200:
                        return await response.json()
            except:
                pass
            
            # Fall back to SSE streaming
            headers = {"Accept": "text/event-stream"}
            result_data = []
            
            async with self.session.post(self.endpoint, json=request, headers=headers, timeout=10) as response:
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    
                    if line.startswith("data: "):
                        data_str = line[6:]
                        try:
                            data = json.loads(data_str)
                            if "result" in data:
                                return data
                            elif "type" in data and data["type"] == "result":
                                return {"result": data.get("content", {})}
                            result_data.append(data)
                        except:
                            result_data.append(data_str)
                    
                    if line == "event: done":
                        break
            
            if result_data:
                return {"result": result_data}
                
        except Exception as e:
            logger.error(f"SSE request failed: {e}")
        return None
    
    async def _send_websocket(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Send WebSocket request"""
        try:
            await self.ws.send(json.dumps(request))
            response = await self.ws.recv()
            return json.loads(response)
        except Exception as e:
            logger.error(f"WebSocket request failed: {e}")
        return None
    
    async def _send_stdio(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Send stdio request"""
        # This would require process management
        logger.warning("Stdio protocol not fully implemented")
        return None
    
    async def _list_tools(self) -> List[Dict[str, Any]]:
        """List available tools"""
        try:
            request = {
                "jsonrpc": "2.0",
                "method": "tools/list",
                "params": {},
                "id": str(uuid.uuid4())
            }
            
            response = await self._send_request(request)
            if response and "result" in response:
                self.tools = response["result"].get("tools", [])
            elif not self.tools:
                # Fallback: hardcoded tools for known servers
                if "context7" in self.endpoint.lower():
                    self.tools = [
                        {
                            "name": "resolve-library-id",
                            "description": "Resolves a library name to Context7 ID",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "libraryName": {"type": "string"}
                                },
                                "required": ["libraryName"]
                            }
                        },
                        {
                            "name": "get-library-docs",
                            "description": "Gets documentation for a library",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "context7CompatibleLibraryID": {"type": "string"},
                                    "topic": {"type": "string"}
                                },
                                "required": ["context7CompatibleLibraryID"]
                            }
                        }
                    ]
            
            return self.tools
            
        except Exception as e:
            logger.error(f"Failed to list tools: {e}")
            return []
    
    async def _list_resources(self) -> List[Dict[str, Any]]:
        """List available resources"""
        try:
            request = {
                "jsonrpc": "2.0",
                "method": "resources/list",
                "params": {},
                "id": str(uuid.uuid4())
            }
            
            response = await self._send_request(request)
            if response and "result" in response:
                self.resources = response["result"].get("resources", [])
            
            return self.resources
            
        except Exception as e:
            logger.error(f"Failed to list resources: {e}")
            return []
    
    async def invoke_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Invoke a tool on the MCP server"""
        try:
            request = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": args
                },
                "id": str(uuid.uuid4())
            }
            
            response = await self._send_request(request)
            
            if response:
                if "result" in response:
                    return response["result"]
                elif "error" in response:
                    return {"error": response["error"]}
                else:
                    return response
            
            return {"error": "No response from server"}
            
        except Exception as e:
            logger.error(f"Tool invocation failed: {e}")
            return {"error": str(e)}
    
    async def get_capabilities(self) -> Dict[str, Any]:
        """Get server capabilities"""
        return {
            "protocol": self.protocol.value,
            "endpoint": self.endpoint,
            "initialized": self.initialized,
            "server_info": self.server_info,
            "tools": self.tools,
            "resources": self.resources
        }
    
    async def close(self):
        """Close connection"""
        if self.session:
            await self.session.close()
            self.session = None
        if self.ws:
            await self.ws.close()
            self.ws = None
        if self.process:
            self.process.terminate()
            self.process = None
        self.initialized = False


# Test function
async def test_universal_client():
    """Test universal MCP client"""
    
    test_urls = [
        "http://localhost:3200",  # Context7
        "http://localhost:3000",  # Generic MCP
        "http://localhost:8080",  # Alternative port
    ]
    
    for url in test_urls:
        print(f"\n{'='*60}")
        print(f"Testing: {url}")
        print('='*60)
        
        client = UniversalMCPClient(url)
        
        # Connect
        connected = await client.connect()
        print(f"Connected: {connected}")
        
        if connected:
            # Get capabilities
            caps = await client.get_capabilities()
            print(f"Protocol: {caps['protocol']}")
            print(f"Endpoint: {caps['endpoint']}")
            print(f"Tools: {len(caps['tools'])}")
            
            # List tools
            for tool in caps['tools']:
                print(f"  - {tool['name']}: {tool.get('description', 'No description')}")
            
            # Test tool invocation if tools available
            if caps['tools']:
                first_tool = caps['tools'][0]
                print(f"\nTesting tool: {first_tool['name']}")
                
                # Build test args based on tool schema
                test_args = {}
                if "inputSchema" in first_tool:
                    schema = first_tool["inputSchema"]
                    if "properties" in schema:
                        for prop, details in schema["properties"].items():
                            if prop == "libraryName":
                                test_args[prop] = "react"
                            elif prop == "context7CompatibleLibraryID":
                                test_args[prop] = "/facebook/react"
                            else:
                                test_args[prop] = "test"
                
                result = await client.invoke_tool(first_tool['name'], test_args)
                print(f"Result: {str(result)[:200]}...")
            
            await client.close()
        
        print()


if __name__ == "__main__":
    asyncio.run(test_universal_client())