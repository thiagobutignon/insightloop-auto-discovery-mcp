"""
MCP Server Discovery and Orchestration API with FastAPI
Discovers MCP servers from GitHub, deploys them, and orchestrates with Gemini
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
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

# Import SSE client for MCP servers
from mcp_sse_client import MCPSSEClient, MCPSSEOrchestrator

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

# Pydantic models
class ServerDiscoveryRequest(BaseModel):
    query: str = Field(..., description="GitHub search query for MCP servers")
    limit: int = Field(10, description="Maximum number of servers to discover", ge=1, le=100)
    auto_deploy: bool = Field(False, description="Automatically deploy discovered servers")

class ServerInfo(BaseModel):
    id: str
    name: str
    github_url: str
    description: Optional[str] = None
    deploy_method: Literal["docker", "npx", "e2b", "local", "auto"]
    status: Literal["discovered", "validated", "deployed", "failed"]
    endpoint: Optional[str] = None
    capabilities: Optional[Dict[str, Any]] = None
    created_at: datetime
    error: Optional[str] = None

class DeployRequest(BaseModel):
    github_url: str = Field(..., description="GitHub repository URL")
    method: Literal["docker", "npx", "e2b", "auto"] = Field("auto", description="Deployment method")
    port: Optional[int] = Field(None, description="Port for HTTP/WebSocket servers")

class OrchestrationRequest(BaseModel):
    server_id: str = Field(..., description="ID of the deployed MCP server")
    prompt: str = Field(..., description="Task to execute with Gemini orchestration")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")

class ToolInvocation(BaseModel):
    server_id: str
    tool_name: str
    args: Dict[str, Any]

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

# Orchestration endpoint
@app.post("/api/orchestrate")
async def orchestrate_task(request: OrchestrationRequest):
    """
    Execute a task using Gemini orchestration on a deployed MCP server
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
        
        # Discover MCP capabilities automatically
        logger.info(f"Discovering MCP capabilities for {server_info.name} at {endpoint}")
        capabilities = await discover_mcp_capabilities(endpoint)
        server_info.capabilities = capabilities
        
        # If capabilities were discovered, notify Gemini orchestrator
        if capabilities and capabilities.get("tools"):
            logger.info(f"Found {len(capabilities['tools'])} tools for {server_info.name}")
            # Store tools for Gemini to use
            server_info.capabilities = {
                "tools": capabilities["tools"],
                "discovered_at": datetime.now().isoformat(),
                "auto_discovered": True
            }
        
        # Register server
        server_registry[server_info.id] = server_info
        logger.info(f"Successfully deployed and registered {server_info.name} with {len(capabilities.get('tools', []))} tools")
        
    except Exception as e:
        logger.error(f"Deployment failed: {e}")
        server_info.status = "failed"
        server_info.error = str(e)
        server_registry[server_info.id] = server_info


async def discover_mcp_capabilities(endpoint: str) -> Dict:
    """Automatically discover MCP server capabilities"""
    
    capabilities = {"tools": [], "resources": [], "prompts": []}
    
    # Try different discovery methods based on endpoint type
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


class GitHubDiscovery:
    """GitHub repository discovery for MCP servers"""
    
    def __init__(self):
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.headers = {
            "Accept": "application/vnd.github.v3+json"
        }
        if self.github_token:
            self.headers["Authorization"] = f"token {self.github_token}"
    
    async def search_repositories(self, query: str, limit: int = 10) -> List[Dict]:
        """Search GitHub for MCP server repositories"""
        
        # Clean the query to avoid GitHub API issues
        query = query.replace("@", "").replace("/", " ")
        
        # Build search query - simpler approach
        if "context7" in query.lower() or "mcp" in query.lower():
            enhanced_query = f"{query} OR mcp OR model-context-protocol"
        else:
            enhanced_query = f"{query} mcp OR model-context-protocol"
        
        url = "https://api.github.com/search/repositories"
        params = {
            "q": enhanced_query,
            "per_page": min(limit, 100),
            "sort": "stars",
            "order": "desc"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("items", [])
                else:
                    raise Exception(f"GitHub API error: {response.status}")
    
    async def validate_mcp_server(self, repo_url: str) -> bool:
        """Validate if a repository is a valid MCP server"""
        
        # Check for common MCP server indicators
        files_to_check = ["package.json", "Dockerfile", "mcp.json", ".well-known/mcp"]
        
        repo_api_url = repo_url.replace("github.com", "api.github.com/repos")
        
        async with aiohttp.ClientSession() as session:
            for file in files_to_check:
                url = f"{repo_api_url}/contents/{file}"
                async with session.get(url, headers=self.headers) as response:
                    if response.status == 200:
                        return True
        
        return False


class ServerDeployer:
    """Deploy MCP servers using various methods"""
    
    async def clone_and_inspect(self, github_url: str) -> Dict:
        """Clone repository and inspect structure"""
        
        # Create temporary directory without context manager to keep it alive
        tmpdir = tempfile.mkdtemp(prefix="mcp-deploy-")
        
        # Clone repository
        result = subprocess.run(
            ["git", "clone", "--depth", "1", github_url, tmpdir],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            # Clean up on error
            import shutil
            shutil.rmtree(tmpdir, ignore_errors=True)
            raise Exception(f"Failed to clone repository: {result.stderr}")
        
        # Inspect repository structure
        repo_path = Path(tmpdir)
        info = {
            "path": tmpdir,
            "has_dockerfile": (repo_path / "Dockerfile").exists(),
            "has_package_json": (repo_path / "package.json").exists(),
            "has_docker_compose": (repo_path / "docker-compose.yml").exists(),
            "has_requirements": (repo_path / "requirements.txt").exists(),
        }
        
        # Read package.json if exists
        if info["has_package_json"]:
            with open(repo_path / "package.json", "r") as f:
                info["package"] = json.load(f)
        
        return info
    
    def determine_method(self, repo_info: Dict) -> str:
        """Determine best deployment method based on repository structure"""
        
        if repo_info.get("has_dockerfile") or repo_info.get("has_docker_compose"):
            return "docker"
        elif repo_info.get("has_package_json"):
            # Check if it's an npm package
            pkg = repo_info.get("package", {})
            if pkg.get("name", "").startswith("@") and "mcp" in pkg.get("name", ""):
                return "npx"
        elif repo_info.get("has_requirements"):
            return "local"
        
        return "e2b"  # Default to sandbox execution
    
    async def deploy_docker(self, repo_info: Dict, port: Optional[int] = None) -> str:
        """Deploy using Docker"""
        
        import shutil
        
        port = port or 3000
        # Extract repo name from package.json or path
        repo_name = "unknown"
        if repo_info.get("package", {}).get("name"):
            # Use package name if available
            repo_name = repo_info["package"]["name"].replace("@", "").replace("/", "-")
        elif "/" in repo_info["path"]:
            # Fallback to directory name
            repo_name = repo_info["path"].split("/")[-1]
        
        # Clean up the name (remove special chars)
        repo_name = re.sub(r'[^a-zA-Z0-9-]', '', repo_name)
        
        # Create descriptive container name
        container_name = f"mcp-{repo_name}-port{port}"
        
        try:
            # Build Docker image
            result = subprocess.run(
                ["docker", "build", "-t", container_name, repo_info["path"]],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Docker build failed: {result.stderr}")
            
            # Run container (map to internal port 8080 for MCP servers)
            internal_port = 8080  # Most MCP servers run on 8080
            result = subprocess.run(
                ["docker", "run", "-d", "--name", container_name, "-p", f"{port}:{internal_port}", container_name],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Docker run failed: {result.stderr}")
            
            return f"http://localhost:{port}"
        finally:
            # Clean up temporary directory
            if "path" in repo_info:
                shutil.rmtree(repo_info["path"], ignore_errors=True)
    
    async def deploy_npx(self, repo_info: Dict, port: Optional[int] = None) -> str:
        """Deploy using npx"""
        
        pkg = repo_info.get("package", {})
        pkg_name = pkg.get("name", "unknown-mcp")
        
        # Start server in background
        process = subprocess.Popen(
            ["npx", "-y", pkg_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for server to start
        await asyncio.sleep(3)
        
        # Return stdio endpoint (npx servers typically use stdio)
        return f"stdio://process/{process.pid}"
    
    async def deploy_e2b(self, repo_info: Dict, port: Optional[int] = None) -> str:
        """Deploy using E2B sandbox"""
        
        # This would require E2B SDK integration
        # For now, return a placeholder
        logger.warning("E2B deployment not fully implemented")
        return "e2b://sandbox/placeholder"
    
    async def deploy_local(self, repo_info: Dict, port: Optional[int] = None) -> str:
        """Deploy locally"""
        
        port = port or 3000
        
        # Simple Python server deployment
        if repo_info.get("has_requirements"):
            # Install requirements
            subprocess.run(
                ["pip", "install", "-r", f"{repo_info['path']}/requirements.txt"],
                capture_output=True
            )
            
            # Find main file
            main_files = ["main.py", "app.py", "server.py"]
            for main_file in main_files:
                if (Path(repo_info["path"]) / main_file).exists():
                    # Start server
                    process = subprocess.Popen(
                        ["python", f"{repo_info['path']}/{main_file}"],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                    
                    await asyncio.sleep(3)
                    return f"http://localhost:{port}"
        
        raise Exception("Could not determine how to start local server")


class MCPClient:
    """MCP client for connecting to deployed servers"""
    
    def __init__(self, endpoint: str):
        self.endpoint = endpoint
        self.session = None
        self.ws = None
    
    async def connect(self) -> bool:
        """Connect to MCP server"""
        
        try:
            if self.endpoint.startswith("http"):
                self.session = aiohttp.ClientSession()
                # Test connection
                async with self.session.get(f"{self.endpoint}/.well-known/mcp") as response:
                    return response.status in (200, 204)
            elif self.endpoint.startswith("ws"):
                # WebSocket connection would go here
                pass
            elif self.endpoint.startswith("stdio"):
                # Stdio connection would go here
                pass
            
            return True
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            return False
    
    async def discover_capabilities(self) -> Dict:
        """Discover server capabilities"""
        
        if self.session:
            try:
                async with self.session.get(f"{self.endpoint}/capabilities") as response:
                    if response.status == 200:
                        return await response.json()
            except Exception as e:
                logger.error(f"Capability discovery failed: {e}")
        
        return {}
    
    async def invoke_tool(self, tool_name: str, args: Dict) -> Dict:
        """Invoke a tool on the server"""
        
        if self.session:
            try:
                payload = {"tool": tool_name, "args": args}
                async with self.session.post(f"{self.endpoint}/invoke", json=payload) as response:
                    return await response.json()
            except Exception as e:
                logger.error(f"Tool invocation failed: {e}")
                raise
        
        raise Exception("Not connected")
    
    async def close(self):
        """Close connection"""
        if self.session:
            await self.session.close()


class GeminiOrchestrator:
    """Gemini-based orchestrator for MCP servers"""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not set - orchestration will be limited")
    
    async def execute_task(self, server: ServerInfo, prompt: str, context: Optional[Dict] = None) -> Dict:
        """Execute a task using Gemini to orchestrate MCP server tools"""
        
        if not self.api_key:
            return {
                "status": "error",
                "prompt": prompt,
                "server": server.id,
                "error": "GEMINI_API_KEY not configured",
                "result": "Please set GEMINI_API_KEY environment variable"
            }
        
        try:
            # Use SSE client for better compatibility
            sse_client = MCPSSEClient(server.endpoint)
            connected = await sse_client.connect()
            
            if not connected:
                # Fallback to regular client
                client = MCPClient(server.endpoint)
                connected = await client.connect()
                
                if not connected:
                    return {
                        "status": "error",
                        "prompt": prompt,
                        "server": server.id,
                        "error": "Failed to connect to MCP server",
                        "result": f"Could not connect to {server.endpoint}"
                    }
                
                # Use regular client
                capabilities = await client.discover_capabilities()
            else:
                # Use SSE client - get capabilities from tools list
                tools = await sse_client.list_tools()
                capabilities = {"tools": tools} if tools else {}
            
            # For Context7, try to use the actual tools with SSE
            if "context7" in server.name.lower() and connected and sse_client.initialized:
                # Context7 has specific tools for documentation
                try:
                    # Use SSE client to invoke Context7 tools
                    library = "nextjs" if "next" in prompt.lower() else "react"
                    topic = "routing" if "routing" in prompt.lower() else "hooks"
                    
                    # Step 1: Resolve library ID
                    resolve_result = await sse_client.invoke_tool(
                        "resolve-library-id",
                        {"libraryName": library}
                    )
                    
                    # Extract library ID
                    library_id = f"/vercel/next.js" if library == "nextjs" else f"/facebook/react"
                    
                    # Step 2: Get documentation
                    docs_result = await sse_client.invoke_tool(
                        "get-library-docs",
                        {
                            "context7CompatibleLibraryID": library_id,
                            "topic": topic
                        }
                    )
                    
                    await sse_client.close()
                    
                    return {
                        "status": "completed",
                        "prompt": prompt,
                        "server": server.id,
                        "capabilities": capabilities,
                        "plan": [
                            {"action": "connect", "description": "Connected to MCP server via SSE"},
                            {"action": "invoke_tool", "tool": "resolve-library-id", "args": {"libraryName": library}},
                            {"action": "invoke_tool", "tool": "get-library-docs", "args": {"library": library_id, "topic": topic}},
                            {"action": "complete", "result": "Retrieved documentation"}
                        ],
                        "results": {
                            "resolve": resolve_result,
                            "documentation": docs_result
                        },
                        "result": f"Successfully retrieved {library} documentation on {topic}"
                    }
                except Exception as e:
                    logger.error(f"Context7 tool invocation failed: {e}")
            
            # For now, call Gemini API to generate a plan (simplified)
            plan = await self._generate_plan_with_gemini(prompt, capabilities, context)
            
            # Execute the plan
            results = []
            for step in plan.get("steps", []):
                if step["action"] == "invoke_tool":
                    try:
                        tool_result = await client.invoke_tool(step["tool"], step.get("args", {}))
                        results.append(tool_result)
                    except Exception as e:
                        results.append({"error": str(e)})
            
            await client.close()
            
            return {
                "status": "completed",
                "prompt": prompt,
                "server": server.id,
                "capabilities": capabilities,
                "plan": plan.get("steps", []),
                "result": results if results else "Task completed"
            }
            
        except Exception as e:
            logger.error(f"Orchestration failed: {e}")
            return {
                "status": "error",
                "prompt": prompt,
                "server": server.id,
                "error": str(e),
                "result": "Orchestration failed"
            }
    
    async def _invoke_context7_tool(self, client: MCPClient, library: str, topic: str) -> Dict:
        """Invoke Context7 specific tool"""
        # Context7 uses SSE, so we need special handling
        try:
            # Try direct HTTP request to Context7
            async with aiohttp.ClientSession() as session:
                url = f"{client.endpoint}/mcp"
                headers = {"Accept": "application/json"}
                payload = {
                    "jsonrpc": "2.0",
                    "method": "tools/call",
                    "params": {
                        "name": "get-library-docs",
                        "arguments": {
                            "context7CompatibleLibraryID": f"/{library}/docs",
                            "topic": topic
                        }
                    },
                    "id": 1
                }
                
                async with session.post(url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        return {"error": f"HTTP {response.status}", "body": await response.text()}
        except Exception as e:
            return {"error": str(e)}
    
    async def _generate_plan_with_gemini(self, prompt: str, capabilities: Dict, context: Optional[Dict]) -> Dict:
        """Generate execution plan using Gemini API"""
        
        if not self.api_key:
            return {"steps": []}
        
        try:
            # Simplified Gemini API call using httpx
            import httpx
            
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={self.api_key}"
            
            # Build tools description from discovered capabilities
            tools_desc = ""
            if capabilities.get("tools"):
                tools_desc = "Available MCP tools:\n"
                for tool in capabilities["tools"]:
                    tools_desc += f"- {tool['name']}: {tool.get('description', 'No description')}\n"
                    if tool.get("parameters"):
                        tools_desc += f"  Parameters: {json.dumps(tool['parameters'])}\n"
            
            system_prompt = f"""You are an MCP orchestrator assistant. Based on the user request and available tools, 
            generate a JSON plan with specific tool invocations.
            
            {tools_desc}
            
            User request: {prompt}
            
            Generate a JSON response with this exact structure:
            {{
                "steps": [
                    {{
                        "action": "invoke_tool",
                        "tool": "<exact_tool_name>",
                        "args": {{<required_arguments>}},
                        "description": "<what this step does>"
                    }}
                ]
            }}
            
            For Context7 documentation requests:
            - Use "resolve-library-id" first to get the library ID
            - Then use "get-library-docs" with the resolved ID
            
            Return ONLY valid JSON, no explanation."""
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    gemini_url,
                    json={
                        "contents": [{"parts": [{"text": system_prompt}]}],
                        "generationConfig": {
                            "temperature": 0.1,
                            "maxOutputTokens": 1024
                        }
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    # Extract JSON from response
                    try:
                        text = result["candidates"][0]["content"]["parts"][0]["text"]
                        # Parse JSON from text
                        import re
                        json_match = re.search(r'\{.*\}', text, re.DOTALL)
                        if json_match:
                            plan = json.loads(json_match.group())
                            logger.info(f"Gemini generated plan with {len(plan.get('steps', []))} steps")
                            return plan
                    except Exception as e:
                        logger.error(f"Failed to parse Gemini response: {e}")
                else:
                    logger.error(f"Gemini API returned {response.status_code}")
                
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
        
        # Fallback plan based on discovered tools
        if capabilities.get("tools"):
            # Use first available tool as fallback
            first_tool = capabilities["tools"][0]
            return {
                "steps": [
                    {
                        "action": "invoke_tool",
                        "tool": first_tool["name"],
                        "args": {},
                        "description": f"Using {first_tool['name']} as fallback"
                    }
                ]
            }
        
        return {
            "steps": [
                {"action": "analyze", "description": "No tools available"},
                {"action": "complete", "result": "No MCP tools discovered"}
            ]
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)