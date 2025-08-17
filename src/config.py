"""Configuration settings for MCP Orchestrator"""

import os
from typing import Optional
from pydantic import BaseModel


class Settings(BaseModel):
    """Application settings with environment variable support"""
    
    # API Settings
    app_name: str = "MCP Orchestrator API"
    app_version: str = "1.0.0"
    app_description: str = "Discover, deploy and orchestrate MCP servers from GitHub with Gemini"
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False
    debug: bool = False
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # GitHub Settings
    github_token: Optional[str] = None
    github_api_base: str = "https://api.github.com"
    
    # Gemini Settings
    gemini_api_key: Optional[str] = None
    
    # Deployment Settings
    default_deploy_port: int = 3000
    deploy_timeout: int = 300  # seconds
    max_concurrent_deployments: int = 5
    
    # Discovery Settings
    max_discovery_limit: int = 100
    default_discovery_limit: int = 10
    cache_ttl: int = 3600  # seconds
    
    # Security Settings
    enable_cors: bool = True
    cors_origins: list = ["*"]
    enable_auth: bool = False
    api_key: Optional[str] = None
    
    # Rate Limiting
    enable_rate_limit: bool = False
    rate_limit_requests: int = 100
    rate_limit_period: int = 60  # seconds
    
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Override with environment variables
        self.github_token = os.getenv("GITHUB_TOKEN", self.github_token)
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", self.gemini_api_key)


# Singleton instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get the singleton Settings instance"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings