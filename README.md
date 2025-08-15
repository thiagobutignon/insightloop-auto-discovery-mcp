# MCP Orchestrator API

A powerful FastAPI-based orchestration system for discovering, deploying, and managing Model Context Protocol (MCP) servers from GitHub repositories, with built-in Gemini AI integration and universal protocol support.

## 🌟 Key Features

- **🔍 Auto-Discovery**: Search and discover MCP servers from GitHub repositories
- **🚀 Multi-Method Deployment**: Deploy servers using Docker, NPX, E2B, or local methods
- **🤖 AI Orchestration**: Integrate with Google Gemini for intelligent task execution
- **🔌 Universal Protocol Support**: Automatic detection of JSON-RPC, SSE, WebSocket, and stdio protocols
- **🔄 Smart Fallback**: Multiple endpoint patterns with automatic fallback strategy
- **📊 Real-time Monitoring**: Track server status and capabilities
- **🛠️ Tool Invocation**: Direct tool execution on deployed MCP servers
- **💾 Caching System**: Efficient caching for discovered servers

## 📐 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   GitHub API    │────▶│  MCP Orchestrator │────▶│   MCP Servers   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌──────────────┐          ┌──────────────┐
                        │  Gemini AI   │          │ Universal MCP │
                        └──────────────┘          │    Client     │
                                                   └──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Docker (optional, for Docker deployments)
- Git
- API Keys: GitHub Token (optional), Gemini API Key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcp-orchestrator.git
cd mcp-orchestrator
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

### Running the API

```bash
# Development mode with auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or use the provided script
./run.sh

# Or run directly
python main.py
```

The API will be available at `http://localhost:8000`

## 📖 API Documentation

Interactive documentation available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Core Endpoints

#### ✅ Health Check
```bash
GET /health
```
Response:
```json
{
  "status": "healthy",
  "servers_registered": 3
}
```

#### 🔍 Discovery
```bash
POST /api/discover
```
Request:
```json
{
  "query": "mcp model context protocol",
  "limit": 10,
  "auto_deploy": false
}
```

#### 🚀 Deployment
```bash
POST /api/deploy
```
Request:
```json
{
  "github_url": "https://github.com/user/mcp-server",
  "method": "auto",
  "port": 3000
}
```

#### 📋 List Servers
```bash
GET /api/servers
GET /api/servers?status=deployed
GET /api/servers?method=docker
```

#### 🔎 Get Server Details
```bash
GET /api/servers/{server_id}
```

#### 🤖 Orchestration (JSON Response)
```bash
POST /api/orchestrate
```
Request:
```json
{
  "server_id": "server-id-here",
  "prompt": "Get React documentation about hooks",
  "context": {}
}
```

#### 🚀 Orchestration with Streaming (SSE)
```bash
POST /api/orchestrate/stream
```
Real-time streaming endpoint that returns Server-Sent Events:
```bash
curl -N -X POST http://localhost:8000/api/orchestrate/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "server_id": "server-id",
    "prompt": "Your question here"
  }'
```

Stream events include:
- `start` - Orchestration started
- `connecting` - Connecting to MCP server
- `discovering` - Discovering capabilities
- `capabilities` - Server capabilities found
- `planning` - Gemini generating plan
- `plan_ready` - Execution plan ready
- `executing_step` - Executing plan step
- `invoking_tool` - Invoking MCP tool
- `tool_result` - Tool execution result
- `gemini_response` - **Gemini's final response**
- `complete` - Orchestration complete

#### 📝 Register External Server
```bash
POST /api/register
```
Register an already running MCP server:
```json
{
  "name": "my-server",
  "endpoint": "http://localhost:3000",
  "github_url": "https://github.com/user/repo"
}
```

#### 🛠️ Tool Invocation
```bash
POST /api/invoke
```
Request:
```json
{
  "server_id": "server-id-here",
  "tool_name": "get-docs",
  "args": {"topic": "routing"}
}
```

## 🔌 Universal MCP Client

The system includes a powerful universal MCP client (`mcp_client_universal.py`) that automatically detects and adapts to different MCP protocols.

### Supported Protocols

| Protocol | Description | Use Case |
|----------|-------------|----------|
| **HTTP JSON-RPC** | Standard JSON-RPC over HTTP | Most common MCP servers |
| **SSE** | Server-Sent Events for streaming | Real-time updates, Context7 |
| **WebSocket** | Bidirectional real-time | Interactive tools |
| **stdio** | Process-based communication | Local tools, CLI integrations |

### Automatic Endpoint Detection

The client automatically tries these endpoint patterns:
- `/mcp` - Standard MCP endpoint
- `/sse` - SSE endpoint
- `/api` - Generic API endpoint
- `/jsonrpc` - JSON-RPC endpoint
- `/.well-known/mcp` - Well-known MCP
- `/v1/mcp` - Versioned endpoint
- `/mcp/v1` - Alternative versioned
- Root `/` - Fallback to root

## 🔧 Deployment Methods

### 🐳 Docker Deployment
```python
{
  "method": "docker",
  "description": "Builds and runs Docker containers",
  "ideal_for": "Production, isolated environments"
}
```

