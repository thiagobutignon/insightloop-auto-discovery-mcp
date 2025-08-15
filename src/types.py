"""
Shared type definitions for the MCP Orchestrator API
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from datetime import datetime


class ServerInfo(BaseModel):
    """Information about an MCP server"""
    id: str
    name: str
    github_url: str
    description: Optional[str] = None
    deploy_method: Literal["docker", "npx", "e2b", "local", "auto", "external"]
    status: Literal["discovered", "validated", "deployed", "failed"]
    endpoint: Optional[str] = None
    capabilities: Optional[Dict[str, Any]] = None
    created_at: datetime
    error: Optional[str] = None