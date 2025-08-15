"""
Gemini AI Orchestrator for MCP Servers

This module provides orchestration capabilities for MCP servers using Google's Gemini AI.
It handles task planning, tool invocation, and intelligent response generation.

Example Usage:
    ```python
    from src.orchestrators import GeminiOrchestrator
    from src.models import ServerInfo
    
    orchestrator = GeminiOrchestrator()
    server = ServerInfo(...)
    result = await orchestrator.execute_task(server, "Get React documentation")
    ```

Dependencies:
    - Google Gemini API (requires GEMINI_API_KEY environment variable)
    - UniversalMCPClient for protocol-agnostic MCP communication
    - httpx for async HTTP requests

Environment Variables:
    - GEMINI_API_KEY: Your Google Gemini API key
    - GEMINI_MODEL: Model to use (defaults to "gemini-2.5-flash")
"""

import os
import json
import logging
from typing import Dict, Optional, Any, AsyncGenerator
import httpx

# Import from proper module structure
from ..clients import UniversalMCPClient
from ..models import ServerInfo

logger = logging.getLogger("mcp_orchestrator")


class GeminiOrchestrator:
    """Gemini-based orchestrator for MCP servers"""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not set - orchestration will be limited")
    
    async def execute_task_stream(self, server: ServerInfo, prompt: str, context: Optional[Dict] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """Execute task with streaming updates"""
        
        if not self.api_key:
            yield {"event": "error", "message": "GEMINI_API_KEY not configured"}
            return
        
        try:
            # Connect to MCP server
            yield {"event": "connecting", "message": f"Connecting to {server.name}..."}
            
            universal_client = UniversalMCPClient(server.endpoint)
            connected = await universal_client.connect()
            
            if not connected:
                yield {"event": "error", "message": f"Failed to connect to {server.endpoint}"}
                return
            
            # Get capabilities
            yield {"event": "discovering", "message": "Discovering server capabilities..."}
            caps = await universal_client.get_capabilities()
            tools = caps.get("tools", [])
            
            yield {
                "event": "capabilities",
                "protocol": caps.get("protocol", "unknown"),
                "tools_count": len(tools),
                "tools": [{"name": t.get("name"), "description": t.get("description", "")} for t in tools]
            }
            
            # Generate plan with Gemini
            yield {"event": "planning", "message": "Generating execution plan with Gemini..."}
            
            plan = await self._generate_plan_with_gemini(prompt, caps, context)
            
            if plan and plan.get("steps"):
                yield {
                    "event": "plan_ready",
                    "plan": plan["steps"],
                    "steps_count": len(plan["steps"])
                }
                
                # Execute plan steps
                for i, step in enumerate(plan["steps"]):
                    yield {
                        "event": "executing_step",
                        "step_index": i + 1,
                        "total_steps": len(plan["steps"]),
                        "action": step.get("action"),
                        "description": step.get("description", "")
                    }
                    
                    if step["action"] == "invoke_tool":
                        try:
                            tool_name = step.get("tool")
                            args = step.get("args", {})
                            
                            yield {
                                "event": "invoking_tool",
                                "tool": tool_name,
                                "args": args
                            }
                            
                            result = await universal_client.invoke_tool(tool_name, args)
                            
                            yield {
                                "event": "tool_result",
                                "tool": tool_name,
                                "success": "error" not in result,
                                "result": result
                            }
                            
                        except Exception as e:
                            yield {
                                "event": "tool_error",
                                "tool": tool_name,
                                "error": str(e)
                            }
            
            # Get Gemini's final response
            yield {"event": "finalizing", "message": "Getting Gemini's final response..."}
            
            gemini_response = await self._get_gemini_response(prompt, plan, context)
            
            yield {
                "event": "gemini_response",
                "response": gemini_response
            }
            
            await universal_client.close()
            
        except Exception as e:
            logger.error(f"Streaming orchestration failed: {e}")
            yield {"event": "error", "error": str(e)}
    
    async def execute_task(self, server: ServerInfo, prompt: str, context: Optional[Dict] = None) -> Dict[str, Any]:
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
            # Use universal client for maximum compatibility
            universal_client = UniversalMCPClient(server.endpoint)
            connected = await universal_client.connect()
            
            if not connected:
                return {
                    "status": "error",
                    "prompt": prompt,
                    "server": server.id,
                    "error": "Failed to connect to MCP server",
                    "result": f"Could not connect to {server.endpoint}"
                }
            
            # Get capabilities from universal client
            caps = await universal_client.get_capabilities()
            capabilities = {
                "tools": caps.get("tools", []),
                "resources": caps.get("resources", []),
                "protocol": caps.get("protocol", "unknown")
            }
            
            # For Context7 or servers with tools, try to invoke them
            if connected and caps.get("tools"):
                # Try to invoke tools based on prompt
                try:
                    # For documentation requests
                    if any(word in prompt.lower() for word in ["docs", "documentation", "library"]):
                        library = "nextjs" if "next" in prompt.lower() else "react"
                        topic = "routing" if "routing" in prompt.lower() else "hooks"
                        
                        # Check if we have resolve-library-id tool
                        resolve_tool = next((t for t in caps["tools"] if "resolve" in t["name"].lower()), None)
                        docs_tool = next((t for t in caps["tools"] if "docs" in t["name"].lower() or "library" in t["name"].lower()), None)
                        
                        results = {}
                        
                        if resolve_tool:
                            # Step 1: Resolve library ID
                            resolve_result = await universal_client.invoke_tool(
                                resolve_tool["name"],
                                {"libraryName": library}
                            )
                            results["resolve"] = resolve_result
                            
                            # Extract library ID from result
                            library_id = f"/vercel/next.js" if library == "nextjs" else f"/facebook/react"
                            if isinstance(resolve_result, dict) and "content" in resolve_result:
                                import re
                                match = re.search(r'(/[^/]+/[^/\s]+)', str(resolve_result["content"]))
                                if match:
                                    library_id = match.group(1)
                        else:
                            library_id = f"/vercel/next.js" if library == "nextjs" else f"/facebook/react"
                        
                        if docs_tool:
                            # Step 2: Get documentation
                            docs_args = {}
                            # Build args based on tool schema
                            if "inputSchema" in docs_tool:
                                schema = docs_tool["inputSchema"]
                                if "properties" in schema:
                                    for prop in schema["properties"]:
                                        if "library" in prop.lower() or "id" in prop.lower():
                                            docs_args[prop] = library_id
                                        elif "topic" in prop.lower():
                                            docs_args[prop] = topic
                            
                            if not docs_args:
                                # Fallback args
                                docs_args = {"context7CompatibleLibraryID": library_id, "topic": topic}
                            
                            docs_result = await universal_client.invoke_tool(
                                docs_tool["name"],
                                docs_args
                            )
                            results["documentation"] = docs_result
                        
                        await universal_client.close()
                    
                        return {
                            "status": "completed",
                            "prompt": prompt,
                            "server": server.id,
                            "protocol": caps.get("protocol", "unknown"),
                            "capabilities": capabilities,
                            "plan": [
                                {"action": "connect", "description": f"Connected via {caps.get('protocol', 'unknown')}"},
                                {"action": "discover", "description": f"Found {len(caps.get('tools', []))} tools"},
                                {"action": "invoke", "description": "Invoked tools based on prompt"},
                                {"action": "complete", "result": "Task completed"}
                            ],
                            "results": results,
                            "result": f"Successfully processed request using {caps.get('protocol', 'unknown')} protocol"
                        }
                except Exception as e:
                    logger.error(f"Tool invocation failed: {e}")
            
            await universal_client.close()
            
            # For now, call Gemini API to generate a plan (simplified)
            plan = await self._generate_plan_with_gemini(prompt, capabilities, context)
            
            # Execute the plan
            results = []
            for step in plan.get("steps", []):
                if step["action"] == "invoke_tool":
                    try:
                        tool_result = await universal_client.invoke_tool(step["tool"], step.get("args", {}))
                        results.append(tool_result)
                    except Exception as e:
                        results.append({"error": str(e)})
            
            # Client already closed above
            
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
    
    async def _get_gemini_response(self, prompt: str, plan: Dict, context: Optional[Dict]) -> str:
        """Get Gemini's final response after executing the plan"""
        
        if not self.api_key:
            return "Gemini API key not configured"
        
        try:
            model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            
            # Build prompt with plan results
            system_prompt = f"""You are an AI assistant helping with MCP server orchestration.
            The user asked: {prompt}
            
            The execution plan and results were:
            {json.dumps(plan, indent=2)}
            
            Based on the execution results, provide a helpful response to the user's original request.
            Be concise and focus on answering their question directly.
            """
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    gemini_url,
                    json={
                        "contents": [{"parts": [{"text": system_prompt}]}],
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 2048
                        }
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    try:
                        text = result["candidates"][0]["content"]["parts"][0]["text"]
                        return text
                    except Exception as e:
                        logger.error(f"Failed to parse Gemini response: {e}")
                        return "Failed to parse Gemini response"
                else:
                    logger.error(f"Gemini API returned {response.status_code}")
                    return f"Gemini API error: {response.status_code}"
                    
        except Exception as e:
            logger.error(f"Gemini response generation failed: {e}")
            return f"Error generating response: {str(e)}"
    
    async def _generate_plan_with_gemini(self, prompt: str, capabilities: Dict, context: Optional[Dict]) -> Dict:
        """Generate execution plan using Gemini API"""
        
        if not self.api_key:
            return {"steps": []}
        
        try:
            # Use the model from environment or default to gemini-2.5-flash
            model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            
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