### 📦 NPX Deployment
```python
{
  "method": "npx",
  "description": "Uses NPX for Node.js packages",
  "ideal_for": "Published npm packages"
}
```

### 🔒 E2B Deployment
```python
{
  "method": "e2b",
  "description": "Sandboxed cloud environments",
  "ideal_for": "Untrusted code, testing"
}
```

### 💻 Local Deployment
```python
{
  "method": "local",
  "description": "Direct execution on host",
  "ideal_for": "Development, Python servers"
}
```

## ⚙️ Configuration

### Environment Variables

```env
# GitHub API (optional, increases rate limits)
GITHUB_TOKEN=your_github_token

# Gemini AI for orchestration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# MCP Server Configuration
MCP_DEFAULT_PORT=3000
MCP_DISCOVERY_TIMEOUT=10

# Docker Configuration
DOCKER_REGISTRY=ghcr.io
DOCKER_NAMESPACE=your-namespace

# E2B Configuration (optional)
E2B_API_KEY=your_e2b_api_key

# Redis Cache (optional)
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
LOG_LEVEL=info
```

## 🧪 Testing

### Test All Endpoints
```bash
# Using curl
./test_endpoints.sh

# Test specific endpoint
curl -s http://localhost:8000/health | jq

# Test discovery
curl -X POST http://localhost:8000/api/discover \
  -H "Content-Type: application/json" \
  -d '{"query": "mcp context", "limit": 5}' | jq
```

### Test Universal Client
```bash
# Test client with different protocols
python mcp_client_universal.py

# Test SSE client specifically
python mcp_sse_client.py
```

## 📁 Project Structure

```
mcp-orchestrator/
├── main.py                    # FastAPI application
├── mcp_client_universal.py    # Universal MCP client with protocol detection
├── mcp_sse_client.py         # SSE-specific client implementation
├── requirements.txt          # Python dependencies
├── .env.example             # Environment variables template
├── .env                     # Your configuration (gitignored)
├── .gitignore              # Git ignore rules
├── run.sh                  # Startup script
├── docker-compose.yml      # Docker compose configuration
├── Dockerfile              # Docker image definition
└── README.md              # This file
```

## 📊 API Response Examples

### Discovery Response
```json
{
  "id": "1e2345276002",
  "name": "microsoft/mcp-for-beginners",
  "github_url": "https://github.com/microsoft/mcp-for-beginners",
  "description": "MCP fundamentals course",
  "deploy_method": "auto",
  "status": "discovered",
  "endpoint": null,
  "capabilities": null,
  "created_at": "2025-01-15T10:30:00"
}
```

### Deployed Server Response
```json
{
  "id": "ed795d722cb5",
  "name": "fastapi_mcp",
  "github_url": "https://github.com/tadata-org/fastapi_mcp",
  "deploy_method": "docker",
  "status": "deployed",
  "endpoint": "http://localhost:3001",
  "capabilities": {
    "tools": [
      {
        "name": "get-docs",
        "description": "Retrieve documentation"
      }
    ],
    "resources": [],
    "protocol": "http_jsonrpc"
  }
}
```

### Orchestration Response
```json
{
  "status": "completed",
  "prompt": "Get React hooks documentation",
  "server": "server-id",
  "protocol": "sse",
  "plan": [
    {
      "action": "connect",
      "description": "Connected via sse"
    },
    {
      "action": "invoke",
      "description": "Invoked get-docs tool"
    }
  ],
  "results": {
    "documentation": "..."
  }
}
```

## 🐛 Troubleshooting

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| **Port Already in Use** | `lsof -i :8000` then `kill -9 <PID>` |
| **Docker Build Fails** | Check Docker daemon, verify Dockerfile |
| **Connection Failed** | Verify endpoint accessibility, check protocols |
| **API Key Issues** | Ensure `.env` configured, verify key validity |
| **Rate Limiting** | Add GitHub token, implement request throttling |

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug uvicorn main:app --reload
```

## 🚀 Advanced Features

### Custom Protocol Handlers
```python
from mcp_client_universal import UniversalMCPClient

class CustomMCPClient(UniversalMCPClient):
    async def _send_custom(self, request):
        # Your custom protocol implementation
        pass
```

### Batch Operations
```python
# Deploy multiple servers
servers = await discover_servers("mcp", limit=10)
tasks = [deploy_server(s) for s in servers]
results = await asyncio.gather(*tasks)
```

### Container Naming
Containers are named descriptively:
```
mcp-{repository-name}-port{port}
```
Example: `mcp-context7-port3000`

## 🔒 Security

- **API Keys**: Store securely in `.env`, never commit
- **GitHub Token**: Use minimum required permissions
- **Sandboxing**: Use E2B for untrusted code
- **Network**: Configure firewall rules for deployed servers
- **HTTPS**: Use reverse proxy (Nginx) for production

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📜 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Model Context Protocol (MCP) specification
- FastAPI framework
- Google Gemini AI
- GitHub API
- All MCP server developers

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues first
- Provide detailed error logs

---

Built with ❤️ for the MCP community