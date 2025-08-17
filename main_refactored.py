"""
MCP Server Discovery and Orchestration API with FastAPI (Refactored)
Discovers MCP servers from GitHub, deploys them, and orchestrates with Gemini
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
from contextlib import asynccontextmanager
import logging
import json

# Import from organized module structure
from src.config import get_settings
from src.managers.server_manager import get_server_manager
from src.clients.mcp_client import MCPClient
from src.orchestrators import GeminiOrchestrator
from src.discovery.github import GitHubDiscovery
from src.discovery.capabilities import discover_mcp_capabilities
from src.tasks.background_tasks import auto_deploy_server, deploy_server_task
from src.models.requests import (
    ServerDiscoveryRequest,
    ServerInfo,
    DeployRequest,
    RegisterRequest,
    OrchestrationRequest,
    ToolInvocation
)

# Get configuration
settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format=settings.log_format
)
logger = logging.getLogger("mcp_orchestrator")

# Get server manager
server_manager = get_server_manager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.app_name}")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
    lifespan=lifespan
)

# Add CORS middleware if enabled
if settings.enable_cors:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# ==================== Health & Info Endpoints ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "servers_registered": server_manager.get_registry_size(),
        "version": settings.app_version
    }


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": settings.app_name,
        "version": settings.app_version,
        "endpoints": {
            "discovery": "/api/discover",
            "deploy": "/api/deploy",
            "servers": "/api/servers",
            "orchestrate": "/api/orchestrate",
            "docs": "/docs",
            "health": "/health"
        }
    }


# ==================== Discovery Endpoints ====================

@app.post("/api/discover", response_model=List[ServerInfo])
async def discover_servers(request: ServerDiscoveryRequest, background_tasks: BackgroundTasks):
    """Discover MCP servers from GitHub based on search query"""
    try:
        # Validate limit
        if request.limit > settings.max_discovery_limit:
            raise HTTPException(
                status_code=400,
                detail=f"Limit exceeds maximum of {settings.max_discovery_limit}"
            )
        
        discovery = GitHubDiscovery()
        repos = await discovery.search_repositories(request.query, request.limit)
        
        servers = []
        for repo in repos:
            server_id = server_manager.generate_server_id(repo["html_url"])
            
            # Check cache first
            if server_manager.is_server_cached(server_id):
                servers.append(server_manager.get_server(server_id))
                continue
            
            # Create new server info
            server_info = ServerInfo(
                id=server_id,
                name=repo["full_name"],
                github_url=repo["html_url"],
                description=repo.get("description"),
                deploy_method="auto",
                status="discovered",
                created_at=datetime.now()
            )
            
            # Cache the server
            server_manager.cache_discovered_server(server_info)
            servers.append(server_info)
            
            # Auto-deploy if requested
            if request.auto_deploy:
                background_tasks.add_task(auto_deploy_server, server_info)
        
        return servers
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Discovery failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Registration Endpoints ====================

@app.post("/api/register", response_model=ServerInfo)
async def register_server(request: RegisterRequest):
    """Register an existing MCP server that is already running"""
    try:
        server_id = server_manager.generate_server_id(request.endpoint)
        
        # Check if already registered
        if server_manager.is_server_registered(server_id):
            return server_manager.get_server(server_id)
        
        # Create server info
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
        server_manager.register_server(server_info)
        logger.info(f"Registered external server {request.name} with {len(capabilities.get('tools', []))} tools")
        
        return server_info
        
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Deployment Endpoints ====================

@app.post("/api/deploy", response_model=ServerInfo)
async def deploy_server(request: DeployRequest, background_tasks: BackgroundTasks):
    """Deploy a specific MCP server from GitHub"""
    try:
        server_id = server_manager.generate_server_id(request.github_url)
        
        # Check if already deployed
        if server_manager.is_server_deployed(server_id):
            return server_manager.get_server(server_id)
        
        # Create server info
        server_info = ServerInfo(
            id=server_id,
            name=request.github_url.split("/")[-1],
            github_url=request.github_url,
            deploy_method=request.method,
            status="discovered",
            created_at=datetime.now()
        )
        
        # Cache the server
        server_manager.cache_discovered_server(server_info)
        
        # Start deployment in background
        background_tasks.add_task(
            deploy_server_task, 
            server_info, 
            request.method, 
            request.port or settings.default_deploy_port
        )
        
        return server_info
        
    except Exception as e:
        logger.error(f"Deploy request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Server Management Endpoints ====================

@app.get("/api/servers", response_model=List[ServerInfo])
async def list_servers(
    status: Optional[str] = Query(None, description="Filter by status"),
    method: Optional[str] = Query(None, description="Filter by deploy method")
):
    """List all discovered and deployed MCP servers"""
    return server_manager.filter_servers(status=status, method=method)


@app.get("/api/servers/{server_id}", response_model=ServerInfo)
async def get_server(server_id: str):
    """Get details of a specific MCP server"""
    server = server_manager.get_server(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server


@app.delete("/api/servers/{server_id}")
async def delete_server(server_id: str):
    """Remove a server from registry and cache"""
    if not server_manager.remove_server(server_id):
        raise HTTPException(status_code=404, detail="Server not found")
    return {"message": f"Server {server_id} removed successfully"}


# ==================== Orchestration Endpoints ====================

@app.post("/api/orchestrate")
async def orchestrate_task(request: OrchestrationRequest):
    """Execute a task using Gemini orchestration on a deployed MCP server"""
    server = server_manager.get_server(request.server_id)
    
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if not server_manager.is_server_deployed(request.server_id):
        raise HTTPException(status_code=400, detail="Server not deployed")
    
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


@app.post("/api/orchestrate/stream")
async def orchestrate_task_stream(request: OrchestrationRequest):
    """Execute a task using Gemini orchestration with Server-Sent Events streaming"""
    server = server_manager.get_server(request.server_id)
    
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if not server_manager.is_server_deployed(request.server_id):
        raise HTTPException(status_code=400, detail="Server not deployed")
    
    async def event_generator():
        """Generate SSE events for orchestration progress"""
        try:
            yield f"data: {json.dumps({'event': 'start', 'server': server.name, 'prompt': request.prompt})}\n\n"
            
            orchestrator = GeminiOrchestrator()
            
            async for event in orchestrator.execute_task_stream(
                server=server,
                prompt=request.prompt,
                context=request.context
            ):
                yield f"data: {json.dumps(event)}\n\n"
            
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
            "X-Accel-Buffering": "no"
        }
    )


# ==================== Tool Invocation Endpoints ====================

@app.post("/api/invoke")
async def invoke_tool(request: ToolInvocation):
    """Directly invoke a tool on a deployed MCP server"""
    server = server_manager.get_server(request.server_id)
    
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if not server_manager.is_server_deployed(request.server_id):
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


# ==================== Admin Endpoints ====================

@app.post("/api/admin/clear-cache")
async def clear_cache():
    """Clear the discovery cache (admin endpoint)"""
    server_manager.clear_cache()
    return {"message": "Discovery cache cleared"}


@app.get("/api/admin/stats")
async def get_stats():
    """Get server statistics (admin endpoint)"""
    all_servers = server_manager.list_all_servers()
    return {
        "total_servers": len(all_servers),
        "registered_servers": server_manager.get_registry_size(),
        "deployed_servers": len([s for s in all_servers if s.status == "deployed"]),
        "failed_servers": len([s for s in all_servers if s.status == "failed"]),
        "discovered_servers": len([s for s in all_servers if s.status == "discovered"])
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower()
    )