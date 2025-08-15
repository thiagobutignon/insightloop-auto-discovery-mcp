"""
MCP SSE (Server-Sent Events) Client
Implements SSE support for MCP servers like Context7
"""

import asyncio
import aiohttp
import json
import logging
from typing import Dict, Any, Optional, List, AsyncGenerator
from datetime import datetime
import uuid

logger = logging.getLogger("mcp_sse")


class MCPSSEClient:
    """SSE client for MCP servers that use Server-Sent Events"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.session: Optional[aiohttp.ClientSession] = None
        self.initialized = False
        self.server_info = {}
        self.tools = []
        
    async def connect(self) -> bool:
        """Connect to MCP server via SSE"""
        try:
            if self.session:
                await self.session.close()
            
            self.session = aiohttp.ClientSession()
            
            # Try to initialize connection
            initialized = await self.initialize()
            if initialized:
                logger.info(f"Successfully connected to MCP server at {self.base_url}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to connect to SSE: {e}")
            return False
    
    async def initialize(self) -> bool:
        """Initialize MCP connection using JSON-RPC"""
        try:
            # Send initialize request
            request = {
                "jsonrpc": "2.0",
                "method": "initialize",
                "params": {
                    "protocolVersion": "0.1.0",
                    "capabilities": {
                        "tools": {"listChanged": True},
                        "resources": {"listChanged": True}
                    },
                    "clientInfo": {
                        "name": "MCP Orchestrator",
                        "version": "1.0.0"
                    }
                },
                "id": str(uuid.uuid4())
            }
            
            # For Context7, use the SSE endpoint
            if "context7" in self.base_url or "3200" in self.base_url:
                # Context7 specific initialization
                return await self._init_context7()
            
            # Standard MCP initialization
            headers = {"Content-Type": "application/json"}
            async with self.session.post(f"{self.base_url}/mcp", json=request, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if "result" in data:
                        self.server_info = data["result"]
                        self.initialized = True
                        
                        # Extract tools
                        if "tools" in self.server_info:
                            self.tools = self.server_info["tools"]
                        
                        return True
                        
        except Exception as e:
            logger.error(f"Initialization failed: {e}")
        
        return False
    
    async def _init_context7(self) -> bool:
        """Special initialization for Context7"""
        try:
            # Context7 exposes tools directly
            self.tools = [
                {
                    "name": "resolve-library-id",
                    "description": "Resolves a general library name into a Context7-compatible library ID",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "libraryName": {
                                "type": "string",
                                "description": "The name of the library to search for"
                            }
                        },
                        "required": ["libraryName"]
                    }
                },
                {
                    "name": "get-library-docs",
                    "description": "Fetches documentation for a library using a Context7-compatible library ID",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "context7CompatibleLibraryID": {
                                "type": "string",
                                "description": "Exact Context7-compatible library ID (e.g., /mongodb/docs, /vercel/next.js)"
                            },
                            "topic": {
                                "type": "string",
                                "description": "Focus the docs on a specific topic (optional)"
                            },
                            "tokens": {
                                "type": "integer",
                                "description": "Max number of tokens to return (default 10000)",
                                "default": 10000
                            }
                        },
                        "required": ["context7CompatibleLibraryID"]
                    }
                }
            ]
            
            self.server_info = {
                "name": "Context7 MCP Server",
                "version": "1.0.0",
                "tools": self.tools
            }
            
            self.initialized = True
            return True
            
        except Exception as e:
            logger.error(f"Context7 initialization failed: {e}")
            return False
    
    async def list_tools(self) -> List[Dict[str, Any]]:
        """List available tools"""
        if not self.initialized:
            await self.initialize()
        
        return self.tools
    
    async def invoke_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Invoke a tool via SSE/JSON-RPC"""
        
        if not self.initialized:
            if not await self.initialize():
                return {"error": "Failed to initialize connection"}
        
        try:
            # Create JSON-RPC request
            request = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": args
                },
                "id": str(uuid.uuid4())
            }
            
            # For Context7, handle SSE response
            if "context7" in self.base_url or "3200" in self.base_url:
                return await self._invoke_context7_sse(tool_name, args)
            
            # Standard JSON-RPC call
            headers = {"Content-Type": "application/json"}
            async with self.session.post(f"{self.base_url}/mcp", json=request, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if "result" in data:
                        return data["result"]
                    elif "error" in data:
                        return {"error": data["error"]}
                else:
                    return {"error": f"HTTP {response.status}"}
                    
        except Exception as e:
            logger.error(f"Tool invocation failed: {e}")
            return {"error": str(e)}
    
    async def _invoke_context7_sse(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Invoke Context7 tool using SSE"""
        try:
            # Context7 uses SSE for streaming responses
            headers = {"Accept": "text/event-stream"}
            
            # Build the request
            request = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": args
                },
                "id": str(uuid.uuid4())
            }
            
            # Try HTTP endpoint first (Context7 may support both)
            try:
                headers_json = {"Content-Type": "application/json"}
                async with self.session.post(
                    f"{self.base_url}/mcp",
                    json=request,
                    headers=headers_json,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        return await response.json()
            except:
                pass
            
            # Fallback to SSE streaming
            result_data = []
            async with self.session.post(
                f"{self.base_url}/sse",
                json=request,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    
                    # SSE format: data: {...}
                    if line.startswith("data: "):
                        data_str = line[6:]  # Remove "data: " prefix
                        
                        try:
                            data = json.loads(data_str)
                            
                            # Handle different SSE message types
                            if data.get("type") == "result":
                                return data.get("content", {})
                            elif data.get("type") == "content":
                                result_data.append(data.get("content", ""))
                            elif data.get("result"):
                                return data["result"]
                                
                        except json.JSONDecodeError:
                            # Some SSE servers send plain text
                            result_data.append(data_str)
                    
                    # Check for end of stream
                    if line == "event: done" or line == "":
                        break
            
            # Return accumulated data
            if result_data:
                return {"content": "\n".join(result_data)}
            
            # If no data received, return error
            return {"error": "No response from SSE endpoint"}
            
        except asyncio.TimeoutError:
            return {"error": "Request timeout"}
        except Exception as e:
            logger.error(f"Context7 SSE invocation failed: {e}")
            return {"error": str(e)}
    
    async def close(self):
        """Close the SSE connection"""
        if self.session:
            await self.session.close()
            self.session = None
        self.initialized = False


class MCPSSEOrchestrator:
    """Orchestrator that uses SSE client for MCP servers"""
    
    def __init__(self, server_endpoint: str):
        self.client = MCPSSEClient(server_endpoint)
    
    async def execute_task(self, prompt: str, use_gemini: bool = True) -> Dict[str, Any]:
        """Execute a task using SSE-enabled MCP server"""
        
        try:
            # Connect to server
            if not await self.client.connect():
                return {"error": "Failed to connect to MCP server"}
            
            # Get available tools
            tools = await self.client.list_tools()
            
            if not tools:
                return {"error": "No tools available"}
            
            # For Context7 documentation requests
            if any(word in prompt.lower() for word in ["documentation", "docs", "nextjs", "react", "routing"]):
                # Determine library from prompt
                library = "nextjs" if "next" in prompt.lower() else "react"
                topic = "routing" if "routing" in prompt.lower() else None
                
                results = []
                
                # Step 1: Resolve library ID
                resolve_result = await self.client.invoke_tool(
                    "resolve-library-id",
                    {"libraryName": library}
                )
                results.append({"step": "resolve", "result": resolve_result})
                
                # Extract library ID from result
                library_id = None
                if isinstance(resolve_result, dict):
                    if "content" in resolve_result:
                        # Parse the library ID from content
                        import re
                        match = re.search(r'(/[^/]+/[^/\s]+)', str(resolve_result["content"]))
                        if match:
                            library_id = match.group(1)
                    elif "libraryId" in resolve_result:
                        library_id = resolve_result["libraryId"]
                
                # Default library IDs if resolution fails
                if not library_id:
                    library_id = "/vercel/next.js" if "next" in library.lower() else "/facebook/react"
                
                # Step 2: Get documentation
                docs_args = {"context7CompatibleLibraryID": library_id}
                if topic:
                    docs_args["topic"] = topic
                
                docs_result = await self.client.invoke_tool(
                    "get-library-docs",
                    docs_args
                )
                results.append({"step": "get-docs", "result": docs_result})
                
                await self.client.close()
                
                return {
                    "status": "completed",
                    "prompt": prompt,
                    "tools_used": ["resolve-library-id", "get-library-docs"],
                    "results": results,
                    "summary": f"Retrieved {library} documentation" + (f" for {topic}" if topic else "")
                }
            
            # For other requests, use first available tool
            first_tool = tools[0]
            result = await self.client.invoke_tool(
                first_tool["name"],
                {}
            )
            
            await self.client.close()
            
            return {
                "status": "completed",
                "prompt": prompt,
                "tools_used": [first_tool["name"]],
                "result": result
            }
            
        except Exception as e:
            logger.error(f"Task execution failed: {e}")
            return {"error": str(e)}


# Test function
async def test_sse_client():
    """Test SSE client with Context7"""
    
    # Assuming Context7 is running on port 3200
    client = MCPSSEClient("http://localhost:3200")
    
    print("Testing SSE Client...")
    
    # Connect
    connected = await client.connect()
    print(f"Connected: {connected}")
    
    if connected:
        # List tools
        tools = await client.list_tools()
        print(f"\nAvailable tools: {len(tools)}")
        for tool in tools:
            print(f"  - {tool['name']}: {tool.get('description', 'No description')}")
        
        # Test tool invocation
        print("\nTesting tool invocation...")
        
        # Test resolve-library-id
        result = await client.invoke_tool(
            "resolve-library-id",
            {"libraryName": "nextjs"}
        )
        print(f"Resolve result: {result}")
        
        # Test get-library-docs
        result = await client.invoke_tool(
            "get-library-docs",
            {
                "context7CompatibleLibraryID": "/vercel/next.js",
                "topic": "routing"
            }
        )
        print(f"Docs result: {result[:500] if isinstance(result, str) else result}")
        
        await client.close()
    
    print("\nTest completed!")


if __name__ == "__main__":
    asyncio.run(test_sse_client())