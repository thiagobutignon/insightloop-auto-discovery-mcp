# InsightLoop MCP Orchestrator API Documentation

## Overview

The InsightLoop MCP Orchestrator API provides endpoints for discovering, deploying, and orchestrating Model Context Protocol (MCP) servers. It integrates with GitHub for discovery, Docker for deployment, and Google Gemini for AI-powered orchestration.

**Base URL**: `http://localhost:8000`  
**API Version**: `1.0.0`

## Table of Contents

1. [Authentication](#authentication)
2. [Core Endpoints](#core-endpoints)
3. [Discovery Endpoints](#discovery-endpoints)
4. [Deployment Endpoints](#deployment-endpoints)
5. [Orchestration Endpoints](#orchestration-endpoints)
6. [Server Management](#server-management)
7. [WebSocket & SSE](#websocket--sse)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

Currently, the API does not require authentication. In production, implement JWT or OAuth2.

```http
# Future implementation
Authorization: Bearer <token>
```

---

## Core Endpoints

### Health Check

Check if the API is running and healthy.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### API Info

Get API metadata and capabilities.

```http
GET /api/info
```

**Response:**
```json
{
  "name": "InsightLoop MCP Orchestrator",
  "version": "1.0.0",
  "capabilities": {
    "discovery": true,
    "deployment": ["docker", "npx", "e2b"],
    "orchestration": true,
    "streaming": true
  }
}
```

---

## Discovery Endpoints

### Discover MCP Servers

Search for MCP servers on GitHub.

```http
POST /api/discover
Content-Type: application/json

{
  "query": "mcp server",
  "filters": {
    "language": "typescript",
    "min_stars": 10,
    "updated_after": "2024-01-01"
  },
  "limit": 20
}
```

**Parameters:**
- `query` (string, optional): Search query for GitHub
- `filters` (object, optional): Additional filters
  - `language` (string): Programming language filter
  - `min_stars` (number): Minimum GitHub stars
  - `updated_after` (string): ISO date for last update
- `limit` (number, optional): Maximum results (default: 20, max: 100)

**Response:**
```json
{
  "servers": [
    {
      "id": "context7-mcp",
      "name": "Context7 MCP Server",
      "description": "Documentation fetcher for libraries",
      "author": "context7",
      "github_url": "https://github.com/context7/context7-mcp",
      "docker_image": "context7/mcp-server:latest",
      "stars": 150,
      "language": "typescript",
      "topics": ["mcp", "documentation", "ai"],
      "capabilities": {
        "tools": ["fetch-docs", "search-code"],
        "resources": [],
        "prompts": []
      },
      "discovered_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "has_more": true
}
```

### Get Server Details

Get detailed information about a specific MCP server.

```http
GET /api/discover/{server_id}
```

**Response:**
```json
{
  "server": {
    "id": "context7-mcp",
    "name": "Context7 MCP Server",
    "description": "Documentation fetcher for libraries",
    "readme": "# Context7 MCP Server\n\n## Installation...",
    "configuration": {
      "required_env": ["API_KEY"],
      "default_port": 3000,
      "protocols": ["http", "sse", "websocket"]
    },
    "tools": [
      {
        "name": "fetch-documentation",
        "description": "Fetch docs for a library",
        "input_schema": {
          "type": "object",
          "properties": {
            "library": { "type": "string" },
            "topic": { "type": "string" }
          }
        }
      }
    ]
  }
}
```

---

## Deployment Endpoints

### Deploy Server

Deploy an MCP server using Docker, NPX, or E2B.

```http
POST /api/deploy/{server_id}
Content-Type: application/json

{
  "method": "docker",
  "configuration": {
    "port": 3000,
    "memory_limit": "512m",
    "cpu_limit": "0.5",
    "environment": {
      "API_KEY": "your-api-key"
    },
    "auto_restart": true
  }
}
```

**Parameters:**
- `method` (string): Deployment method (`docker`, `npx`, `e2b`)
- `configuration` (object): Deployment configuration
  - `port` (number): Port mapping for the container
  - `memory_limit` (string): Memory limit (e.g., "512m", "1g")
  - `cpu_limit` (string): CPU limit (e.g., "0.5", "1")
  - `environment` (object): Environment variables
  - `auto_restart` (boolean): Auto-restart on failure

**Response:**
```json
{
  "deployment": {
    "id": "deploy-123456",
    "server_id": "context7-mcp",
    "status": "running",
    "method": "docker",
    "container_id": "abc123def456",
    "endpoint": "http://localhost:3000",
    "protocol": "http",
    "started_at": "2025-01-15T10:00:00Z",
    "configuration": {
      "port": 3000,
      "memory_limit": "512m",
      "cpu_limit": "0.5"
    }
  }
}
```

### Stop Deployment

Stop a running MCP server deployment.

```http
POST /api/servers/{server_id}/stop
```

**Response:**
```json
{
  "status": "stopped",
  "server_id": "context7-mcp",
  "stopped_at": "2025-01-15T10:05:00Z"
}
```

### Get Deployment Logs

Retrieve logs from a deployed server.

```http
GET /api/servers/{server_id}/logs?lines=100&follow=false
```

**Parameters:**
- `lines` (number, optional): Number of log lines (default: 100)
- `follow` (boolean, optional): Stream logs in real-time

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2025-01-15T10:00:00Z",
      "level": "info",
      "message": "Server started on port 3000",
      "source": "mcp-server"
    }
  ]
}
```

---

## Orchestration Endpoints

### Execute Task

Execute a task using Gemini AI to orchestrate MCP server tools.

```http
POST /api/orchestrate
Content-Type: application/json

{
  "server_id": "context7-mcp",
  "prompt": "Get React documentation about hooks",
  "context": {
    "previous_results": [],
    "user_preferences": {}
  },
  "stream": false
}
```

**Parameters:**
- `server_id` (string): ID of the deployed server
- `prompt` (string): Task description for AI orchestration
- `context` (object, optional): Additional context
- `stream` (boolean, optional): Enable SSE streaming

**Response (non-streaming):**
```json
{
  "task_id": "task-789",
  "status": "completed",
  "prompt": "Get React documentation about hooks",
  "server_id": "context7-mcp",
  "plan": [
    {
      "step": 1,
      "action": "invoke_tool",
      "tool": "resolve-library-id",
      "args": { "libraryName": "react" }
    },
    {
      "step": 2,
      "action": "invoke_tool",
      "tool": "get-library-docs",
      "args": { "libraryId": "/facebook/react", "topic": "hooks" }
    }
  ],
  "results": {
    "documentation": "# React Hooks\n\nHooks are functions that let you...",
    "execution_time": 2.5
  },
  "gemini_response": "Here's the React documentation about hooks..."
}
```

### Stream Task Execution

Execute a task with Server-Sent Events streaming.

```http
GET /api/orchestrate/stream?server_id={server_id}&prompt={prompt}
Accept: text/event-stream
```

**SSE Response Format:**
```
event: connecting
data: {"message": "Connecting to context7-mcp..."}

event: capabilities
data: {"protocol": "http", "tools_count": 5, "tools": [...]}

event: planning
data: {"message": "Generating execution plan with Gemini..."}

event: plan_ready
data: {"plan": [...], "steps_count": 3}

event: executing_step
data: {"step_index": 1, "total_steps": 3, "action": "invoke_tool", "tool": "fetch-docs"}

event: tool_result
data: {"tool": "fetch-docs", "success": true, "result": {...}}

event: gemini_response
data: {"response": "Based on the documentation..."}

event: complete
data: {"task_id": "task-789", "status": "completed"}
```

### Get Task History

Retrieve orchestration task history.

```http
GET /api/tasks?limit=20&offset=0
```

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-789",
      "prompt": "Get React documentation about hooks",
      "server_id": "context7-mcp",
      "status": "completed",
      "created_at": "2025-01-15T10:00:00Z",
      "completed_at": "2025-01-15T10:00:05Z",
      "execution_time": 5.2
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

## Server Management

### List Running Servers

Get all currently running MCP servers.

```http
GET /api/servers/running
```

**Response:**
```json
{
  "servers": [
    {
      "id": "context7-mcp",
      "name": "Context7 MCP Server",
      "status": "running",
      "endpoint": "http://localhost:3000",
      "protocol": "http",
      "container_id": "abc123def456",
      "uptime": 3600,
      "memory_usage": "256MB",
      "cpu_usage": "25%",
      "capabilities": {
        "tools": ["fetch-docs", "search-code"],
        "resources": [],
        "prompts": []
      }
    }
  ],
  "total": 3
}
```

### Update Server Capabilities

Update cached capabilities for a server.

```http
PUT /api/servers/{server_id}/capabilities
Content-Type: application/json

{
  "tools": [...],
  "resources": [...],
  "prompts": [...]
}
```

### Server Metrics

Get metrics for a running server.

```http
GET /api/servers/{server_id}/metrics
```

**Response:**
```json
{
  "server_id": "context7-mcp",
  "metrics": {
    "requests_total": 1500,
    "requests_per_minute": 25,
    "average_response_time": 150,
    "error_rate": 0.02,
    "uptime_seconds": 3600,
    "memory": {
      "used": 268435456,
      "limit": 536870912,
      "percentage": 50
    },
    "cpu": {
      "usage": 0.25,
      "limit": 0.5,
      "percentage": 50
    }
  }
}
```

---

## WebSocket & SSE

### WebSocket Connection

Connect via WebSocket for bidirectional communication.

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['deployments', 'orchestration']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### SSE Endpoints

All SSE endpoints support the following:

```http
GET /api/events/{channel}
Accept: text/event-stream
```

Available channels:
- `deployments`: Deployment status updates
- `orchestration`: Task execution updates
- `logs`: Real-time log streaming
- `metrics`: Server metrics updates

---

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages.

### Error Response Format

```json
{
  "error": {
    "code": "DEPLOYMENT_FAILED",
    "message": "Failed to deploy server: Docker daemon not running",
    "details": {
      "server_id": "context7-mcp",
      "method": "docker"
    },
    "timestamp": "2025-01-15T10:00:00Z",
    "request_id": "req-123456"
  }
}
```

### Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., server already deployed)
- `422 Unprocessable Entity`: Valid request but semantic errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Common Error Codes

- `DISCOVERY_FAILED`: GitHub API error or rate limit
- `DEPLOYMENT_FAILED`: Docker/NPX/E2B deployment error
- `ORCHESTRATION_FAILED`: Gemini API error or MCP connection failed
- `SERVER_NOT_FOUND`: Requested server not found
- `SERVER_NOT_RUNNING`: Server is not running
- `INVALID_CONFIGURATION`: Invalid deployment configuration
- `GEMINI_API_ERROR`: Gemini API key missing or invalid
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

## Rate Limiting

API rate limits to prevent abuse:

- **Discovery**: 100 requests per hour
- **Deployment**: 20 deployments per hour
- **Orchestration**: 500 requests per hour
- **Logs/Metrics**: 1000 requests per hour

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705316400
```

---

## Examples

### Complete Workflow Example

```python
import requests
import json

# Base URL
BASE_URL = "http://localhost:8000"

# 1. Discover servers
discover_response = requests.post(f"{BASE_URL}/api/discover", json={
    "query": "context7 mcp",
    "limit": 10
})
servers = discover_response.json()["servers"]
server_id = servers[0]["id"]

# 2. Deploy server
deploy_response = requests.post(f"{BASE_URL}/api/deploy/{server_id}", json={
    "method": "docker",
    "configuration": {
        "port": 3000,
        "memory_limit": "512m",
        "auto_restart": True
    }
})
deployment = deploy_response.json()["deployment"]

# 3. Execute orchestration task
orchestrate_response = requests.post(f"{BASE_URL}/api/orchestrate", json={
    "server_id": server_id,
    "prompt": "Get React documentation about hooks"
})
result = orchestrate_response.json()

print(f"Task completed: {result['gemini_response']}")

# 4. Stop server
stop_response = requests.post(f"{BASE_URL}/api/servers/{server_id}/stop")
print(f"Server stopped: {stop_response.json()['status']}")
```

### SSE Streaming Example

```javascript
const eventSource = new EventSource(
  `http://localhost:8000/api/orchestrate/stream?server_id=context7-mcp&prompt=Get React docs`
);

eventSource.addEventListener('plan_ready', (event) => {
  const data = JSON.parse(event.data);
  console.log('Execution plan:', data.plan);
});

eventSource.addEventListener('tool_result', (event) => {
  const data = JSON.parse(event.data);
  console.log('Tool result:', data.result);
});

eventSource.addEventListener('gemini_response', (event) => {
  const data = JSON.parse(event.data);
  console.log('AI Response:', data.response);
  eventSource.close();
});

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  eventSource.close();
};
```

---

## Environment Variables

Required environment variables for the API:

```bash
# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# GitHub Configuration (optional, for higher rate limits)
GITHUB_TOKEN=your-github-token

# Docker Configuration
DOCKER_HOST=unix:///var/run/docker.sock

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3002

# Database (future implementation)
DATABASE_URL=postgresql://user:pass@localhost/insightloop

# Redis (for caching and rate limiting)
REDIS_URL=redis://localhost:6379
```

---

## Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - DOCKER_HOST=/var/run/docker.sock
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

---

## Security Considerations

1. **Authentication**: Implement JWT or OAuth2 in production
2. **Rate Limiting**: Use Redis for distributed rate limiting
3. **Input Validation**: Validate all inputs with Pydantic
4. **Docker Security**: Run containers with limited privileges
5. **Environment Variables**: Use secrets management service
6. **CORS**: Configure allowed origins properly
7. **HTTPS**: Use TLS certificates in production
8. **API Keys**: Rotate keys regularly
9. **Logging**: Log all API access for auditing
10. **Container Isolation**: Use network policies

---

## Support

For support and questions:

- **GitHub Issues**: [github.com/insightloop/mcp-orchestrator](https://github.com/insightloop/mcp-orchestrator)
- **Documentation**: [docs.insightloop.io](https://docs.insightloop.io)
- **Discord**: [discord.gg/insightloop](https://discord.gg/insightloop)

---

**Version**: 1.0.0  
**Last Updated**: January 15, 2025  
**License**: MIT