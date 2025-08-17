"""
MCP Server Discovery and Orchestration API with FastAPI
Discovers MCP servers from GitHub, deploys them, and orchestrates with Gemini
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import aiohttp
import json
import os
import tempfile
import subprocess
from pathlib import Path
import logging
import hashlib
from contextlib import asynccontextmanager
import re

# Import from organized module structure
from src.clients import UniversalMCPClient, MCPProtocol, MCPSSEClient, MCPSSEOrchestrator
from src.clients.mcp_client import MCPClient
from src.orchestrators import GeminiOrchestrator
from src.discovery.github import GitHubDiscovery
from src.deployers.server_deployer import ServerDeployer
from src.models.requests import (
    ServerDiscoveryRequest,
    ServerInfo,
    DeployRequest,
    RegisterRequest,
    OrchestrationRequest,
    ToolInvocation
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp_orchestrator")

# Global cache for discovered servers
server_registry = {}
discovery_cache = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting MCP Orchestrator API")
    # Initialize any background tasks if needed
    yield
    # Shutdown
    logger.info("Shutting down MCP Orchestrator API")

app = FastAPI(
    title="MCP Orchestrator API",
    description="Discover, deploy and orchestrate MCP servers from GitHub with Gemini",
    version="1.0.0",
    lifespan=lifespan
)


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "servers_registered": len(server_registry)}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "MCP Orchestrator API",
        "endpoints": {
            "discovery": "/api/discover",
            "deploy": "/api/deploy",
            "servers": "/api/servers",
            "orchestrate": "/api/orchestrate",
            "docs": "/docs"
        }
    }

# Discovery endpoint
@app.post("/api/discover", response_model=List[ServerInfo])
async def discover_servers(request: ServerDiscoveryRequest, background_tasks: BackgroundTasks):
    """
    Discover MCP servers from GitHub based on search query
    """
    try:
        discovery_module = GitHubDiscovery()
        repos = await discovery_module.search_repositories(request.query, request.limit)
        
        servers = []
        for repo in repos:
            server_id = hashlib.md5(repo["html_url"].encode()).hexdigest()[:12]
            
            # Check cache
            if server_id in discovery_cache:
                servers.append(discovery_cache[server_id])
                continue
            
            server_info = ServerInfo(
                id=server_id,
                name=repo["full_name"],
                github_url=repo["html_url"],
                description=repo.get("description"),
                deploy_method="auto",
                status="discovered",
                created_at=datetime.now()
            )
            
            discovery_cache[server_id] = server_info
            servers.append(server_info)
            
            if request.auto_deploy:
                background_tasks.add_task(auto_deploy_server, server_info)
        
        return servers
    except Exception as e:
        logger.error(f"Discovery failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Register endpoint for existing servers
@app.post("/api/register", response_model=ServerInfo)
async def register_server(request: RegisterRequest):
    """
    Register an existing MCP server that is already running
    """
    try:
        # Create server ID from endpoint
        server_id = hashlib.md5(request.endpoint.encode()).hexdigest()[:12]
        
        # Check if already registered
        if server_id in server_registry:
            return server_registry[server_id]
        
        server_info = ServerInfo(
            id=server_id,
            name=request.name,
            github_url=request.github_url or f"https://github.com/{request.name}",
            deploy_method="external",
            status="deployed",
            endpoint=request.endpoint,
            created_at=datetime.now()
        )
        
        # Discover capabilities
        logger.info(f"Discovering capabilities for {request.name} at {request.endpoint}")
        capabilities = await discover_mcp_capabilities(request.endpoint)
        server_info.capabilities = capabilities
        
        # Register server
        server_registry[server_id] = server_info
        logger.info(f"Registered external server {request.name} with {len(capabilities.get('tools', []))} tools")
        
        return server_info
        
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Deploy endpoint
@app.post("/api/deploy", response_model=ServerInfo)
async def deploy_server(request: DeployRequest, background_tasks: BackgroundTasks):
    """
    Deploy a specific MCP server from GitHub
    """
    try:
        server_id = hashlib.md5(request.github_url.encode()).hexdigest()[:12]
        
        # Check if already deployed
        if server_id in server_registry and server_registry[server_id].status == "deployed":
            return server_registry[server_id]
        
        server_info = ServerInfo(
            id=server_id,
            name=request.github_url.split("/")[-1],
            github_url=request.github_url,
            deploy_method=request.method,
            status="discovered",
            created_at=datetime.now()
        )
        
        # Start deployment in background
        background_tasks.add_task(deploy_server_task, server_info, request.method, request.port)
        
        return server_info
    except Exception as e:
        logger.error(f"Deploy request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# List servers endpoint
@app.get("/api/servers", response_model=List[ServerInfo])
async def list_servers(
    status: Optional[str] = Query(None, description="Filter by status"),
    method: Optional[str] = Query(None, description="Filter by deploy method")
):
    """
    List all discovered and deployed MCP servers
    """
    servers = list(server_registry.values()) + list(discovery_cache.values())
    
    # Remove duplicates
    unique_servers = {s.id: s for s in servers}
    servers = list(unique_servers.values())
    
    if status:
        servers = [s for s in servers if s.status == status]
    if method:
        servers = [s for s in servers if s.deploy_method == method]
    
    return servers

# Get specific server
@app.get("/api/servers/{server_id}", response_model=ServerInfo)
async def get_server(server_id: str):
    """
    Get details of a specific MCP server
    """
    if server_id in server_registry:
        return server_registry[server_id]
    elif server_id in discovery_cache:
        return discovery_cache[server_id]
    else:
        raise HTTPException(status_code=404, detail="Server not found")

# Orchestration endpoint (non-streaming for backward compatibility)
@app.post("/api/orchestrate")
async def orchestrate_task(request: OrchestrationRequest):
    """
    Execute a task using Gemini orchestration on a deployed MCP server
    Returns complete result as JSON
    """
    if request.server_id not in server_registry:
        raise HTTPException(status_code=404, detail="Server not deployed")
    
    server = server_registry[request.server_id]
    if server.status != "deployed":
        raise HTTPException(status_code=400, detail="Server not ready")
    
    try:
        orchestrator = GeminiOrchestrator()
        result = await orchestrator.execute_task(
            server=server,
            prompt=request.prompt,
            context=request.context
        )
        return result
    except Exception as e:
        logger.error(f"Orchestration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Streaming orchestration endpoint
@app.post("/api/orchestrate/stream")
async def orchestrate_task_stream(request: OrchestrationRequest):
    """
    Execute a task using Gemini orchestration with Server-Sent Events streaming
    Returns real-time updates as the orchestration progresses
    """
    if request.server_id not in server_registry:
        raise HTTPException(status_code=404, detail="Server not deployed")
    
    server = server_registry[request.server_id]
    if server.status != "deployed":
        raise HTTPException(status_code=400, detail="Server not ready")
    
    async def event_generator():
        """Generate SSE events for orchestration progress"""
        try:
            # Send initial event
            yield f"data: {json.dumps({'event': 'start', 'server': server.name, 'prompt': request.prompt})}\n\n"
            
            orchestrator = GeminiOrchestrator()
            
            # Stream the orchestration process
            async for event in orchestrator.execute_task_stream(
                server=server,
                prompt=request.prompt,
                context=request.context
            ):
                yield f"data: {json.dumps(event)}\n\n"
            
            # Send completion event
            yield f"data: {json.dumps({'event': 'complete'})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming orchestration failed: {e}")
            yield f"data: {json.dumps({'event': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable Nginx buffering
        }
    )

# Tool invocation endpoint
@app.post("/api/invoke")
async def invoke_tool(request: ToolInvocation):
    """
    Directly invoke a tool on a deployed MCP server
    """
    if request.server_id not in server_registry:
        raise HTTPException(status_code=404, detail="Server not found")
    
    server = server_registry[request.server_id]
    if server.status != "deployed":
        raise HTTPException(status_code=400, detail="Server not ready")
    
    try:
        client = MCPClient(server.endpoint)
        await client.connect()
        result = await client.invoke_tool(request.tool_name, request.args)
        await client.close()
        return result
    except Exception as e:
        logger.error(f"Tool invocation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Background tasks
async def auto_deploy_server(server_info: ServerInfo):
    """Auto-deploy a discovered server"""
    try:
        await deploy_server_task(server_info, "auto", None)
    except Exception as e:
        logger.error(f"Auto-deploy failed for {server_info.name}: {e}")

async def deploy_server_task(server_info: ServerInfo, method: str, port: Optional[int]):
    """Deploy a server using the specified method"""
    try:
        deployer = ServerDeployer()
        
        # Clone and inspect repository
        repo_info = await deployer.clone_and_inspect(server_info.github_url)
        
        # Determine deployment method
        if method == "auto":
            method = deployer.determine_method(repo_info)
        
        server_info.deploy_method = method
        
        # Deploy based on method
        if method == "docker":
            endpoint = await deployer.deploy_docker(repo_info, port)
        elif method == "npx":
            endpoint = await deployer.deploy_npx(repo_info, port)
        elif method == "e2b":
            endpoint = await deployer.deploy_e2b(repo_info, port)
        else:
            endpoint = await deployer.deploy_local(repo_info, port)
        
        # Update server info
        server_info.endpoint = endpoint
        server_info.status = "deployed"
        
        # Register server BEFORE discovering capabilities
        server_registry[server_info.id] = server_info
        logger.info(f"Registered server {server_info.name} with ID {server_info.id}")
        
        # Discover MCP capabilities automatically
        logger.info(f"Discovering MCP capabilities for {server_info.name} at {endpoint}")
        capabilities = await discover_mcp_capabilities(endpoint)
        server_info.capabilities = capabilities
        
        # If capabilities were discovered, update server info
        if capabilities and capabilities.get("tools"):
            logger.info(f"Found {len(capabilities['tools'])} tools for {server_info.name}")
            # Store tools and protocol info for Gemini to use
            server_info.capabilities = {
                "tools": capabilities["tools"],
                "resources": capabilities.get("resources", []),
                "protocol": capabilities.get("protocol", "unknown"),
                "endpoint": capabilities.get("endpoint", endpoint),
                "discovered_at": datetime.now().isoformat(),
                "auto_discovered": True
            }
            # Update registry with new capabilities
            server_registry[server_info.id] = server_info
        
        logger.info(f"Successfully deployed {server_info.name} with {len(capabilities.get('tools', []))} tools using {capabilities.get('protocol', 'unknown')} protocol")
        
    except Exception as e:
        logger.error(f"Deployment failed: {e}")
        server_info.status = "failed"
        server_info.error = str(e)
        server_registry[server_info.id] = server_info


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
    
    # Fallback to old method if universal client fails
    if endpoint.startswith("http"):
        # For Context7 and similar HTTP/SSE servers
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
                        # First try JSON-RPC discovery
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
                                    capabilities["tools"] = [
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
                                
                                if capabilities["tools"]:
                                    logger.info(f"Discovered {len(capabilities['tools'])} tools via {disc_url}")
                                    break
                    except Exception as e:
                        logger.debug(f"Discovery attempt failed for {disc_url}: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"HTTP discovery failed: {e}")
    
    elif endpoint.startswith("stdio://"):
        # For stdio-based servers (like npx)
        capabilities["tools"] = [
            {"name": "execute", "description": "Execute command via stdio"}
        ]
    
    return capabilities




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
