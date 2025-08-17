"""MCP Server Capabilities Discovery Module"""

import aiohttp
import logging
from typing import Dict
from src.clients import UniversalMCPClient

logger = logging.getLogger("mcp_orchestrator")


async def discover_mcp_capabilities(endpoint: str) -> Dict:
    """Automatically discover MCP server capabilities using universal client"""
    
    capabilities = {"tools": [], "resources": [], "prompts": [], "protocol": "unknown"}
    
    try:
        # Use universal client for better protocol detection
        client = UniversalMCPClient(endpoint)
        connected = await client.connect()
        
        if connected:
            caps = await client.get_capabilities()
            capabilities["tools"] = caps.get("tools", [])
            capabilities["resources"] = caps.get("resources", [])
            capabilities["protocol"] = caps.get("protocol", "unknown")
            capabilities["endpoint"] = caps.get("endpoint", endpoint)
            
            await client.close()
            
            if capabilities["tools"]:
                logger.info(f"Discovered {len(capabilities['tools'])} tools via universal client")
                return capabilities
        
    except Exception as e:
        logger.error(f"Universal client discovery failed: {e}")
    
    # Fallback to HTTP discovery if universal client fails
    if endpoint.startswith("http"):
        capabilities = await _discover_http_capabilities(endpoint, capabilities)
    elif endpoint.startswith("stdio://"):
        # For stdio-based servers (like npx)
        capabilities["tools"] = [
            {"name": "execute", "description": "Execute command via stdio"}
        ]
    
    return capabilities


async def _discover_http_capabilities(endpoint: str, capabilities: Dict) -> Dict:
    """Discover capabilities for HTTP/SSE servers"""
    try:
        async with aiohttp.ClientSession() as session:
            # Try standard MCP discovery endpoints
            discovery_endpoints = [
                f"{endpoint}/mcp",  # Context7 style
                f"{endpoint}/.well-known/mcp",  # Standard MCP
                f"{endpoint}/capabilities",  # Alternative
                f"{endpoint}/api/tools"  # Some servers use this
            ]
            
            for disc_url in discovery_endpoints:
                try:
                    capabilities = await _try_json_rpc_discovery(
                        session, disc_url, endpoint, capabilities
                    )
                    if capabilities["tools"]:
                        logger.info(f"Discovered {len(capabilities['tools'])} tools via {disc_url}")
                        break
                except Exception as e:
                    logger.debug(f"Discovery attempt failed for {disc_url}: {e}")
                    continue
                    
    except Exception as e:
        logger.error(f"HTTP discovery failed: {e}")
    
    return capabilities


async def _try_json_rpc_discovery(session, disc_url: str, endpoint: str, capabilities: Dict) -> Dict:
    """Try JSON-RPC discovery for a specific URL"""
    headers = {"Content-Type": "application/json"}
    payload = {
        "jsonrpc": "2.0",
        "method": "initialize",
        "params": {
            "protocolVersion": "0.1.0",
            "capabilities": {}
        },
        "id": 1
    }
    
    async with session.post(disc_url, json=payload, headers=headers, timeout=5) as response:
        if response.status == 200:
            data = await response.json()
            
            # Extract tools from response
            if "result" in data:
                result = data["result"]
                if "tools" in result:
                    capabilities["tools"] = result["tools"]
                elif "capabilities" in result:
                    if "tools" in result["capabilities"]:
                        capabilities["tools"] = result["capabilities"]["tools"]
            
            # For Context7 specifically
            if "context7" in endpoint or not capabilities["tools"]:
                capabilities["tools"] = _get_context7_default_tools()
    
    return capabilities


def _get_context7_default_tools():
    """Get default tools for Context7 servers"""
    return [
        {
            "name": "resolve-library-id",
            "description": "Resolves a library name to Context7 ID",
            "parameters": {
                "libraryName": {"type": "string", "required": True}
            }
        },
        {
            "name": "get-library-docs",
            "description": "Gets documentation for a library",
            "parameters": {
                "context7CompatibleLibraryID": {"type": "string", "required": True},
                "topic": {"type": "string", "required": False}
            }
        }
    ]