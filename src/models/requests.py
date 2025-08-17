"""Pydantic models for API requests and responses"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime


class ServerDiscoveryRequest(BaseModel):
    """Request model for discovering MCP servers from GitHub"""
    query: str = Field(..., description="GitHub search query for MCP servers")
    limit: int = Field(10, description="Maximum number of servers to discover", ge=1, le=100)
    auto_deploy: bool = Field(False, description="Automatically deploy discovered servers")


class ServerInfo(BaseModel):
    """Model representing an MCP server's information"""
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


class DeployRequest(BaseModel):
    """Request model for deploying an MCP server"""
    github_url: str = Field(..., description="GitHub repository URL")
    method: Literal["docker", "npx", "e2b", "auto"] = Field("auto", description="Deployment method")
    port: Optional[int] = Field(None, description="Port for HTTP/WebSocket servers")


class RegisterRequest(BaseModel):
    """Request model for registering an existing MCP server"""
    name: str = Field(..., description="Server name")
    endpoint: str = Field(..., description="Server endpoint URL")
    github_url: Optional[str] = Field(None, description="GitHub repository URL")


class OrchestrationRequest(BaseModel):
    """Request model for orchestrating tasks with Gemini"""
    server_id: str = Field(..., description="ID of the deployed MCP server")
    prompt: str = Field(..., description="Task to execute with Gemini orchestration")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")


class ToolInvocation(BaseModel):
    """Request model for directly invoking a tool on an MCP server"""
    server_id: str
    tool_name: str
    args: Dict[str, Any]