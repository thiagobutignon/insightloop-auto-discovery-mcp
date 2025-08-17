"""MCP client wrapper using universal client"""

import logging
from typing import Dict
from . import UniversalMCPClient

logger = logging.getLogger("mcp_orchestrator")


class MCPClient:
    """MCP client wrapper using universal client"""
    
    def __init__(self, endpoint: str):
        self.endpoint = endpoint
        self.client = UniversalMCPClient(endpoint)
    
    async def connect(self) -> bool:
        """Connect to MCP server using universal client"""
        try:
            return await self.client.connect()
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            return False
    
    async def discover_capabilities(self) -> Dict:
        """Discover server capabilities"""
        try:
            caps = await self.client.get_capabilities()
            return {
                "tools": caps.get("tools", []),
                "resources": caps.get("resources", []),
                "protocol": caps.get("protocol", "unknown")
            }
        except Exception as e:
            logger.error(f"Capability discovery failed: {e}")
            return {}
    
    async def invoke_tool(self, tool_name: str, args: Dict) -> Dict:
        """Invoke a tool on the server"""
        try:
            return await self.client.invoke_tool(tool_name, args)
        except Exception as e:
            logger.error(f"Tool invocation failed: {e}")
            raise
    
    async def close(self):
        """Close connection"""
        await self.client.close()