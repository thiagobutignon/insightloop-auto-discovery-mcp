"""Server Manager - Centralized management of MCP servers"""

import hashlib
from typing import Dict, List, Optional
from datetime import datetime
import logging
from src.models.requests import ServerInfo

logger = logging.getLogger("mcp_orchestrator")


class ServerManager:
    """Manages MCP server registry and discovery cache"""
    
    def __init__(self):
        self.server_registry: Dict[str, ServerInfo] = {}
        self.discovery_cache: Dict[str, ServerInfo] = {}
    
    def generate_server_id(self, identifier: str) -> str:
        """Generate a unique server ID from an identifier"""
        return hashlib.md5(identifier.encode()).hexdigest()[:12]
    
    def register_server(self, server: ServerInfo) -> ServerInfo:
        """Register a server in the registry"""
        self.server_registry[server.id] = server
        logger.info(f"Registered server {server.name} with ID {server.id}")
        return server
    
    def cache_discovered_server(self, server: ServerInfo) -> ServerInfo:
        """Cache a discovered server"""
        self.discovery_cache[server.id] = server
        return server
    
    def get_server(self, server_id: str) -> Optional[ServerInfo]:
        """Get a server by ID from registry or cache"""
        return self.server_registry.get(server_id) or self.discovery_cache.get(server_id)
    
    def is_server_deployed(self, server_id: str) -> bool:
        """Check if a server is deployed"""
        server = self.server_registry.get(server_id)
        return server and server.status == "deployed"
    
    def is_server_registered(self, server_id: str) -> bool:
        """Check if a server is in the registry"""
        return server_id in self.server_registry
    
    def is_server_cached(self, server_id: str) -> bool:
        """Check if a server is in the discovery cache"""
        return server_id in self.discovery_cache
    
    def list_all_servers(self) -> List[ServerInfo]:
        """List all servers from registry and cache"""
        servers = list(self.server_registry.values()) + list(self.discovery_cache.values())
        
        # Remove duplicates
        unique_servers = {s.id: s for s in servers}
        return list(unique_servers.values())
    
    def filter_servers(
        self, 
        status: Optional[str] = None, 
        method: Optional[str] = None
    ) -> List[ServerInfo]:
        """Filter servers by status and/or deployment method"""
        servers = self.list_all_servers()
        
        if status:
            servers = [s for s in servers if s.status == status]
        if method:
            servers = [s for s in servers if s.deploy_method == method]
        
        return servers
    
    def update_server_status(
        self, 
        server_id: str, 
        status: str, 
        endpoint: Optional[str] = None,
        error: Optional[str] = None,
        capabilities: Optional[Dict] = None
    ) -> Optional[ServerInfo]:
        """Update server status and related fields"""
        server = self.get_server(server_id)
        if not server:
            return None
        
        server.status = status
        if endpoint:
            server.endpoint = endpoint
        if error:
            server.error = error
        if capabilities:
            server.capabilities = capabilities
        
        # Ensure it's in the registry if deployed
        if status == "deployed" and server_id not in self.server_registry:
            self.server_registry[server_id] = server
        
        return server
    
    def get_registry_size(self) -> int:
        """Get the number of registered servers"""
        return len(self.server_registry)
    
    def clear_cache(self):
        """Clear the discovery cache"""
        self.discovery_cache.clear()
        logger.info("Discovery cache cleared")
    
    def remove_server(self, server_id: str) -> bool:
        """Remove a server from registry and cache"""
        removed = False
        if server_id in self.server_registry:
            del self.server_registry[server_id]
            removed = True
        if server_id in self.discovery_cache:
            del self.discovery_cache[server_id]
            removed = True
        return removed


# Singleton instance
_server_manager: Optional[ServerManager] = None


def get_server_manager() -> ServerManager:
    """Get the singleton ServerManager instance"""
    global _server_manager
    if _server_manager is None:
        _server_manager = ServerManager()
    return _server_manager