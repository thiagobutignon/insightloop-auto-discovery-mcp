"""
MCP Server Discovery and Orchestration API with Enhanced Swagger Documentation
Discovers MCP servers from GitHub, deploys them, and orchestrates with Gemini
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from typing import List, Optional, Dict, Any
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


# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.app_name,
        version=settings.app_version,
        description="""
## 🚀 MCP Orchestrator API

A powerful API for discovering, deploying, and orchestrating Model Context Protocol (MCP) servers.

### Key Features:
- 🔍 **Discovery**: Search and discover MCP servers from GitHub
- 🚢 **Deployment**: Deploy servers using Docker, NPX, or local methods
- 🤖 **Orchestration**: Execute tasks using Gemini AI orchestration
- 📊 **Management**: Monitor and manage deployed servers
- 🔧 **Administration**: Server statistics and cache management

### Authentication:
Currently, no authentication is required. API key support coming soon.

### Rate Limits:
No rate limits are currently enforced.

### Getting Started:
1. Discover available MCP servers using `/api/discover`
2. Deploy a server using `/api/deploy` 
3. Orchestrate tasks using `/api/orchestrate`
        """,
        routes=app.routes,
        tags=[
            {
                "name": "Health",
                "description": "Health check and API information endpoints"
            },
            {
                "name": "Discovery",
                "description": "Discover MCP servers from GitHub repositories"
            },
            {
                "name": "Registration",
                "description": "Register existing MCP servers"
            },
            {
                "name": "Deployment",
                "description": "Deploy MCP servers from GitHub"
            },
            {
                "name": "Server Management",
                "description": "Manage and monitor MCP servers"
            },
            {
                "name": "Orchestration",
                "description": "Execute tasks using Gemini AI orchestration"
            },
            {
                "name": "Tools",
                "description": "Direct tool invocation on MCP servers"
            },
            {
                "name": "Administration",
                "description": "Administrative endpoints for system management"
            }
        ],
        servers=[
            {"url": "http://localhost:8000", "description": "Local development server"},
            {"url": "https://api.mcp-orchestrator.com", "description": "Production server"}
        ]
    )
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


# Create FastAPI app with enhanced configuration
app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Set custom OpenAPI
app.openapi = custom_openapi

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

@app.get(
    "/health",
    tags=["Health"],
    summary="Health Check",
    description="Check if the API is running and healthy",
    response_description="Health status with server statistics",
    responses={
        200: {
            "description": "API is healthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "servers_registered": 5,
                        "version": "1.0.0"
                    }
                }
            }
        }
    }
)
async def health_check():
    """
    Perform a health check on the API.
    
    Returns current health status along with:
    - Number of registered servers
    - API version
    """
    return {
        "status": "healthy",
        "servers_registered": server_manager.get_registry_size(),
        "version": settings.app_version
    }


@app.get(
    "/",
    tags=["Health"],
    summary="API Information",
    description="Get general information about the API",
    response_description="API metadata and available endpoints",
    responses={
        200: {
            "description": "API information",
            "content": {
                "application/json": {
                    "example": {
                        "message": "MCP Orchestrator API",
                        "version": "1.0.0",
                        "endpoints": {
                            "discovery": "/api/discover",
                            "deploy": "/api/deploy",
                            "servers": "/api/servers",
                            "orchestrate": "/api/orchestrate",
                            "docs": "/docs",
                            "health": "/health"
                        }
                    }
                }
            }
        }
    }
)
async def root():
    """
    Root endpoint providing API information and available endpoints.
    """
    return {
        "message": settings.app_name,
        "version": settings.app_version,
        "endpoints": {
            "discovery": "/api/discover",
            "deploy": "/api/deploy",
            "servers": "/api/servers",
            "orchestrate": "/api/orchestrate",
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/health",
            "admin": "/api/admin"
        }
    }


# ==================== Discovery Endpoints ====================

@app.post(
    "/api/discover",
    response_model=List[ServerInfo],
    tags=["Discovery"],
    summary="Discover MCP Servers",
    description="Search GitHub for MCP server repositories",
    response_description="List of discovered MCP servers",
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "Successfully discovered servers",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "abc123def456",
                            "name": "modelcontextprotocol/server-name",
                            "github_url": "https://github.com/modelcontextprotocol/server-name",
                            "description": "An MCP server for specific functionality",
                            "deploy_method": "auto",
                            "status": "discovered",
                            "endpoint": None,
                            "capabilities": None,
                            "created_at": "2024-01-01T00:00:00",
                            "error": None
                        }
                    ]
                }
            }
        },
        400: {"description": "Invalid request parameters"},
        500: {"description": "Internal server error during discovery"}
    }
)
async def discover_servers(
    request: ServerDiscoveryRequest,
    background_tasks: BackgroundTasks
):
    """
    Discover MCP servers from GitHub based on search query.
    
    - **query**: GitHub search query (e.g., "mcp-server", "context-protocol")
    - **limit**: Maximum number of servers to discover (1-100)
    - **auto_deploy**: If true, automatically deploy discovered servers
    
    The discovery process searches GitHub repositories for MCP-compatible servers
    and caches the results for faster subsequent access.
    """
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

@app.post(
    "/api/register",
    response_model=ServerInfo,
    tags=["Registration"],
    summary="Register External Server",
    description="Register an existing MCP server that is already running",
    response_description="Registered server information",
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "Server successfully registered",
            "content": {
                "application/json": {
                    "example": {
                        "id": "xyz789abc123",
                        "name": "my-mcp-server",
                        "github_url": "https://github.com/user/my-mcp-server",
                        "deploy_method": "external",
                        "status": "deployed",
                        "endpoint": "http://localhost:3000",
                        "capabilities": {
                            "tools": ["tool1", "tool2"],
                            "resources": [],
                            "protocol": "http"
                        },
                        "created_at": "2024-01-01T00:00:00",
                        "error": None
                    }
                }
            }
        },
        500: {"description": "Failed to register server"}
    }
)
async def register_server(request: RegisterRequest):
    """
    Register an existing MCP server that is already running.
    
    - **name**: Display name for the server
    - **endpoint**: URL where the server is accessible
    - **github_url**: Optional GitHub repository URL
    
    The system will automatically discover the server's capabilities after registration.
    """
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

@app.post(
    "/api/deploy",
    response_model=ServerInfo,
    tags=["Deployment"],
    summary="Deploy MCP Server",
    description="Deploy a specific MCP server from GitHub",
    response_description="Deployment status information",
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        202: {
            "description": "Deployment initiated",
            "content": {
                "application/json": {
                    "example": {
                        "id": "def456ghi789",
                        "name": "mcp-server",
                        "github_url": "https://github.com/org/mcp-server",
                        "deploy_method": "docker",
                        "status": "discovered",
                        "endpoint": None,
                        "capabilities": None,
                        "created_at": "2024-01-01T00:00:00",
                        "error": None
                    }
                }
            }
        },
        500: {"description": "Deployment request failed"}
    }
)
async def deploy_server(request: DeployRequest, background_tasks: BackgroundTasks):
    """
    Deploy a specific MCP server from GitHub.
    
    - **github_url**: Full GitHub repository URL
    - **method**: Deployment method (docker, npx, e2b, auto)
    - **port**: Optional port for HTTP/WebSocket servers
    
    Deployment happens asynchronously in the background.
    Check server status using GET /api/servers/{id}
    """
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

@app.get(
    "/api/servers",
    response_model=List[ServerInfo],
    tags=["Server Management"],
    summary="List All Servers",
    description="Get a list of all discovered and deployed MCP servers",
    response_description="List of servers with optional filtering",
    responses={
        200: {
            "description": "List of servers",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "abc123",
                            "name": "server-1",
                            "status": "deployed",
                            "deploy_method": "docker"
                        },
                        {
                            "id": "def456",
                            "name": "server-2",
                            "status": "discovered",
                            "deploy_method": "auto"
                        }
                    ]
                }
            }
        }
    }
)
async def list_servers(
    status: Optional[str] = Query(
        None,
        description="Filter by status (discovered, validated, deployed, failed)",
        enum=["discovered", "validated", "deployed", "failed"]
    ),
    method: Optional[str] = Query(
        None,
        description="Filter by deployment method",
        enum=["docker", "npx", "e2b", "local", "auto", "external"]
    )
):
    """
    List all discovered and deployed MCP servers.
    
    Optional query parameters for filtering:
    - **status**: Filter by server status
    - **method**: Filter by deployment method
    """
    return server_manager.filter_servers(status=status, method=method)


@app.get(
    "/api/servers/{server_id}",
    response_model=ServerInfo,
    tags=["Server Management"],
    summary="Get Server Details",
    description="Get detailed information about a specific MCP server",
    response_description="Server details including capabilities",
    responses={
        200: {"description": "Server found"},
        404: {"description": "Server not found"}
    }
)
async def get_server(server_id: str):
    """
    Get details of a specific MCP server by ID.
    
    Returns complete server information including:
    - Deployment status
    - Endpoint URL
    - Discovered capabilities
    - Error messages (if any)
    """
    server = server_manager.get_server(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server


@app.delete(
    "/api/servers/{server_id}",
    tags=["Server Management"],
    summary="Delete Server",
    description="Remove a server from registry and cache",
    response_description="Deletion confirmation",
    responses={
        200: {
            "description": "Server deleted successfully",
            "content": {
                "application/json": {
                    "example": {"message": "Server abc123 removed successfully"}
                }
            }
        },
        404: {"description": "Server not found"}
    }
)
async def delete_server(server_id: str):
    """
    Remove a server from the registry and cache.
    
    Note: This does not stop or undeploy the actual server,
    it only removes it from the orchestrator's tracking.
    """
    if not server_manager.remove_server(server_id):
        raise HTTPException(status_code=404, detail="Server not found")
    return {"message": f"Server {server_id} removed successfully"}


# ==================== Orchestration Endpoints ====================

@app.post(
    "/api/orchestrate",
    tags=["Orchestration"],
    summary="Execute Orchestration Task",
    description="Execute a task using Gemini orchestration on a deployed MCP server",
    response_description="Task execution results",
    responses={
        200: {
            "description": "Task executed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "completed",
                        "prompt": "Analyze this data",
                        "result": "Analysis complete",
                        "tools_used": ["tool1", "tool2"]
                    }
                }
            }
        },
        400: {"description": "Server not deployed"},
        404: {"description": "Server not found"},
        500: {"description": "Orchestration failed"}
    }
)
async def orchestrate_task(request: OrchestrationRequest):
    """
    Execute a task using Gemini orchestration on a deployed MCP server.
    
    - **server_id**: ID of the deployed MCP server
    - **prompt**: Task description for Gemini to execute
    - **context**: Optional additional context for the task
    
    Returns complete execution results as JSON.
    """
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


@app.post(
    "/api/orchestrate/stream",
    tags=["Orchestration"],
    summary="Stream Orchestration Task",
    description="Execute a task with Server-Sent Events streaming for real-time updates",
    response_description="SSE stream of orchestration events",
    responses={
        200: {
            "description": "Streaming started",
            "content": {
                "text/event-stream": {
                    "example": "data: {\"event\": \"start\", \"server\": \"mcp-server\"}\n\n"
                }
            }
        },
        400: {"description": "Server not deployed"},
        404: {"description": "Server not found"}
    }
)
async def orchestrate_task_stream(request: OrchestrationRequest):
    """
    Execute a task using Gemini orchestration with Server-Sent Events streaming.
    
    - **server_id**: ID of the deployed MCP server
    - **prompt**: Task description for Gemini to execute
    - **context**: Optional additional context
    
    Returns real-time updates as SSE stream.
    Events include: start, progress, tool_use, complete, error
    """
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

@app.post(
    "/api/invoke",
    tags=["Tools"],
    summary="Invoke Tool Directly",
    description="Directly invoke a specific tool on a deployed MCP server",
    response_description="Tool execution result",
    responses={
        200: {
            "description": "Tool executed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "result": "Tool execution completed",
                        "output": {"key": "value"}
                    }
                }
            }
        },
        400: {"description": "Server not ready"},
        404: {"description": "Server not found"},
        500: {"description": "Tool invocation failed"}
    }
)
async def invoke_tool(request: ToolInvocation):
    """
    Directly invoke a tool on a deployed MCP server.
    
    - **server_id**: ID of the deployed MCP server
    - **tool_name**: Name of the tool to invoke
    - **args**: Arguments to pass to the tool
    
    Bypasses Gemini orchestration for direct tool execution.
    """
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

@app.post(
    "/api/admin/clear-cache",
    tags=["Administration"],
    summary="Clear Discovery Cache",
    description="Clear the discovery cache to force fresh discovery",
    response_description="Cache clear confirmation",
    responses={
        200: {
            "description": "Cache cleared successfully",
            "content": {
                "application/json": {
                    "example": {"message": "Discovery cache cleared"}
                }
            }
        }
    }
)
async def clear_cache():
    """
    Clear the discovery cache.
    
    This removes all cached discovered servers that are not deployed.
    Useful for forcing fresh discovery results.
    """
    server_manager.clear_cache()
    return {"message": "Discovery cache cleared"}


@app.get(
    "/api/admin/stats",
    tags=["Administration"],
    summary="Server Statistics",
    description="Get statistics about registered and discovered servers",
    response_description="Server statistics",
    responses={
        200: {
            "description": "Statistics retrieved",
            "content": {
                "application/json": {
                    "example": {
                        "total_servers": 10,
                        "registered_servers": 5,
                        "deployed_servers": 4,
                        "failed_servers": 1,
                        "discovered_servers": 5
                    }
                }
            }
        }
    }
)
async def get_stats():
    """
    Get server statistics.
    
    Returns counts of servers in various states:
    - Total servers (registered + cached)
    - Registered servers
    - Deployed servers
    - Failed servers
    - Discovered servers
    """
    all_servers = server_manager.list_all_servers()
    return {
        "total_servers": len(all_servers),
        "registered_servers": server_manager.get_registry_size(),
        "deployed_servers": len([s for s in all_servers if s.status == "deployed"]),
        "failed_servers": len([s for s in all_servers if s.status == "failed"]),
        "discovered_servers": len([s for s in all_servers if s.status == "discovered"])
    }


@app.get(
    "/api/admin/config",
    tags=["Administration"],
    summary="Get Configuration",
    description="Get current API configuration settings",
    response_description="Configuration settings",
    responses={
        200: {
            "description": "Configuration retrieved",
            "content": {
                "application/json": {
                    "example": {
                        "app_name": "MCP Orchestrator API",
                        "version": "1.0.0",
                        "debug": False,
                        "cors_enabled": True,
                        "max_discovery_limit": 100,
                        "default_deploy_port": 3000
                    }
                }
            }
        }
    }
)
async def get_config():
    """
    Get current API configuration.
    
    Returns non-sensitive configuration values.
    Sensitive values like API keys are not included.
    """
    return {
        "app_name": settings.app_name,
        "version": settings.app_version,
        "debug": settings.debug,
        "cors_enabled": settings.enable_cors,
        "cors_origins": settings.cors_origins,
        "max_discovery_limit": settings.max_discovery_limit,
        "default_deploy_port": settings.default_deploy_port,
        "rate_limiting_enabled": settings.enable_rate_limit,
        "auth_enabled": settings.enable_auth
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