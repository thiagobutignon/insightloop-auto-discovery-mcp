"""GitHub repository discovery for MCP servers"""

import os
import aiohttp
from typing import List, Dict
import logging

logger = logging.getLogger("mcp_orchestrator")


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
        
        # Clean the query to avoid GitHub API issues with special characters
        # But preserve forward slashes for specific repo searches like "owner/repo"
        cleaned_query = query.replace("@", "")
        
        # Use the query as-is if it already mentions MCP or specific terms
        # This preserves the user's search intent
        if "mcp" in query.lower() or "model-context-protocol" in query.lower():
            # User is already searching for MCP-related content
            search_query = cleaned_query
        else:
            # Add MCP context only if not already present
            search_query = f"{cleaned_query} (mcp OR model-context-protocol)"
        
        url = "https://api.github.com/search/repositories"
        params = {
            "q": search_query,
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