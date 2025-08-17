"""Background tasks for MCP server deployment and management"""

import logging
from typing import Optional
from datetime import datetime
from src.models.requests import ServerInfo
from src.deployers.server_deployer import ServerDeployer
from src.discovery.capabilities import discover_mcp_capabilities
from src.managers.server_manager import get_server_manager

logger = logging.getLogger("mcp_orchestrator")


async def auto_deploy_server(server_info: ServerInfo):
    """Auto-deploy a discovered server"""
    try:
        await deploy_server_task(server_info, "auto", None)
    except Exception as e:
        logger.error(f"Auto-deploy failed for {server_info.name}: {e}")


async def deploy_server_task(server_info: ServerInfo, method: str, port: Optional[int]):
    """Deploy a server using the specified method"""
    server_manager = get_server_manager()
    
    try:
        deployer = ServerDeployer()
        
        # Clone and inspect repository
        logger.info(f"Cloning repository {server_info.github_url}")
        repo_info = await deployer.clone_and_inspect(server_info.github_url)
        
        # Determine deployment method
        if method == "auto":
            method = deployer.determine_method(repo_info)
            logger.info(f"Auto-detected deployment method: {method}")
        
        server_info.deploy_method = method
        
        # Deploy based on method
        logger.info(f"Deploying {server_info.name} using {method} method")
        
        if method == "docker":
            endpoint = await deployer.deploy_docker(repo_info, port)
        elif method == "npx":
            endpoint = await deployer.deploy_npx(repo_info, port)
        elif method == "e2b":
            endpoint = await deployer.deploy_e2b(repo_info, port)
        else:
            endpoint = await deployer.deploy_local(repo_info, port)
        
        # Update server info
        server_manager.update_server_status(
            server_info.id,
            status="deployed",
            endpoint=endpoint
        )
        
        logger.info(f"Server {server_info.name} deployed at {endpoint}")
        
        # Discover MCP capabilities automatically
        logger.info(f"Discovering MCP capabilities for {server_info.name} at {endpoint}")
        capabilities = await discover_mcp_capabilities(endpoint)
        
        # Update server with capabilities
        if capabilities and capabilities.get("tools"):
            enhanced_capabilities = {
                "tools": capabilities["tools"],
                "resources": capabilities.get("resources", []),
                "protocol": capabilities.get("protocol", "unknown"),
                "endpoint": capabilities.get("endpoint", endpoint),
                "discovered_at": datetime.now().isoformat(),
                "auto_discovered": True
            }
            
            server_manager.update_server_status(
                server_info.id,
                status="deployed",
                capabilities=enhanced_capabilities
            )
            
            logger.info(
                f"Successfully deployed {server_info.name} with "
                f"{len(capabilities.get('tools', []))} tools using "
                f"{capabilities.get('protocol', 'unknown')} protocol"
            )
        
    except Exception as e:
        logger.error(f"Deployment failed for {server_info.name}: {e}")
        server_manager.update_server_status(
            server_info.id,
            status="failed",
            error=str(e)
        )