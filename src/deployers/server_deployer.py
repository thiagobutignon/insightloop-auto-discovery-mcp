"""Deploy MCP servers using various methods"""

import tempfile
import subprocess
import json
import asyncio
import os
import re
import logging
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger("mcp_orchestrator")


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
            
            # Run container with environment variables
            internal_port = 8080  # Most MCP servers run on 8080
            
            # Pass environment variables to container
            docker_run_cmd = [
                "docker", "run", "-d", 
                "--name", container_name,
                "-p", f"{port}:{internal_port}"
            ]
            
            # Add environment variables if needed
            if "github" in container_name.lower():
                github_token = os.getenv("GITHUB_TOKEN", "")
                if github_token:
                    docker_run_cmd.extend(["-e", f"GITHUB_PERSONAL_ACCESS_TOKEN={github_token}"])
                    docker_run_cmd.extend(["-e", f"GITHUB_TOKEN={github_token}"])
            
            # Add Gemini API key if available
            gemini_key = os.getenv("GEMINI_API_KEY", "")
            if gemini_key:
                docker_run_cmd.extend(["-e", f"GEMINI_API_KEY={gemini_key}"])
            
            docker_run_cmd.append(container_name)
            
            result = subprocess.run(
                docker_run_cmd,
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